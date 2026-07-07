import type { ReactNode } from 'react';
import { tint, readableTextColor } from '@/utils/color';
import { XIcon } from './icons';

interface ChipProps {
  label: string;
  color: string;
  onRemove?: () => void;
  children?: ReactNode;
}

export function Chip({ label, color, onRemove, children }: ChipProps) {
  const background = tint(color, 0.82);
  const textColor = readableTextColor(background);

  return (
    <span
      className="lcrm-chip animate-fade-in"
      style={{ backgroundColor: background, color: textColor }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${label} tag`} className="lcrm-chip-remove">
          <XIcon width={10} height={10} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}
