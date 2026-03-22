import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';
import { Helmet } from 'react-helmet';

import Layout from '@components/Layout/Layout';
import HomePage from '@pages/HomePage';
import TranslatePage from '@pages/TranslatePage';
import HistoryPage from '@pages/HistoryPage';
import SettingsPage from '@pages/SettingsPage';
import AboutPage from '@pages/AboutPage';
import NotFoundPage from '@pages/NotFoundPage';

import { TranslationProvider } from '@/context/TranslationContext';
import { ThemeProvider } from '@/context/ThemeContext';

import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TranslationProvider>
          <Router>
            <Helmet>
              <title>Comic Translator - Translate Comics and Manga Instantly</title>
              <meta name="description" content="Instantly translate comics and manga with AI-powered OCR and translation. Support for multiple languages and formats." />
              <meta name="keywords" content="comic translator, manga translator, OCR, translation, anime, webtoon" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            </Helmet>
            
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/translate" element={<TranslatePage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '1px solid var(--toast-border)',
                },
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#FFFFFF',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#FFFFFF',
                  },
                },
              }}
            />
          </Router>
        </TranslationProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export default App;
