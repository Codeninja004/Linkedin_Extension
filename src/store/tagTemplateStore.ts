import { create } from 'zustand';
import type { ContactList, Tag, Template } from '@/types';
import { StorageService } from '@/storage';
import * as tagService from '@/services/tagService';
import * as listService from '@/services/listService';
import type { CreateListInput } from '@/services/listService';
import * as templateService from '@/services/templateService';
import type { CreateTemplateInput } from '@/services/templateService';

interface TagTemplateState {
  tags: Tag[];
  lists: ContactList[];
  templates: Template[];

  loadTags: () => Promise<void>;
  loadLists: () => Promise<void>;
  loadTemplates: () => Promise<void>;

  getOrCreateTag: (name: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;

  createList: (input: CreateListInput) => Promise<ContactList>;
  getOrCreateList: (name: string) => Promise<ContactList>;
  updateList: (id: string, updates: Partial<CreateListInput>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;

  createTemplate: (input: CreateTemplateInput) => Promise<Template>;
  updateTemplate: (id: string, updates: Partial<CreateTemplateInput>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTagTemplateStore = create<TagTemplateState>((set, get) => ({
  tags: [],
  lists: [],
  templates: [],

  loadTags: async () => {
    const tags = await StorageService.getTags();
    set({ tags });
  },

  loadLists: async () => {
    const lists = await StorageService.getLists();
    set({ lists });
  },

  loadTemplates: async () => {
    const templates = await StorageService.getTemplates();
    set({ templates });
  },

  getOrCreateTag: async (name) => {
    const tag = await tagService.getOrCreateTag(name);
    if (!get().tags.some((t) => t.id === tag.id)) {
      set((s) => ({ tags: [...s.tags, tag] }));
    }
    return tag;
  },

  deleteTag: async (id) => {
    await tagService.deleteTag(id);
    set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }));
  },

  createList: async (input) => {
    const list = await listService.createList(input);
    if (!get().lists.some((l) => l.id === list.id)) {
      set((s) => ({ lists: [...s.lists, list] }));
    }
    return list;
  },

  getOrCreateList: async (name) => {
    const list = await listService.getOrCreateList(name);
    if (!get().lists.some((l) => l.id === list.id)) {
      set((s) => ({ lists: [...s.lists, list] }));
    }
    return list;
  },

  updateList: async (id, updates) => {
    const updated = await listService.updateList(id, updates);
    if (updated) {
      set((s) => ({ lists: s.lists.map((l) => (l.id === id ? updated : l)) }));
    }
  },

  deleteList: async (id) => {
    await listService.deleteList(id);
    set((s) => ({ lists: s.lists.filter((l) => l.id !== id) }));
  },

  createTemplate: async (input) => {
    const template = await templateService.createTemplate(input);
    set((s) => ({ templates: [...s.templates, template] }));
    return template;
  },

  updateTemplate: async (id, updates) => {
    const updated = await templateService.updateTemplate(id, updates);
    if (updated) {
      set((s) => ({ templates: s.templates.map((t) => (t.id === id ? updated : t)) }));
    }
  },

  deleteTemplate: async (id) => {
    await templateService.deleteTemplate(id);
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
  },
}));
