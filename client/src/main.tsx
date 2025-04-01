import React from 'react'; // Explicit import for clarity
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Import global styles
import './styles/global.css';

// Import page components
import Home from './pages/Home/Home';
import About from './pages/About/About';

// Basic Layout Component (Optional but good practice)
function Layout() {
  return (
    <div>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '1rem' }}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </nav>
      <hr />
      {/* Routes will render their elements here */}
    </div>
  );
}


// Get the root element
const container = document.getElementById('root');
if (!container) {
  throw new Error("Failed to find the root element");
}
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout /> {/* Include the basic layout/navigation */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        {/* Add other routes here */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
