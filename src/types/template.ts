export type TemplateCategory =
  | 'connection_request'
  | 'follow_up'
  | 'introduction'
  | 'meeting_request'
  | 'thank_you'
  | 'other';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** Supported `{{variable}}` tokens inside template content. */
export type TemplateVariable = 'first_name' | 'last_name' | 'company' | 'headline';

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  'first_name',
  'last_name',
  'company',
  'headline',
];

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  connection_request: 'Connection Request',
  follow_up: 'Follow Up',
  introduction: 'Introduction',
  meeting_request: 'Meeting Request',
  thank_you: 'Thank You',
  other: 'Other',
};
