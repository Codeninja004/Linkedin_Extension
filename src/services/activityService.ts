import type { Activity, ActivityType, Contact } from '@/types';
import { generateId } from '@/utils/id';
import { nowIso } from '@/utils/date';

function createActivity(
  type: ActivityType,
  description: string,
  metadata?: Record<string, unknown>
): Activity {
  return {
    id: generateId(),
    type,
    description,
    timestamp: nowIso(),
    metadata,
  };
}

/**
 * Appends a new activity to a contact's timeline, newest entries first.
 * Pure function — callers are responsible for persisting the returned
 * contact via StorageService.
 */
export function withActivity(
  contact: Contact,
  type: ActivityType,
  description: string,
  metadata?: Record<string, unknown>
): Contact {
  const activity = createActivity(type, description, metadata);
  return {
    ...contact,
    activities: [activity, ...contact.activities],
  };
}
