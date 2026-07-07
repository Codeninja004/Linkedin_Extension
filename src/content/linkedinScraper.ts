import type { LinkedInProfileData } from '@/types';
import { createLogger } from '@/utils/logger';

const log = createLogger('linkedinScraper');

const PROFILE_URL_PATTERN = /^https?:\/\/(www\.)?linkedin\.com\/in\/([^/?#]+)/i;

/**
 * Selectors for the profile name heading — the primary signal we use to
 * decide "has this profile's content painted yet?"
 *
 * LinkedIn re-skins its profile page every so often, silently breaking any
 * selector list that's too narrow — and in at least one confirmed case, the
 * profile page ships with *no* `<h1>` element anywhere on the page at all
 * (custom components using `role="heading"` instead of semantic heading
 * tags). Ordered from most specific (known LinkedIn class names, in case
 * they still apply) to maximally generic — the ARIA-role fallbacks at the
 * end are what keeps this working when there's no `<h1>` to find at all.
 * See also `extractNameFromTitle` below, an entirely DOM-structure-
 * independent fallback for when none of this matches either.
 */
const NAME_HEADING_SELECTORS = [
  'h1.text-heading-xlarge',
  '.pv-text-details__left-panel h1',
  '.ph5 h1',
  'main section h1',
  'main h1',
  'h1',
  'main [role="heading"][aria-level="1"]',
  '[role="heading"][aria-level="1"]',
  'main [role="heading"]',
];

/** Generic heading text that a broad selector could plausibly pick up but is never a person's name (site logo/branding headings, cookie banners, etc.). */
const NON_NAME_HEADINGS = new Set(['linkedin', 'sign in', 'join now', 'welcome back']);

function isPlausibleName(text: string): boolean {
  return text.length >= 2 && !NON_NAME_HEADINGS.has(text.trim().toLowerCase());
}

export function isProfileUrl(url: string): boolean {
  return PROFILE_URL_PATTERN.test(url);
}

function textOf(el: Element | null | undefined): string {
  return el?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
}

/** Walks NAME_HEADING_SELECTORS and returns the first match whose text looks like an actual name. */
function findNameInDom(): string {
  for (const selector of NAME_HEADING_SELECTORS) {
    try {
      const text = textOf(document.querySelector(selector));
      if (text && isPlausibleName(text)) return text;
    } catch {
      // Invalid selector — keep trying the rest.
    }
  }
  return '';
}

/**
 * Last-resort fallback: the browser tab title. LinkedIn sets `document.title`
 * for every profile page regardless of how the body is componentized, so
 * this survives even a full redesign that drops semantic headings and ARIA
 * roles entirely. Typical formats seen in the wild:
 *   "Jane Doe | LinkedIn"
 *   "Jane Doe - VP of Engineering - Acme Corp | LinkedIn"
 *   "(3) Jane Doe | LinkedIn"   (unread-notification-count prefix)
 */
function extractNameFromTitle(): string {
  const title = document.title;
  if (!title) return '';

  let cleaned = title.replace(/^\(\d+\)\s*/, '');

  const pipeIndex = cleaned.toLowerCase().lastIndexOf('| linkedin');
  if (pipeIndex !== -1) cleaned = cleaned.slice(0, pipeIndex);

  const dashIndex = cleaned.indexOf(' - ');
  if (dashIndex !== -1) cleaned = cleaned.slice(0, dashIndex);

  cleaned = cleaned.trim();
  return isPlausibleName(cleaned) ? cleaned : '';
}

/** Resolves the profile's name from whichever signal is available — DOM heading first, page title as a structure-independent fallback. */
function resolveProfileName(): string {
  return findNameInDom() || extractNameFromTitle();
}

/**
 * Cheap readiness check used by ProfileWatcher to decide whether it's safe
 * to scrape yet. Deliberately shares `resolveProfileName` with
 * `scrapeProfileFromDom` (see below) so the two can never silently drift
 * apart — a stricter "ready" check that a looser scraper satisfies (or
 * vice versa) is a classic source of race-condition bugs.
 */
export function hasProfileContentRendered(): boolean {
  return resolveProfileName() !== '';
}

/** Canonicalizes a profile URL to `https://www.linkedin.com/in/<slug>/` so the same person always maps to one contact. */
export function canonicalProfileUrl(url: string): string | null {
  const match = url.match(PROFILE_URL_PATTERN);
  if (!match) return null;
  return `https://www.linkedin.com/in/${match[2]}/`;
}

function query(selectors: string[]): Element | null {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el) return el;
    } catch {
      // Invalid selector or DOM not ready — keep trying the rest.
    }
  }
  return null;
}

/**
 * Extracts profile fields straight from LinkedIn's rendered DOM.
 *
 * LinkedIn ships obfuscated, frequently-changing class names, so every
 * selector here has fallbacks and every extraction is wrapped so a missing
 * or renamed element degrades to an empty string instead of throwing.
 */
export function scrapeProfileFromDom(): LinkedInProfileData {
  const url = canonicalProfileUrl(window.location.href) ?? window.location.href;

  const name = resolveProfileName();

  const headline = textOf(
    query([
      '.pv-text-details__left-panel .text-body-medium',
      'main .text-body-medium.break-words',
      '.ph5 .text-body-medium',
    ])
  );

  const location = textOf(
    query([
      '.pv-text-details__left-panel .text-body-small.inline.t-black--light',
      'main .text-body-small.inline.t-black--light.break-words',
      '.ph5 .text-body-small.inline',
    ])
  );

  const company = textOf(
    query([
      'button[aria-label*="Current company"] .pv-text-details__right-panel-item-text',
      '.pv-text-details__right-panel-item-text',
      '[data-field="experience_company_logo"] + div .t-14.t-black--light span[aria-hidden="true"]',
      'section#experience ~ div li .t-bold span[aria-hidden="true"]',
    ])
  ) || extractCompanyFromHeadline(headline);

  const photoEl = query([
    '.pv-top-card-profile-picture__image',
    'img.pv-top-card-profile-picture__image',
    '.pv-top-card__photo img',
    'main img[class*="profile-picture"]',
  ]) as HTMLImageElement | null;

  const photo = photoEl?.src ?? '';

  if (!name) {
    log.warn(
      `Scraped no name for ${url}. Neither NAME_HEADING_SELECTORS nor the page title matched — LinkedIn's markup differs from every known pattern. Selectors tried: ${NAME_HEADING_SELECTORS.join(', ')}. document.title was: "${document.title}"`
    );
  } else {
    log.debug(`Scraped profile: name="${name}" headline="${headline}" company="${company}" location="${location}" hasPhoto=${!!photo}`);
  }

  return {
    linkedinUrl: url,
    name,
    headline,
    company,
    location,
    photo,
  };
}

/** Best-effort fallback: headlines are often formatted "Role at Company". */
function extractCompanyFromHeadline(headline: string): string {
  const match = headline.match(/\bat\s+(.+)$/i);
  return match ? match[1].trim() : '';
}
