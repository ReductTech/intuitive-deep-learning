import type { InputHTMLAttributes, ReactNode } from 'react';

export interface ChartTraceCheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export function ChartTraceCheckbox({
  label,
  ...props
}: ChartTraceCheckboxProps) {
  return (
    <label className="edu-check edu-check--option">
      <input {...props} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}
