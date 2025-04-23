import React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';

// Import global styles
import './styles/global.css';
// Import Mantine core styles
import '@mantine/core/styles.css';

// Import App component
import App from './App';

// Get the root element
const container = document.getElementById('root');
if (!container) {
  throw new Error("Failed to find the root element");
}
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>,
);
