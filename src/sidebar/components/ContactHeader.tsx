import type { LinkedInProfileData } from '@/types';
import { BuildingIcon, PinIcon } from './icons';

interface ContactHeaderProps {
  profile: LinkedInProfileData;
}

/** Read-only header showing the fields scraped straight from LinkedIn. Reused for both a tracked Contact and an unconfirmed pending profile preview, since Contact is a superset of LinkedInProfileData. */
export function ContactHeader({ profile }: ContactHeaderProps) {
  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="lcrm-card shrink-0 p-4 animate-slide-in">
      <div className="flex items-start gap-3">
        {profile.photo ? (
          <img
            src={profile.photo}
            alt={profile.name}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-neutral-800 shadow-sm"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-semibold text-lg ring-2 ring-white dark:ring-neutral-800">
            {initials || '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {profile.name || 'Unknown'}
          </h2>
          {profile.headline && (
            <p className="mt-0.5 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
              {profile.headline}
            </p>
          )}
          <div className="mt-1.5 flex flex-col gap-1 text-sm text-neutral-400 dark:text-neutral-500">
            {profile.company && (
              <span className="flex items-center gap-1.5 truncate">
                <BuildingIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{profile.company}</span>
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1.5 truncate">
                <PinIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{profile.location}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
