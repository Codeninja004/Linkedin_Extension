# LinkedIn CRM — Local Contact Manager

A lightweight, **fully offline** Chrome Extension (Manifest V3) that turns LinkedIn into a personal CRM. Visit any profile and a sidebar appears automatically — no "Save Contact" button, no login, no cloud, no backend. Everything (notes, tags, pipeline stage, reminders, templates, activity history) is stored locally in `chrome.storage.local`.

## Tech stack

- React 18 + TypeScript
- Vite 5 (three separate build targets — see [Build architecture](#build-architecture))
- Tailwind CSS 3 (dark mode via `class` strategy)
- Zustand (UI state and data state kept in separate stores)
- `chrome.storage.local` only — no `localStorage`, no network calls, no auth

## Folder structure

```
src/
├── background/        Service worker: reminder alarms, notifications, storage init
│   ├── index.ts
│   ├── alarms.ts
│   ├── notifications.ts
│   └── init.ts
├── content/            Injected into linkedin.com pages
│   ├── index.tsx           Entry point — wires ProfileWatcher + scraper + SidebarController together
│   ├── ProfileWatcher.ts    Detects LinkedIn SPA navigation (pushState/DOM mutations + retry-with-epoch)
│   ├── linkedinScraper.ts   Extracts profile fields from the DOM
│   └── SidebarController.ts Singleton owning the Shadow DOM host + React root lifecycle
├── sidebar/
│   ├── components/      ContactHeader, PipelineSection, TagsSection, NotesSection,
│   │                    ReminderSection, TimelineSection, TemplatesSection, ui bits
│   ├── pages/            ProfilePage, EmptyStatePage
│   ├── hooks/             useNoteAutosave, useDarkMode
│   ├── styles/            tailwind.css (compiled + injected into the Shadow DOM)
│   └── App.tsx
├── popup/               Extension toolbar popup
│   ├── components/       PopupHeader, RemindersSection, RecentContacts, QuickSearch, SettingsPanel
│   ├── PopupApp.tsx
│   └── main.tsx
├── dashboard/           Full-page contact table (opened from the popup)
│   ├── components/       FiltersBar, ContactsTable, ExportImportBar
│   ├── hooks/             useContactsFilter
│   ├── DashboardApp.tsx
│   └── main.tsx
├── store/                Zustand stores: uiStore (ephemeral UI), contactStore, tagTemplateStore (data)
├── storage/              StorageService — the ONLY module allowed to touch chrome.storage.local
├── services/             Business logic: contactService, reminderService, tagService,
│                         templateService, activityService, exportImportService
├── types/                Contact, Tag, Template, Reminder, Activity, Settings, StorageSchema
├── utils/                debounce, date, classnames, templateVariables, color, validation, id
├── hooks/                Cross-context hooks (useAppliedTheme for popup/dashboard dark mode)
└── assets/icons/         Extension icons
```

## Architecture notes

- **StorageService is the only storage boundary.** Every read/write to `chrome.storage.local` goes through `src/storage/StorageService.ts`. React components never call `chrome.storage` directly.
- **Auto-create, never "Save."** `src/services/contactService.ts#getOrCreateContact` looks up a contact by normalized LinkedIn URL; if it doesn't exist, it's created silently the moment the profile is detected.
- **Shadow DOM isolation.** The sidebar is injected into a `<div id="linkedin-crm-sidebar-host">` with an open Shadow Root, owned by the `sidebarController` singleton (`src/content/SidebarController.ts`). Compiled Tailwind CSS is imported with `?inline` and injected as a `<style>` tag inside that root, and the stylesheet sets `:host { all: initial }` as a defensive baseline — so LinkedIn's page styles can never leak in (verified by injecting a `* { font-family: ... !important }` rule into the host page and confirming the sidebar's computed styles are unaffected), and ours never leak out.
- **SPA-aware detection.** LinkedIn never does a full page reload when you click through to another profile, and profile content streams in *after* the URL changes. `src/content/ProfileWatcher.ts` patches `history.pushState`/`replaceState`, listens for `popstate`, and runs a debounced `MutationObserver` to know when the DOM has changed at all. An epoch counter is bumped on every navigation; any in-flight retry loop checks its captured epoch before firing and abandons itself if a newer navigation has superseded it — this is what prevents a slow retry for profile A from resolving after the user has already moved on to profile B.
- **Mutations are addressed explicitly, never "the active one."** Every `contactStore` action (`setStage`, `addTag`, `persistNote`, etc.) takes an explicit `contactId` parameter rather than reading "whichever contact is active right now" — this matters most for the debounced note autosave, where reading ambient state at the moment the debounce *fires* (rather than when the user typed) could otherwise write one contact's note onto another's record after a fast profile switch.
- **Activity timeline is automatic.** Every mutation (`stage`, `priority`, `temperature`, tags, notes, reminders) appends an `Activity` via `src/services/activityService.ts`. Notes autosave with a 700ms debounce and log a single timeline entry per pause, not per keystroke; the pending write is flushed immediately if the user switches profiles mid-debounce.
- **Background script has zero UI logic** — it only seeds default storage on install, schedules a `chrome.alarms` reminder-check, fires `chrome.notifications`, and opens the right profile when a notification is clicked.
- **Dev logging.** Both `ProfileWatcher` and `SidebarController` log through `src/utils/logger.ts` (prefixed `[LinkedIn CRM:<scope>]`), so diagnosing a detection issue on a live profile is a matter of opening the page console and filtering for that prefix.

## Build architecture

Chrome extensions need different JS module formats for different pieces, so this project runs **three separate Vite builds** in sequence (see the `build` script in `package.json`):

| Target | Config | Format | Why |
|---|---|---|---|
| `popup.html` + `dashboard.html` | `vite.config.ts` | ES modules (standard multi-page app) | Normal extension pages, loaded like any web page |
| `background.js` | `vite.config.background.ts` | ES module | MV3 service workers can declare `"type": "module"`, so static imports work |
| `content.js` | `vite.config.content.ts` | IIFE | Content scripts registered via `manifest.json`'s `content_scripts` are always executed as classic (non-module) scripts |

All three builds write into the same `dist/` folder; `public/manifest.json` and `public/icons/` are copied in automatically by Vite's `publicDir`.

> **Why a `define` for `process.env.NODE_ENV` in the background/content configs:** Vite's automatic `process.env.NODE_ENV` replacement only kicks in for its standard app build pipeline, not for `build.lib` (library mode) targets. Without it, React throws `ReferenceError: process is not defined` the instant the content script loads on a real page — this is why both `vite.config.background.ts` and `vite.config.content.ts` set it explicitly. It also enables production dead-code elimination in React, roughly halving the content script's bundle size.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Build the extension
npm run build
```

This produces a `dist/` folder containing everything Chrome needs: `manifest.json`, `background.js`, `content.js`, `popup.html`, `dashboard.html`, and `icons/`.

### Load it in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder inside this project
5. Visit any `linkedin.com/in/...` profile — the sidebar should appear automatically within a second or two

### Development loop

There's no hot-reload dev server for MV3 extensions in this setup (content scripts and the service worker can't be live-reloaded the way a normal web page can). The workflow is:

```bash
npm run build
```

then click the refresh icon on the extension's card in `chrome://extensions` (and reload any open LinkedIn tabs) to pick up changes.

Other useful commands:

```bash
npm run type-check   # tsc --noEmit
npm run lint         # eslint .
```

## Data model

All persisted data lives under four top-level keys in `chrome.storage.local`:

- `contacts` — `Record<contactId, Contact>`. See `src/types/contact.ts`.
- `tags` — `Record<tagId, Tag>`, global dictionary; contacts store only `tagIds: string[]`.
- `templates` — `Record<templateId, Template>`.
- `settings` — single `Settings` object (theme, notification toggle, reminder-check interval).

### Export / Import

The Dashboard's **Export Backup** button downloads the full dataset as a timestamped JSON file. **Import Backup** validates the file's shape (`src/utils/validation.ts`) before overwriting local storage — malformed or hand-edited backups are rejected with a clear error instead of corrupting your data.

## Known limitations

- **LinkedIn DOM selectors will need maintenance.** LinkedIn ships obfuscated, frequently-changing class names. `src/content/linkedinScraper.ts` uses several fallback selectors per field and degrades gracefully (empty string) rather than throwing, but if LinkedIn ships a major redesign, the selectors in that file are the first place to update.
- **No cross-device sync by design** — `chrome.storage.local` is local to the browser profile it's installed in. Use Export/Import to move data between machines.

## Extending

- **New pipeline stages / priority levels:** edit the enums and label maps in `src/types/contact.ts`. Every dropdown reads from those constants.
- **New activity types:** add to `ActivityType` in `src/types/activity.ts`, then log it from wherever the mutation happens via `withActivity()` in `src/services/activityService.ts`.
- **New template variables:** extend `TemplateVariable` in `src/types/template.ts` and the replacement map in `src/utils/templateVariables.ts`.
