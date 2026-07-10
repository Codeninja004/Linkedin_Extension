import type { StorageSchema, Template } from '@/types';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { generateId } from '@/utils/id';
import { nowIso } from '@/utils/date';

export function starterTemplatesFallback(): Record<string, Template> {
  const now = nowIso();
  const make = (partial: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Template => ({
    ...partial,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  });

  const templates = [
    make({
      name: 'Connection Request',
      category: 'connection_request',
      content:
        "Hi {{first_name}}, I came across your profile and would love to connect. I see you're at {{company}} — would be great to stay in touch!",
    }),
    make({
      name: 'Friendly Follow Up',
      category: 'follow_up',
      content:
        "Hey {{first_name}}, just checking in — it's been a bit since we last spoke. How have things been at {{company}}?",
    }),
    make({
      name: 'Meeting Request',
      category: 'meeting_request',
      content:
        "Hi {{first_name}}, would you be open to a quick 15-minute call this week? I'd love to learn more about your work as {{headline}}.",
    }),
  ];

  return Object.fromEntries(templates.map((t) => [t.id, t]));
}

/** Fresh, empty schema used the very first time the extension runs. */
export function createDefaultSchema(): StorageSchema {
  return {
    contacts: {},
    lists: {},
    tags: {},
    templates: starterTemplatesFallback(),
    settings: { ...DEFAULT_SETTINGS },
  };
}
