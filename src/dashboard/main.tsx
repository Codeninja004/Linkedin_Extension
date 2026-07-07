import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/sidebar/styles/tailwind.css';
import { DashboardApp } from './DashboardApp';

const container = document.getElementById('dashboard-root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <DashboardApp />
    </StrictMode>
  );
}
