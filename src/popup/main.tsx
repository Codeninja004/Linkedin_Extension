import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/sidebar/styles/tailwind.css';
import { PopupApp } from './PopupApp';

const container = document.getElementById('popup-root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <PopupApp />
    </StrictMode>
  );
}
