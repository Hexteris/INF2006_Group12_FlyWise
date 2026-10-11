# Data AI Validation Evidence

This page records the saved-model evaluation results and supplementary website/SQL video evidence.

## Saved-model evaluation

Date: 11 October 2026, 04:55 UTC (12:55 Singapore time).
Objective: Reevaluate the saved FlyWise XGBoost model on the original stratified held-out split and compare an always-on-time baseline.
Setup: flight_data_final.csv and trusted exported model/preprocessor/feature list from the shared Drive model folder. Python 3.13.16, pandas 2.2.3, NumPy 2.1.3, scikit-learn 1.6.1, XGBoost 3.4.1. Dataset and artefact hashes are in model_evaluation/run_summary.json.
Steps: Remove exact duplicates; exclude cancelled/diverted flights; parse flight dates; derive the original 11 features including HH:MM/HHMM schedule parsing; exclude missing targets; recreate 80/20 stratified split with seed 42; transform using saved preprocessing; score saved XGBoost; apply threshold 0.5; calculate metrics and an always-on-time baseline. No model retraining or preprocessor refitting.
Expected: Original eligible/train/test counts and model metrics reproduced.
Actual: 7,001,619 input rows; 6,879,485 eligible; 5,503,588 training and 1,375,897 test rows. Accuracy 0.6463645171113827; precision 0.3394515617957578; recall 0.6661205810618852; F1 0.4497254089461494; ROC-AUC 0.7119549645673597. Confusion matrix [[690502,386907],[99659,198829]]. These match the original recorded values.
Baseline: Always-on-time accuracy 0.7830593423780995; precision, recall and F1 all zero. Model detects delayed flights at the cost of lower overall accuracy and substantial false positives.
Result: The Colab reevaluation successfully reproduced the original recorded model metrics and confusion matrix. 
Limitations: Does not verify that live deployed files match the evaluated exports; does not establish temporal evaluation, PR-AUC, other classifier comparisons or calibrated probabilities. Reproduction requires the full CSV; the submission must supply lawful dataset acquisition instructions.

## Reproduction from ZIP/repository root

```bash
python -m pip install -r analytics/requirements-evaluation.txt
python analytics/evaluate_model.py --data "<path to flight_data_final.csv>" --artifacts "src/ML Model" --feature-spec analytics/evaluation_config.json --out evidence/model_evaluation
```

The original run used shared Drive paths, recorded in run_summary.json. The command above adapts those paths to the final repository layout. Use an adequately provisioned machine or Colab for the full dataset.

## Supporting artefacts
- evidence/model_evaluation/metrics.json
- evidence/model_evaluation/baseline_metrics.json
- evidence/model_evaluation/confusion_matrix.csv
- evidence/model_evaluation/run_summary.json
- evidence/model_evaluation/execution.log
- analytics/evaluate_model.py
- analytics/evaluation_config.json
- analytics/Run_Model_Evaluation_FIXED.ipynb


## Supplementary video evidence

| # | Evidence | Format | Link |
|---|----------|--------|------|
| 1 | FlyWise Test 3 Data Pulling frm Website | Video | [▶ Watch](./evidence_images/Data%20AI%20Validation%20Evidence/FlyWise%20Test%203%20Data%20Pulling%20frm%20Website.mp4) |
| 2 | SQL Query Pulling | Video | [▶ Watch](./evidence_images/Data%20AI%20Validation%20Evidence/SQL%20Query%20Pulling.mp4) |

---

## Media files

### 1. FlyWise Test 3 Data Pulling frm Website

[▶ Open video: FlyWise Test 3 Data Pulling frm Website](./evidence_images/Data%20AI%20Validation%20Evidence/FlyWise%20Test%203%20Data%20Pulling%20frm%20Website.mp4)

---

### 2. SQL Query Pulling

[▶ Open video: SQL Query Pulling](./evidence_images/Data%20AI%20Validation%20Evidence/SQL%20Query%20Pulling.mp4)
