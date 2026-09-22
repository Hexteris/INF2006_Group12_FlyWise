import { useId } from 'react';
import type { DimRow } from '../../types';
import { airportLabel } from '../format';
import { FIELD_CLASSES, FIELD_LABEL } from '../styles';

interface DimSelectProps {
  label: string;
  options: DimRow[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  /** Text for the empty option: "All airlines" when filtering, "Select…" when required. */
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * A labelled dropdown over a dimension table. Used by both the filter panel and
 * the prediction form, which between them previously repeated six near-identical
 * selects.
 *
 * The generated id ties the <label> to the <select> via htmlFor. The previous
 * markup had unassociated labels, so clicking one did not focus its control and
 * assistive technology could not announce the field name.
 */
export default function DimSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}: DimSelectProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      <select
        id={id}
        required={required}
        disabled={disabled}
        value={value ?? ''}
        onChange={event => onChange(event.target.value ? Number(event.target.value) : undefined)}
        className={`${FIELD_CLASSES} cursor-pointer disabled:cursor-not-allowed`}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {airportLabel(option.code, option.cityName)}
          </option>
        ))}
      </select>
    </div>
  );
}
