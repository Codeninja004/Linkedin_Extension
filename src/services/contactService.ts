import type { Contact, LinkedInProfileData, PipelineStage, Priority, Temperature } from '@/types';
import { PIPELINE_STAGE_LABELS, PRIORITY_LABELS, TEMPERATURE_LABELS } from '@/types/contact';
import { createEmptyReminder } from '@/types/reminder';
import { StorageService } from '@/storage';
import { generateId } from '@/utils/id';
import { nowIso } from '@/utils/date';
import { withActivity } from './activityService';

/**
 * Looks up a contact already tracked for this LinkedIn URL and, if found,
 * refreshes its read-only fields (name/headline/company/location/photo can
 * drift over time) and `lastViewed` timestamp. Returns null — and does NOT
 * write anything — if this profile has never been added to the list. The
 * caller decides what to do with that (show an "Add Profile to List"
 * prompt), rather than this silently creating a contact on every profile
 * view.
 */
export async function findContactForProfile(profile: LinkedInProfileData): Promise<Contact | null> {
  const existing = await StorageService.getContactByUrl(profile.linkedinUrl);
  if (!existing) return null;

  const now = nowIso();
  const refreshed: Contact = {
    ...existing,
    name: profile.name || existing.name,
    headline: profile.headline || existing.headline,
    company: profile.company || existing.company,
    location: profile.location || existing.location,
    photo: profile.photo || existing.photo,
    lastViewed: now,
    updatedAt: now,
  };
  await StorageService.saveContact(refreshed);
  return refreshed;
}

/**
 * Explicitly creates a new tracked contact from scraped profile data — only
 * called when the user clicks "Add Profile to List". `listIds` seeds the
 * lists (target audiences) the contact starts out in, chosen from the
 * add-to-profile dropdown.
 */
export async function createContactFromProfile(
  profile: LinkedInProfileData,
  listIds: string[] = []
): Promise<Contact> {
  const now = nowIso();

  let created: Contact = {
    id: generateId(),
    ...profile,
    stage: 'lead',
    priority: 'medium',
    temperature: 'warm',
    tagIds: [],
    listIds: [...listIds],
    note: { content: '', lastEdited: null },
    reminder: createEmptyReminder(),
    activities: [],
    createdAt: now,
    updatedAt: now,
    lastViewed: now,
  };

  created = withActivity(created, 'profile_created', `Added ${profile.name || 'this profile'} to the list.`);
  await StorageService.saveContact(created);
  return created;
}

export async function addListToContact(contactId: string, listId: string, listName: string): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return null;
  const listIds = contact.listIds ?? [];
  if (listIds.includes(listId)) return contact;

  const updated = withActivity(
    { ...contact, listIds: [...listIds, listId], updatedAt: nowIso() },
    'list_added',
    `Added to list "${listName}".`
  );
  await StorageService.saveContact(updated);
  return updated;
}

export async function removeListFromContact(contactId: string, listId: string, listName: string): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return null;
  const listIds = contact.listIds ?? [];
  if (!listIds.includes(listId)) return contact;

  const updated = withActivity(
    { ...contact, listIds: listIds.filter((l) => l !== listId), updatedAt: nowIso() },
    'list_removed',
    `Removed from list "${listName}".`
  );
  await StorageService.saveContact(updated);
  return updated;
}

export async function setStage(contactId: string, stage: PipelineStage): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return null;
  if (contact.stage === stage) return contact;

  const updated = withActivity(
    { ...contact, stage, updatedAt: nowIso() },
    'status_changed',
    `Stage changed from "${PIPELINE_STAGE_LABELS[contact.stage]}" to "${PIPELINE_STAGE_LABELS[stage]}".`
  );
  await StorageService.saveContact(updated);
  return updated;
}

export async function setPriority(contactId: string, priority: Priority): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return null;
  if (contact.priority === priority) return contact;

  const updated = withActivity(
    { ...contact, priority, updatedAt: nowIso() },
    'priority_changed',
    `Priority changed from "${PRIORITY_LABELS[contact.priority]}" to "${PRIORITY_LABELS[priority]}".`
  );
  await StorageService.saveContact(updated);
  return updated;
}

export async function setTemperature(contactId: string, temperature: Temperature): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return null;
  if (contact.temperature === temperature) return contact;

  const updated = withActivity(
    { ...contact, temperature, updatedAt: nowIso() },
    'temperature_changed',
    `Lead temperature changed from "${TEMPERATURE_LABELS[contact.temperature]}" to "${TEMPERATURE_LABELS[temperature]}".`
  );
  await StorageService.saveContact(updated);
  return updated;
}

export async function addTagToContact(contactId: string, tagId: string, tagName: string): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return null;
  if (contact.tagIds.includes(tagId)) return contact;

  const updated = withActivity(
    { ...contact, tagIds: [...contact.tagIds, tagId], updatedAt: nowIso() },
    'tag_added',
    `Tag "${tagName}" added.`
  );
  await StorageService.saveContact(updated);
  return updated;
}

export async function removeTagFromContact(contactId: string, tagId: string, tagName: string): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return null;
  if (!contact.tagIds.includes(tagId)) return contact;

  const updated = withActivity(
    { ...contact, tagIds: contact.tagIds.filter((t) => t !== tagId), updatedAt: nowIso() },
    'tag_removed',
    `Tag "${tagName}" removed.`
  );
  await StorageService.saveContact(updated);
  return updated;
}

/**
 * Autosaved note update — called once per debounced pause in typing (not
 * per keystroke), so it both updates the note content and logs a single
 * timeline entry in one read/write round trip rather than two.
 */
export async function persistNote(contactId: string, content: string): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return null;

  const updated = withActivity(
    { ...contact, note: { content, lastEdited: nowIso() }, updatedAt: nowIso() },
    'note_updated',
    'Note updated.'
  );
  await StorageService.saveContact(updated);
  return updated;
}

export async function addManualActivity(contactId: string, description: string): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return null;
  const updated = withActivity(contact, 'manual_activity', description);
  await StorageService.saveContact(updated);
  return updated;
}

export async function deleteContact(contactId: string): Promise<void> {
  await StorageService.deleteContact(contactId);
}
