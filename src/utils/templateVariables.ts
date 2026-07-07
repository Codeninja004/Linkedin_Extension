import type { Contact } from '@/types';

/** Splits a LinkedIn display name into first/last for template interpolation. */
function splitName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

/**
 * Replaces {{first_name}}, {{last_name}}, {{company}}, {{headline}} tokens
 * in a template's content with the given contact's live field values.
 */
export function renderTemplate(content: string, contact: Contact): string {
  const { firstName, lastName } = splitName(contact.name);
  const replacements: Record<string, string> = {
    first_name: firstName,
    last_name: lastName,
    company: contact.company || '',
    headline: contact.headline || '',
  };

  return content.replace(/{{\s*(\w+)\s*}}/g, (match, token: string) => {
    return token in replacements ? replacements[token] : match;
  });
}
