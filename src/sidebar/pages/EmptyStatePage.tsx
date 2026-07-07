import { useEffect, useState } from 'react';
import { isProfileUrl } from '@/content/linkedinScraper';
import { detectProfileNow } from '@/content/detectProfile';
import { RefreshIcon } from '../components/icons';

const ERROR_MESSAGES: Record<string, string> = {
  'no-content-found':
    "Couldn't find this profile's details on the page yet. Try scrolling down a little, then click Detect Profile again.",
  'storage-error': 'Something went wrong saving this contact. Check the browser console for details and try again.',
  'not-a-profile-page': 'This only works on a LinkedIn profile page (a URL like linkedin.com/in/…).',
};

export function EmptyStatePage({ loading }: { loading: boolean }) {
  const [status, setStatus] = useState<'idle' | 'detecting' | 'error'>('idle');
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState(() => window.location.href);

  // This page can stay mounted while the user navigates in the background
  // (LinkedIn's SPA changes the URL without remounting anything here), so
  // poll lightly rather than reading window.location.href once at mount —
  // otherwise "Detect Profile" could stay hidden after navigating onto a
  // profile, or stay visible after navigating away from one.
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUrl((prev) => (prev !== window.location.href ? window.location.href : prev));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const onProfilePage = isProfileUrl(currentUrl);

  async function handleDetectClick() {
    setStatus('detecting');
    setErrorReason(null);
    const result = await detectProfileNow();
    if (result.success) {
      setStatus('idle');
    } else {
      setStatus('error');
      setErrorReason(result.reason);
    }
  }

  if (loading) {
    return (
      <div className="lcrm-card shrink-0 p-6 text-center text-base text-neutral-400 dark:text-neutral-500">
        Loading contact…
      </div>
    );
  }

  return (
    <div className="lcrm-card shrink-0 p-6 text-center text-base text-neutral-500 dark:text-neutral-400">
      {onProfilePage ? (
        <>
          <p>
            {status === 'error'
              ? ERROR_MESSAGES[errorReason ?? 'no-content-found']
              : "We didn't automatically detect this profile's details."}
          </p>
          <button
            type="button"
            className="lcrm-btn-primary mx-auto mt-3"
            onClick={handleDetectClick}
            disabled={status === 'detecting'}
          >
            <RefreshIcon className={status === 'detecting' ? 'animate-spin' : ''} />
            {status === 'detecting' ? 'Detecting…' : 'Detect Profile'}
          </button>
        </>
      ) : (
        <p>Visit a LinkedIn profile to start tracking it here.</p>
      )}
    </div>
  );
}
