import type { Contact, PipelineStage, Priority, Temperature } from '@/types';
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  PRIORITY_LEVELS,
  PRIORITY_LABELS,
  TEMPERATURE_LEVELS,
  TEMPERATURE_LABELS,
} from '@/types/contact';
import { CollapsibleSection } from './CollapsibleSection';
import { FieldLabel } from './FieldLabel';
import { ZapIcon } from './icons';
import { useContactStore } from '@/store/contactStore';
import { cn } from '@/utils/classnames';

const PRIORITY_DOT: Record<Priority, string> = {
  low: 'bg-neutral-400',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
};

const TEMPERATURE_DOT: Record<Temperature, string> = {
  cold: 'bg-sky-500',
  warm: 'bg-amber-500',
  hot: 'bg-red-500',
};

export function PipelineSection({ contact }: { contact: Contact }) {
  const setStage = useContactStore((s) => s.setStage);
  const setPriority = useContactStore((s) => s.setPriority);
  const setTemperature = useContactStore((s) => s.setTemperature);

  return (
    <CollapsibleSection title="Pipeline" icon={<ZapIcon />}>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <FieldLabel>Stage</FieldLabel>
          <select
            className="lcrm-select"
            value={contact.stage}
            onChange={(e) => setStage(contact.id, e.target.value as PipelineStage)}
          >
            {PIPELINE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {PIPELINE_STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Priority</FieldLabel>
            <div className="relative">
              <span
                className={cn(
                  'absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full',
                  PRIORITY_DOT[contact.priority]
                )}
              />
              <select
                className="lcrm-select pl-6"
                value={contact.priority}
                onChange={(e) => setPriority(contact.id, e.target.value as Priority)}
              >
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Temperature</FieldLabel>
            <div className="relative">
              <span
                className={cn(
                  'absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full',
                  TEMPERATURE_DOT[contact.temperature]
                )}
              />
              <select
                className="lcrm-select pl-6"
                value={contact.temperature}
                onChange={(e) => setTemperature(contact.id, e.target.value as Temperature)}
              >
                {TEMPERATURE_LEVELS.map((t) => (
                  <option key={t} value={t}>
                    {TEMPERATURE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
