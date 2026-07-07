import { useRef, useState } from 'react';
import { exportBackupToFile, exportContactsToCsv, importBackupFromFile } from '@/services/exportImportService';

export function ExportImportBar({ onImported }: { onImported: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function showMessage(msg: { type: 'success' | 'error'; text: string }) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleExportJson() {
    const success = await exportBackupToFile();
    showMessage(
      success
        ? { type: 'success', text: 'Backup downloaded.' }
        : { type: 'error', text: 'Export failed — see console for details.' }
    );
  }

  async function handleExportCsv() {
    const success = await exportContactsToCsv();
    showMessage(
      success
        ? { type: 'success', text: 'CSV downloaded — opens in Google Sheets, Excel, or Numbers.' }
        : { type: 'error', text: 'Export failed — see console for details.' }
    );
  }

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const result = await importBackupFromFile(file);
    if (result.success) {
      showMessage({ type: 'success', text: `Imported ${result.contactCount ?? 0} contacts.` });
      onImported();
    } else {
      showMessage({ type: 'error', text: result.error ?? 'Import failed.' });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {message && (
        <span
          className={
            message.type === 'success'
              ? 'text-sm text-emerald-600 dark:text-emerald-400'
              : 'text-sm text-red-600 dark:text-red-400'
          }
        >
          {message.text}
        </span>
      )}
      <button type="button" className="lcrm-btn-secondary" onClick={handleExportCsv} title="Download a CSV that opens directly in Google Sheets or Excel">
        Export CSV (Sheets/Excel)
      </button>
      <button type="button" className="lcrm-btn-secondary" onClick={handleExportJson} title="Download a full JSON backup for restoring in this extension later">
        Export Backup (JSON)
      </button>
      <button type="button" className="lcrm-btn-secondary" onClick={() => fileInputRef.current?.click()}>
        Import Backup
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportChange}
      />
    </div>
  );
}
