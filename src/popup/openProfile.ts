/** Opens a contact's LinkedIn profile in a new tab (or focuses it if already open). */
export async function openProfileTab(url: string): Promise<void> {
  await chrome.tabs.create({ url });
}

export async function openDashboard(): Promise<void> {
  await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
}
