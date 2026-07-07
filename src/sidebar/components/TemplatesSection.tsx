import { useState } from 'react';
import type { Contact, Template, TemplateCategory } from '@/types';
import { TEMPLATE_CATEGORY_LABELS } from '@/types/template';
import { CollapsibleSection } from './CollapsibleSection';
import { CopyIcon, PlusIcon, TemplateIcon, TrashIcon } from './icons';
import { useTagTemplateStore } from '@/store/tagTemplateStore';
import { copyRenderedTemplate } from '@/services/templateService';

function TemplateCard({ template, contact }: { template: Template; contact: Contact }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const deleteTemplate = useTagTemplateStore((s) => s.deleteTemplate);

  async function handleCopy() {
    try {
      await copyRenderedTemplate(template, contact);
      setCopyState('copied');
    } catch (error) {
      console.error('[LinkedIn CRM] Failed to copy template to clipboard:', error);
      setCopyState('error');
    } finally {
      setTimeout(() => setCopyState('idle'), 1500);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-neutral-800 dark:text-neutral-100">{template.name}</p>
          <span className="text-xs text-neutral-400">{TEMPLATE_CATEGORY_LABELS[template.category]}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className="lcrm-btn-ghost px-2 py-1" onClick={handleCopy}>
            <CopyIcon />
            {copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Failed' : 'Copy'}
          </button>
          <button
            type="button"
            className="lcrm-btn-ghost px-2 py-1 text-red-500"
            onClick={() => deleteTemplate(template.id)}
            aria-label={`Delete ${template.name} template`}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <p className="mt-2 line-clamp-3 text-sm text-neutral-500 dark:text-neutral-400">{template.content}</p>
    </div>
  );
}

function NewTemplateForm({ onDone }: { onDone: () => void }) {
  const createTemplate = useTagTemplateStore((s) => s.createTemplate);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('other');
  const [content, setContent] = useState('');

  async function handleCreate() {
    if (!name.trim() || !content.trim()) return;
    await createTemplate({ name: name.trim(), category, content: content.trim() });
    onDone();
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 p-3 animate-fade-in">
      <input
        type="text"
        className="lcrm-input"
        placeholder="Template name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        className="lcrm-select"
        value={category}
        onChange={(e) => setCategory(e.target.value as TemplateCategory)}
      >
        {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        className="lcrm-input min-h-[80px]"
        placeholder="Hi {{first_name}}, ..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex gap-2">
        <button type="button" className="lcrm-btn-primary" onClick={handleCreate}>
          Save Template
        </button>
        <button type="button" className="lcrm-btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function TemplatesSection({ contact }: { contact: Contact }) {
  const templates = useTagTemplateStore((s) => s.templates);
  const [showForm, setShowForm] = useState(false);

  return (
    <CollapsibleSection title="Message Templates" icon={<TemplateIcon />} defaultOpen={false}>
      <div className="space-y-2">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} contact={contact} />
        ))}

        {showForm ? (
          <NewTemplateForm onDone={() => setShowForm(false)} />
        ) : (
          <button type="button" className="lcrm-btn-secondary w-full" onClick={() => setShowForm(true)}>
            <PlusIcon /> New Template
          </button>
        )}
      </div>
    </CollapsibleSection>
  );
}
