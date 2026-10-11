#!/usr/bin/env python3
"""Evaluate FlyWise's saved XGBoost model on the original held-out split.

IMPORTANT: Exact training-notebook parity requires supplying a feature specification
(--feature-spec) that matches the original notebook's feature engineering, and
matching its cleaning/order/split sequence. See evaluation_config.example.json.
"""
import argparse
import hashlib
import json
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
import xgboost as xgb
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix)
from sklearn.model_selection import train_test_split


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def find_column(df, name):
    if name in df.columns:
        return name
    matches = [c for c in df.columns if c.casefold() == name.casefold()]
    if len(matches) != 1:
        raise ValueError(f"Column {name!r} not found uniquely; available: {list(df.columns)}")
    return matches[0]


def feature_list(path):
    data = json.loads(path.read_text(encoding='utf-8'))
    if isinstance(data, list):
        return data
    for key in ('feature_columns', 'features', 'columns'):
        if isinstance(data, dict) and isinstance(data.get(key), list):
            return data[key]
    raise ValueError('feature_columns.json must contain a list or a feature_columns/features/columns list')


def build_features(df, config):
    # Explicit feature specification avoids silently guessing training transformations.
    spec = config['features']
    if len(spec) != 11:
        raise ValueError(f'Expected 11 features, got {len(spec)}')
    out = pd.DataFrame(index=df.index)
    for feature, rule in spec.items():
        kind = rule['kind']
        if kind == 'column':
            out[feature] = df[find_column(df, rule['source'])]
        elif kind == 'datetime_part':
            dates = pd.to_datetime(df[find_column(df, rule['source'])], errors='coerce')
            part = rule['part']
            if part not in ('year', 'month', 'day', 'dayofweek', 'quarter'):
                raise ValueError(f'Unsupported datetime part: {part}')
            out[feature] = getattr(dates.dt, part)
        elif kind in ('hhmm_hour', 'hhmm_minute'):
            s = df[find_column(df, rule['source'])].astype('string').str.strip().str.replace(r'\.0$', '', regex=True)
            colon = s.str.contains(':', na=False)
            hour = pd.Series(np.nan, index=df.index, dtype='float64')
            minute = pd.Series(np.nan, index=df.index, dtype='float64')
            hour.loc[colon] = pd.to_numeric(s.loc[colon].str.split(':').str[0], errors='coerce')
            minute.loc[colon] = pd.to_numeric(s.loc[colon].str.split(':').str[1], errors='coerce')
            numeric = pd.to_numeric(s.loc[~colon], errors='coerce')
            hour.loc[~colon] = numeric // 100
            minute.loc[~colon] = numeric % 100
            out[feature] = hour.replace(24, 0) if kind == 'hhmm_hour' else minute
        else:
            raise ValueError(f'Unsupported rule for {feature}: {kind}')
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--artifacts', type=Path, required=True)
    parser.add_argument('--feature-spec', type=Path, required=True, help='Exact training feature and cleaning configuration JSON')
    parser.add_argument('--out', type=Path, default=Path('evidence/model_evaluation'))
    args = parser.parse_args()

    model_file = args.artifacts / 'xgb_model.json'
    prep_file = args.artifacts / 'preprocessor.pkl'
    cols_file = args.artifacts / 'feature_columns.json'
    inputs = [args.data, args.feature_spec, model_file, prep_file, cols_file]
    for path in inputs:
        if not path.is_file():
            parser.error(f'Missing required file: {path}')

    config = json.loads(args.feature_spec.read_text(encoding='utf-8'))
    if config.get('verified_against_training_notebook') is not True:
        parser.error('Set verified_against_training_notebook=true ONLY after checking the exact training code.')
    if config.get('cleaning_order') != 'filter_then_engineer_then_split':
        parser.error('This script requires verified cleaning_order=filter_then_engineer_then_split.')

    df = pd.read_csv(args.data, low_memory=False)
    counts = {'input_rows': len(df)}
    df = df.drop_duplicates()
    counts['after_duplicates'] = len(df)
    cleaning = config['cleaning']
    for name in ('cancelled', 'diverted'):
        col = find_column(df, cleaning[name])
        vals = pd.to_numeric(df[col], errors='coerce')
        df = df.loc[vals.eq(0)].copy()
        counts[f'after_{name}_filter'] = len(df)

    date_col = find_column(df, cleaning['date'])
    dates = pd.to_datetime(df[date_col], errors='coerce', format=cleaning.get('date_format'))
    df = df.loc[dates.notna()].copy()
    counts['after_invalid_date_filter'] = len(df)

    target_col = find_column(df, cleaning['target'])
    targets = pd.to_numeric(df[target_col], errors='coerce')
    df = df.loc[targets.notna()].copy()
    y = targets.loc[df.index]
    if not y.isin([0, 1]).all():
        raise ValueError('Target is not binary 0/1 after cleaning')
    y = y.astype('int8')
    counts['after_missing_target_filter'] = len(df)
    if y.nunique() != 2:
        raise ValueError('Need both target classes for stratified split')

    X = build_features(df, config)
    expected = feature_list(cols_file)
    if len(expected) != 11 or len(set(expected)) != 11:
        raise ValueError('Saved feature_columns.json does not list 11 unique features')
    if list(X.columns) != expected:
        raise ValueError(f'Feature names/order mismatch!\nBuilt: {list(X.columns)}\nSaved: {expected}')

    # Do not sort, shuffle, reset the index or drop rows before this split.
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    counts['test_rows'] = len(y_test)
    counts['train_rows'] = len(y) - len(y_test)

    preprocessor = joblib.load(prep_file)  # Load only trusted artefacts.
    X_transformed = preprocessor.transform(X_test)
    model = xgb.XGBClassifier()
    model.load_model(str(model_file))
    scores = model.predict_proba(X_transformed)[:, 1]
    predictions = (scores >= 0.5).astype(int)
    baseline = np.zeros(len(y_test), dtype=int)

    def metrics(pred, prob=None):
        result = {
            'accuracy': float(accuracy_score(y_test, pred)),
            'precision': float(precision_score(y_test, pred, zero_division=0)),
            'recall': float(recall_score(y_test, pred, zero_division=0)),
            'f1': float(f1_score(y_test, pred, zero_division=0)),
            'confusion_matrix': confusion_matrix(y_test, pred, labels=[0, 1]).tolist()
        }
        result['roc_auc'] = float(roc_auc_score(y_test, prob)) if prob is not None else None
        return result

    result = metrics(predictions, scores)
    base = metrics(baseline)
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / 'metrics.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    (args.out / 'baseline_metrics.json').write_text(json.dumps(base, indent=2), encoding='utf-8')
    cm = result['confusion_matrix']
    pd.DataFrame(cm, index=['actual_0', 'actual_1'], columns=['predicted_0', 'predicted_1']).to_csv(args.out / 'confusion_matrix.csv')
    summary = {
        'executed_at_utc': datetime.now(timezone.utc).isoformat(),
        'command': ' '.join([sys.executable, *sys.argv]),
        'counts': counts,
        'target_distribution_test': {str(k): int(v) for k, v in y_test.value_counts().items()},
        'threshold': 0.5,
        'split': {'test_size': 0.2, 'random_state': 42, 'stratify': True},
        'input_sha256': {str(path): sha256(path) for path in inputs},
        'versions': {'python': platform.python_version(), 'pandas': pd.__version__, 'numpy': np.__version__, 'sklearn': sklearn.__version__, 'xgboost': xgb.__version__},
        'training_parity': 'User-verified configuration; script cannot independently prove notebook equivalence'
    }
    (args.out / 'run_summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print(json.dumps({'metrics': result, 'baseline': base, 'counts': counts, 'output': str(args.out)}, indent=2))


if __name__ == '__main__':
    main()
