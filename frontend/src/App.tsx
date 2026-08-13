import React, { useState } from 'react';
import axios from 'axios';
import { Header } from './components/Header';
import { ManuscriptInput } from './components/ManuscriptInput';
import { ResultsCard } from './components/ResultsCard';
import { ManuscriptFormData, ContinuityResponse } from './types';
import './App.css';

// Configure backend URL from environment or fallback
const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In development/production preview environments where frontend and backend are served together
  if (typeof window !== 'undefined') {
    // If running on standard Vite port 5173 without proxy, default to localhost:8000
    if (window.location.port === '5173') {
      return 'http://localhost:8000';
    }
    return '';
  }
  return 'http://localhost:8000';
};

export const App: React.FC = () => {
  const [formData, setFormData] = useState<ManuscriptFormData>({
    text: "Eren Yeager stood healthy and determined atop Wall Maria at sunrise, gazing across Shiganshina with the Basement Key in hand.",
    in_universe_time: 600,
    chapter: 12,
    manuscript_position: 0.45
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ContinuityResponse | null>(null);

  const handleFormChange = (updates: Partial<ManuscriptFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleCheckContinuity = async () => {
    if (!formData.text.trim() || formData.in_universe_time === '') {
      return;
    }

    setIsLoading(true);
    const apiBase = getApiBaseUrl();
    const endpoint = `${apiBase}/check-continuity`;

    const payload = {
      text: formData.text,
      in_universe_time: Number(formData.in_universe_time),
      chapter: formData.chapter !== '' ? Number(formData.chapter) : 1,
      manuscript_position: formData.manuscript_position !== '' && formData.manuscript_position !== undefined 
        ? Number(formData.manuscript_position) 
        : 0.0
    };

    try {
      const response = await axios.post<ContinuityResponse>(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 25000
      });

      if (response.data) {
        setResult(response.data);
      }
    } catch (err: any) {
      console.error('Continuity check request failed:', err);
      let errorMsg = 'Failed to connect to Plotpal backend.';
      if (err.response) {
        // Server returned 4xx or 5xx
        errorMsg = err.response.data?.detail || err.response.data?.message || `Server error (${err.response.status}): ${err.message}`;
      } else if (err.request) {
        // Network error
        errorMsg = `Network error connecting to ${endpoint}. Verify that the FastAPI backend is running at ${apiBase || 'current host'}.`;
      } else {
        errorMsg = err.message || 'An unexpected error occurred.';
      }

      setResult({
        is_valid: false,
        violations: [],
        error: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <ManuscriptInput
          formData={formData}
          onChange={handleFormChange}
          onSubmit={handleCheckContinuity}
          isLoading={isLoading}
        />

        <ResultsCard
          result={result}
          isLoading={isLoading}
          onRetry={handleCheckContinuity}
        />
      </main>

      <footer className="footer-info">
        <div>
          <span>plotpal v0.1.0</span> • <span>FastAPI + HydraDB + React</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/docs" target="_blank" rel="noreferrer" className="footer-link">
            API Docs ↗
          </a>
          <a href="/health" target="_blank" rel="noreferrer" className="footer-link">
            /health ↗
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
