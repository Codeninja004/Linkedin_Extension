import { cn } from '@/utils/classnames';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * A standard iOS-style switch. Deliberately built from a plain <div> wrapper
 * + <button role="switch"> rather than a native <label> wrapping the
 * button — labels are meant to forward activation to form controls like
 * <input>/<select>, and wrapping a <button> in one is a common source of
 * duplicate/inconsistent click handling across browsers. The label text is
 * a sibling that also toggles, giving the same larger click target without
 * the semantic mismatch.
 */
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  const toggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <div
      className={cn('inline-flex select-none items-center gap-2', disabled ? 'opacity-50' : 'cursor-pointer')}
      onClick={label ? toggle : undefined}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900',
          disabled && 'cursor-not-allowed',
          checked ? 'bg-brand-600' : 'bg-neutral-300 dark:bg-neutral-600'
        )}
      >
        <span
          aria-hidden
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-150 ease-out',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          )}
        />
      </button>
      {label && (
        <span className="text-base text-neutral-700 dark:text-neutral-200">{label}</span>
      )}
    </div>
  );
}
