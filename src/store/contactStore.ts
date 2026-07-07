import { create } from 'zustand';
import type { Contact, LinkedInProfileData, PipelineStage, Priority, Temperature } from '@/types';
import { StorageService } from '@/storage';
import * as contactService from '@/services/contactService';
import * as reminderService from '@/services/reminderService';
import type { SetReminderInput } from '@/services/reminderService';

interface ContactState {
  /** All contacts, keyed by id — the source of truth for the Dashboard/Popup. Only ever contains contacts the user explicitly added. */
  contacts: Record<string, Contact>;
  /** The contact currently shown in the sidebar (the profile the user is viewing), if it's already on the list. */
  activeContactId: string | null;
  /**
   * A profile that's been detected/scraped but NOT yet added to the list —
   * shown as a preview with an "Add Profile to List" button. Never
   * persisted to chrome.storage.local; purely in-memory until confirmed.
   */
  pendingProfile: LinkedInProfileData | null;
  isLoading: boolean;

  activeContact: () => Contact | null;

  loadAllContacts: () => Promise<void>;
  /** Looks up whether this profile is already on the list; if not, stages it as `pendingProfile` instead of creating anything. */
  detectProfile: (profile: LinkedInProfileData) => Promise<void>;
  /** Persists `pendingProfile` as a new tracked contact — the only place a Contact gets created. */
  addPendingProfileToList: () => Promise<Contact | null>;
  clearActiveContact: () => void;

  // Every mutation below takes an explicit `contactId` rather than reading
  // `activeContactId` internally. This matters for anything that can be
  // deferred (most notably the debounced note autosave): if it read
  // "whichever contact is active right now" at the moment the write
  // actually executes, a fast profile switch during the debounce window
  // would silently write contact A's note onto contact B's record. Callers
  // already have the contact they're editing as a prop, so this is a pure
  // safety improvement with no added ceremony at the call sites.
  setStage: (contactId: string, stage: PipelineStage) => Promise<void>;
  setPriority: (contactId: string, priority: Priority) => Promise<void>;
  setTemperature: (contactId: string, temperature: Temperature) => Promise<void>;
  addTag: (contactId: string, tagId: string, tagName: string) => Promise<void>;
  removeTag: (contactId: string, tagId: string, tagName: string) => Promise<void>;
  updateNoteLocal: (contactId: string, content: string) => void;
  persistNote: (contactId: string, content: string) => Promise<void>;
  setReminder: (contactId: string, input: SetReminderInput) => Promise<void>;
  completeReminder: (contactId: string) => Promise<void>;
  snoozeReminder: (contactId: string, days?: number) => Promise<void>;
  addManualActivity: (contactId: string, description: string) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
}

function upsert(contacts: Record<string, Contact>, contact: Contact): Record<string, Contact> {
  return { ...contacts, [contact.id]: contact };
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: {},
  activeContactId: null,
  pendingProfile: null,
  isLoading: false,

  activeContact: () => {
    const { activeContactId, contacts } = get();
    return activeContactId ? contacts[activeContactId] ?? null : null;
  },

  loadAllContacts: async () => {
    set({ isLoading: true });
    try {
      const list = await StorageService.getContacts();
      set({ contacts: Object.fromEntries(list.map((c) => [c.id, c])) });
    } finally {
      set({ isLoading: false });
    }
  },

  detectProfile: async (profile) => {
    set({ isLoading: true });
    try {
      const existing = await contactService.findContactForProfile(profile);
      if (existing) {
        set((s) => ({ contacts: upsert(s.contacts, existing), activeContactId: existing.id, pendingProfile: null }));
      } else {
        set({ activeContactId: null, pendingProfile: profile });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  addPendingProfileToList: async () => {
    const profile = get().pendingProfile;
    if (!profile) return null;

    set({ isLoading: true });
    try {
      const created = await contactService.createContactFromProfile(profile);
      set((s) => ({ contacts: upsert(s.contacts, created), activeContactId: created.id, pendingProfile: null }));
      return created;
    } finally {
      set({ isLoading: false });
    }
  },

  clearActiveContact: () => set({ activeContactId: null, pendingProfile: null }),

  setStage: async (contactId, stage) => {
    const updated = await contactService.setStage(contactId, stage);
    if (updated) set((s) => ({ contacts: upsert(s.contacts, updated) }));
  },

  setPriority: async (contactId, priority) => {
    const updated = await contactService.setPriority(contactId, priority);
    if (updated) set((s) => ({ contacts: upsert(s.contacts, updated) }));
  },

  setTemperature: async (contactId, temperature) => {
    const updated = await contactService.setTemperature(contactId, temperature);
    if (updated) set((s) => ({ contacts: upsert(s.contacts, updated) }));
  },

  addTag: async (contactId, tagId, tagName) => {
    const updated = await contactService.addTagToContact(contactId, tagId, tagName);
    if (updated) set((s) => ({ contacts: upsert(s.contacts, updated) }));
  },

  removeTag: async (contactId, tagId, tagName) => {
    const updated = await contactService.removeTagFromContact(contactId, tagId, tagName);
    if (updated) set((s) => ({ contacts: upsert(s.contacts, updated) }));
  },

  /** Optimistic, in-memory-only update so the textarea feels instant; persistence is debounced separately. */
  updateNoteLocal: (contactId, content) => {
    set((s) => {
      const existing = s.contacts[contactId];
      if (!existing) return s;
      return {
        contacts: upsert(s.contacts, { ...existing, note: { ...existing.note, content } }),
      };
    });
  },

  persistNote: async (contactId, content) => {
    const updated = await contactService.persistNote(contactId, content);
    if (updated) set((s) => ({ contacts: upsert(s.contacts, updated) }));
  },

  setReminder: async (contactId, input) => {
    const updated = await reminderService.setReminder(contactId, input);
    if (updated) set((s) => ({ contacts: upsert(s.contacts, updated) }));
  },

  completeReminder: async (contactId) => {
    const updated = await reminderService.completeReminder(contactId);
    if (updated) set((s) => ({ contacts: upsert(s.contacts, updated) }));
  },

  snoozeReminder: async (contactId, days = 1) => {
    const updated = await reminderService.snoozeReminder(contactId, days);
    if (updated) set((s) => ({ contacts: upsert(s.contacts, updated) }));
  },

  addManualActivity: async (contactId, description) => {
    const updated = await contactService.addManualActivity(contactId, description);
    if (updated) set((s) => ({ contacts: upsert(s.contacts, updated) }));
  },

  deleteContact: async (contactId) => {
    await contactService.deleteContact(contactId);
    set((s) => {
      const next = { ...s.contacts };
      delete next[contactId];
      return { contacts: next, activeContactId: s.activeContactId === contactId ? null : s.activeContactId };
    });
  },
}));
