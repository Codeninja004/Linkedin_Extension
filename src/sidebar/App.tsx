import { useEffect, useState } from 'react';
import { useContactStore } from '@/store/contactStore';
import { useUIStore } from '@/store/uiStore';
import { useTagTemplateStore } from '@/store/tagTemplateStore';
import { useDarkMode } from './hooks/useDarkMode';
import { ProfilePage } from './pages/ProfilePage';
import { PendingProfilePage } from './pages/PendingProfilePage';
import { EmptyStatePage } from './pages/EmptyStatePage';
import { ChevronRightIcon, MoonIcon, RefreshIcon, SunIcon } from './components/icons';
import { cn } from '@/utils/classnames';
import { detectProfileNow } from '@/content/detectProfile';

function CollapsedTab({ onOpen }: { onOpen: () => void }) {
  const activeContact = useContactStore((s) => s.activeContact());
  const pendingProfile = useContactStore((s) => s.pendingProfile);
  const photo = activeContact?.photo || pendingProfile?.photo;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed right-0 top-24 z-[2147483000] flex flex-col items-center gap-2 rounded-l-xl border border-r-0 border-neutral-200 bg-white px-2 py-3 shadow-panel transition-all hover:pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:border-neutral-700 dark:bg-neutral-900 animate-slide-in"
      aria-label="Open LinkedIn CRM sidebar"
    >
      {photo ? (
        <img src={photo} alt="" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold">
          CRM
        </div>
      )}
      <ChevronRightIcon className="rotate-180 text-neutral-400" />
    </button>
  );
}

export function SidebarApp() {
  const activeContact = useContactStore((s) => s.activeContact());
  const pendingProfile = useContactStore((s) => s.pendingProfile);
  const isLoading = useContactStore((s) => s.isLoading);
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const isDarkMode = useDarkMode();
  const loadTags = useTagTemplateStore((s) => s.loadTags);
  const loadTemplates = useTagTemplateStore((s) => s.loadTemplates);
  const [isRedetecting, setIsRedetecting] = useState(false);

  useEffect(() => {
    loadTags();
    loadTemplates();
  }, [loadTags, loadTemplates]);

  async function handleRedetect() {
    setIsRedetecting(true);
    try {
      await detectProfileNow();
    } finally {
      setIsRedetecting(false);
    }
  }

  if (!isSidebarOpen) {
    return (
      <div className={cn(isDarkMode && 'dark')}>
        <CollapsedTab onOpen={() => setSidebarOpen(true)} />
      </div>
    );
  }

  return (
    <div className={cn(isDarkMode && 'dark')}>
      <aside
        className="lcrm-scrollbar fixed right-4 top-20 z-[2147483000] flex max-h-[85vh] w-[420px] flex-col gap-3 overflow-y-auto rounded-2xl bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur p-3 shadow-panel border border-neutral-200/70 dark:border-neutral-800 animate-slide-in font-sans"
        style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            LinkedIn CRM
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="lcrm-btn-ghost !px-2 !py-1"
              onClick={handleRedetect}
              disabled={isRedetecting}
              aria-label="Re-detect this profile"
              title="Re-detect this profile"
            >
              <RefreshIcon className={isRedetecting ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              className="lcrm-btn-ghost !px-2 !py-1"
              onClick={() => useUIStore.getState().setDarkMode(!isDarkMode)}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              className="lcrm-btn-ghost !px-2 !py-1"
              onClick={() => setSidebarOpen(false)}
              aria-label="Collapse sidebar"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>

        {activeContact ? (
          <ProfilePage contact={activeContact} />
        ) : pendingProfile ? (
          <PendingProfilePage profile={pendingProfile} />
        ) : (
          <EmptyStatePage loading={isLoading} />
        )}
      </aside>
    </div>
  );
}
