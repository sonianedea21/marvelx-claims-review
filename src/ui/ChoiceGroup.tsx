import { cx } from './cx';

type ChoiceGroupProps<T extends string> = {
  name: string;
  legend: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  className?: string;
};

/** A small set of radio buttons drawn as pills (yes / no, filters). Native radios underneath. */
export function ChoiceGroup<T extends string>({ name, legend, options, value, onChange, className }: ChoiceGroupProps<T>) {
  return (
    <fieldset className={cx('space-y-1.5', className)}>
      <legend className="mb-1.5 text-sm font-medium text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cx(
              'inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium',
              'has-focus-visible:focus-ring',
              value === option.value
                ? 'border-ink bg-ink text-ink-inverse'
                : 'border-line-input bg-surface text-ink hover:border-ink',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
