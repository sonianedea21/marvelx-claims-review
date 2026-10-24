import { cx } from './cx';
import { Icon } from './Icon';

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
    <fieldset className={cx('min-w-0 space-y-1.5', className)}>
      <legend className="mb-1.5 text-sm font-medium text-ink">{legend}</legend>
      {/* One scrolling row on phones, wrapping from sm up. The padding keeps focus rings unclipped. */}
      <div className="-m-1 flex gap-2 overflow-x-auto p-1 sm:flex-wrap sm:overflow-visible">
        {options.map((option) => (
          <label
            key={option.value}
            className={cx(
              'relative inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-full border px-4 text-sm font-medium',
              'has-focus-visible:focus-ring',
              // Selected reads as "chosen" (ink outline + check), not as the ink-filled primary button.
              value === option.value
                ? 'gap-1.5 border-2 border-ink bg-sunken px-3.5 text-ink'
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
            {value === option.value && <Icon name="check" size="sm" />}
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
