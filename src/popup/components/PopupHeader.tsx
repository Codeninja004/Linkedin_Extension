import { openDashboard } from '../openProfile';

export function PopupHeader() {
  return (
    <header className="flex items-center justify-between px-1 pb-1">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-bold">
          in
        </div>
        <span className="text-base font-semibold text-neutral-800 dark:text-neutral-100">LinkedIn CRM</span>
      </div>
      <button type="button" className="lcrm-btn-primary !px-3 !py-1.5 text-sm" onClick={openDashboard}>
        Open Dashboard
      </button>
    </header>
  );
}
