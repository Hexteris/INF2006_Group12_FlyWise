import type { DimRow } from '../../types';

interface Props {
  label: string;
  value: string;
  options: DimRow[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function DimSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'All',
}: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-ink">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-normal text-slate-900 cursor-pointer focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((o) => (
          <option key={o.id} value={o.code}>
            {o.code}
            {o.cityName ? ` – ${o.cityName}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}