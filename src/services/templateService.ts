import type { Template, TemplateCategory, Contact } from '@/types';
import { StorageService } from '@/storage';
import { generateId } from '@/utils/id';
import { nowIso } from '@/utils/date';
import { renderTemplate } from '@/utils/templateVariables';

export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  content: string;
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template> {
  const now = nowIso();
  const template: Template = { id: generateId(), ...input, createdAt: now, updatedAt: now };
  await StorageService.saveTemplate(template);
  return template;
}

export async function updateTemplate(id: string, updates: Partial<CreateTemplateInput>): Promise<Template | null> {
  const templates = await StorageService.getTemplates();
  const existing = templates.find((t) => t.id === id);
  if (!existing) return null;

  const updated: Template = { ...existing, ...updates, updatedAt: nowIso() };
  await StorageService.saveTemplate(updated);
  return updated;
}

export async function deleteTemplate(id: string): Promise<void> {
  await StorageService.deleteTemplate(id);
}

/** Renders a template's variables against a contact and copies the result to the clipboard. */
export async function copyRenderedTemplate(template: Template, contact: Contact): Promise<string> {
  const rendered = renderTemplate(template.content, contact);
  await navigator.clipboard.writeText(rendered);
  return rendered;
}
