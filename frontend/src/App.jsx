import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import TranslatePage from './pages/TranslatePage';
import TextTranslatePage from './pages/TextTranslatePage';
import LinkTranslatePage from './pages/LinkTranslatePage';

const Nav = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="font-semibold text-gray-900">Inkverta</div>
        <nav className="flex gap-4 text-sm">
          <Link
            to="/translate"
            className={isActive('/translate') ? 'text-blue-600 font-medium' : 'text-gray-600'}
          >
            Image OCR
          </Link>
          <Link
            to="/text"
            className={isActive('/text') ? 'text-blue-600 font-medium' : 'text-gray-600'}
          >
            Novel/Text
          </Link>
          <Link
            to="/link"
            className={isActive('/link') ? 'text-blue-600 font-medium' : 'text-gray-600'}
          >
            Link Import
          </Link>
        </nav>
      </div>
    </header>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Navigate to="/translate" replace />} />
        <Route path="/translate" element={<TranslatePage />} />
        <Route path="/text" element={<TextTranslatePage />} />
        <Route path="/link" element={<LinkTranslatePage />} />
        <Route path="*" element={<Navigate to="/translate" replace />} />
      </Routes>

      <Toaster position="top-right" />
    </BrowserRouter>
  );
};

export default App;
