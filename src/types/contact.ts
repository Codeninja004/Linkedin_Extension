import type { Activity } from './activity';
import type { Reminder } from './reminder';

export type PipelineStage =
  | 'lead'
  | 'connection_sent'
  | 'connected'
  | 'conversation_started'
  | 'interested'
  | 'meeting_scheduled'
  | 'proposal_sent'
  | 'customer'
  | 'closed_lost';

export type Priority = 'low' | 'medium' | 'high';

export type Temperature = 'cold' | 'warm' | 'hot';

export const PIPELINE_STAGES: PipelineStage[] = [
  'lead',
  'connection_sent',
  'connected',
  'conversation_started',
  'interested',
  'meeting_scheduled',
  'proposal_sent',
  'customer',
  'closed_lost',
];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  lead: 'Lead',
  connection_sent: 'Connection Sent',
  connected: 'Connected',
  conversation_started: 'Conversation Started',
  interested: 'Interested',
  meeting_scheduled: 'Meeting Scheduled',
  proposal_sent: 'Proposal Sent',
  customer: 'Customer',
  closed_lost: 'Closed Lost',
};

export const PRIORITY_LEVELS: Priority[] = ['low', 'medium', 'high'];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const TEMPERATURE_LEVELS: Temperature[] = ['cold', 'warm', 'hot'];

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
  cold: 'Cold',
  warm: 'Warm',
  hot: 'Hot',
};

export interface ContactNote {
  content: string;
  lastEdited: string | null;
}

/**
 * Data scraped directly from a LinkedIn profile page. Kept separate from
 * user-editable CRM fields so it's obvious what's read-only vs. owned by
 * the extension.
 */
export interface LinkedInProfileData {
  linkedinUrl: string;
  name: string;
  headline: string;
  company: string;
  location: string;
  photo: string;
}

export interface Contact extends LinkedInProfileData {
  id: string;
  stage: PipelineStage;
  priority: Priority;
  temperature: Temperature;
  tagIds: string[];
  note: ContactNote;
  reminder: Reminder;
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
  lastViewed: string;
}
