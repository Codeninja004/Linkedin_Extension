/**
 * Every mutation that matters to the user is recorded as an Activity so the
 * Timeline section can render a full, chronological history per contact.
 */
export type ActivityType =
  | 'profile_created'
  | 'status_changed'
  | 'priority_changed'
  | 'temperature_changed'
  | 'tag_added'
  | 'tag_removed'
  | 'note_updated'
  | 'reminder_created'
  | 'reminder_completed'
  | 'reminder_snoozed'
  | 'manual_activity';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string; // ISO 8601
  metadata?: Record<string, unknown>;
}
