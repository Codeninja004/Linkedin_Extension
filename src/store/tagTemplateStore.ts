import { create } from 'zustand';
import type { Tag, Template } from '@/types';
import { StorageService } from '@/storage';
import * as tagService from '@/services/tagService';
import * as templateService from '@/services/templateService';
import type { CreateTemplateInput } from '@/services/templateService';

interface TagTemplateState {
  tags: Tag[];
  templates: Template[];

  loadTags: () => Promise<void>;
  loadTemplates: () => Promise<void>;

  getOrCreateTag: (name: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;

  createTemplate: (input: CreateTemplateInput) => Promise<Template>;
  updateTemplate: (id: string, updates: Partial<CreateTemplateInput>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTagTemplateStore = create<TagTemplateState>((set, get) => ({
  tags: [],
  templates: [],

  loadTags: async () => {
    const tags = await StorageService.getTags();
    set({ tags });
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
