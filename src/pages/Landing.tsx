import React, { useState } from 'react';

interface GenreStoryline {
  id: string;
  name: string;
  gradient: string;
  borderColor: string;
  accentDot: string;
  description: string;
}

const GENRES: GenreStoryline[] = [
  {
    id: 'fantasy',
    name: 'Fantasy',
    gradient: 'linear-gradient(135deg, #1b204a 0%, #151a3a 100%)',
    borderColor: '#2b356e',
    accentDot: '#8b5cf6',
    description: 'Magic systems & realm lore'
  },
  {
    id: 'scifi',
    name: 'Sci-Fi',
    gradient: 'linear-gradient(135deg, #10263f 0%, #0d1e33 100%)',
    borderColor: '#1e436c',
    accentDot: '#06b6d4',
    description: 'Time dilation & tech timelines'
  },
  {
    id: 'romance',
    name: 'Romance',
    gradient: 'linear-gradient(135deg, #30182c 0%, #1e1124 100%)',
    borderColor: '#592950',
    accentDot: '#f43f5e',
    description: 'Relational arcs & promises'
  },
  {
    id: 'historical',
    name: 'Historical Fiction',
    gradient: 'linear-gradient(135deg, #2b2219 0%, #1b1612 100%)',
    borderColor: '#54402a',
    accentDot: '#d97706',
    description: 'Era chronology & real events'
  },
  {
    id: 'mystery',
    name: 'Mystery',
    gradient: 'linear-gradient(135deg, #182436 0%, #111a26 100%)',
    borderColor: '#2d3e57',
    accentDot: '#6366f1',
    description: 'Clue tracks & alibis'
  },
  {
    id: 'thriller',
    name: 'Thriller',
    gradient: 'linear-gradient(135deg, #331d1d 0%, #211313 100%)',
    borderColor: '#5e3030',
    accentDot: '#ef4444',
    description: 'Ticking clocks & danger points'
  },
  {
    id: 'literary',
    name: 'Literary Fiction',
    gradient: 'linear-gradient(135deg, #1e2632 0%, #141b24 100%)',
    borderColor: '#324053',
    accentDot: '#10b981',
    description: 'Character motifs & memory'
  },
  {
    id: 'dystopian',
    name: 'Dystopian',
    gradient: 'linear-gradient(135deg, #262420 0%, #171512 100%)',
    borderColor: '#4d4738',
    accentDot: '#eab308',
    description: 'Regime factions & rebellion'
  },
  {
    id: 'adventure',
    name: 'Adventure',
    gradient: 'linear-gradient(135deg, #182c28 0%, #101e1b 100%)',
    borderColor: '#264a42',
    accentDot: '#14b8a6',
    description: 'Expedition routes & items'
  },
  {
    id: 'horror',
    name: 'Horror',
    gradient: 'linear-gradient(135deg, #261726 0%, #170d18 100%)',
    borderColor: '#4a254a',
    accentDot: '#a855f7',
    description: 'Survival status & entities'
  }
];

export const Landing: React.FC = () => {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const handleGenreClick = (genre: GenreStoryline) => {
    setSelectedGenre(genre.id);
    console.log(`[Plotpal] Storyline genre selected: "${genre.name}" (${genre.id})`);
  };

  const handleAuthClick = (provider: 'Google' | 'Email' | 'Notion') => {
    console.log(`[Plotpal] Auth initiation requested via: "${provider}"`);
  };

  const handleFooterLinkClick = (e: React.MouseEvent, linkName: string) => {
    e.preventDefault();
    console.log(`[Plotpal] Navigated to: ${linkName}`);
  };

  return (
    <div
      id="plotpal-landing-page"
      style={{
        backgroundColor: '#0a0e27',
        color: '#e0e0e0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 20px',
        boxSizing: 'border-box',
        fontFamily: '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      }}
    >
      {/* 1. Header: "plotpal" logo/title (top left), minimal styling */}
      <header
        id="landing-header"
        style={{
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '20px'
        }}
      >
        <div
          id="landing-logo"
          style={{
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            userSelect: 'none'
          }}
        >
          <span style={{ color: '#FF6B35' }}>&gt;</span>
          <span>plotpal</span>
        </div>

        <div
          style={{
            fontSize: '11px',
            color: '#8e95b0',
            border: '1px solid #1f2756',
            padding: '4px 8px',
            borderRadius: '2px',
            textTransform: 'lowercase'
          }}
        >
          continuity engine v0.1
        </div>
      </header>

      {/* Main Content Area */}
      <main
        id="landing-main"
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          padding: '20px 0 40px 0'
        }}
      >
        {/* 2. Hook sentence: "check your storyline for plot holes" (centered, large) */}
        <section
          id="landing-hero"
          style={{
            textAlign: 'center',
            maxWidth: '860px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <h1
            id="landing-hook-title"
            style={{
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.5px',
              lineHeight: 1.25,
              margin: 0
            }}
          >
            check your storyline for plot holes
          </h1>
          <p
            id="landing-hook-subtitle"
            style={{
              fontSize: 'clamp(13px, 1.8vw, 15px)',
              color: '#8e95b0',
              maxWidth: '640px',
              lineHeight: 1.5,
              margin: 0
            }}
          >
            Select a narrative archetype or track your manuscript's timeline graph, item ownerships, and character states in real time.
          </p>
        </section>

        {/* 3. Sample Storylines Section: Circular Cards in Grid Layout */}
        <section
          id="sample-storylines-section"
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}
        >
          <div
            id="storylines-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '20px 16px',
              width: '100%',
              maxWidth: '1080px',
              justifyItems: 'center'
            }}
          >
            {GENRES.map((genre) => {
              const isSelected = selectedGenre === genre.id;
              return (
                <button
                  key={genre.id}
                  id={`genre-card-${genre.id}`}
                  onClick={() => handleGenreClick(genre)}
                  type="button"
                  style={{
                    width: '130px',
                    height: '130px',
                    borderRadius: '50%',
                    background: genre.gradient,
                    border: isSelected ? '2px solid #FF6B35' : `1px solid ${genre.borderColor}`,
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    cursor: 'pointer',
                    outline: 'none',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease, transform 0.15s ease, background 0.15s ease',
                    position: 'relative',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#FF6B35';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = genre.borderColor;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: genre.accentDot,
                      marginBottom: '6px',
                      display: 'inline-block'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isSelected ? '#FF6B35' : '#ffffff',
                      lineHeight: 1.2,
                      letterSpacing: '-0.2px'
                    }}
                  >
                    {genre.name}
                  </span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      color: '#8e95b0',
                      marginTop: '4px',
                      lineHeight: 1.2,
                      maxWidth: '100px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {genre.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Auth Section below cards */}
        <section
          id="landing-auth-section"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            width: '100%',
            maxWidth: '460px',
            marginTop: '10px'
          }}
        >
          <div
            id="auth-label"
            style={{
              fontSize: '12px',
              color: '#8e95b0',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 500
            }}
          >
            Continue with:
          </div>

          <div
            id="auth-buttons-group"
            style={{
              display: 'flex',
              gap: '12px',
              width: '100%',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            {/* Google Button */}
            <button
              id="auth-google-btn"
              type="button"
              onClick={() => handleAuthClick('Google')}
              style={{
                flex: '1 1 120px',
                minWidth: '110px',
                padding: '11px 16px',
                backgroundColor: '#111738',
                border: '1px solid #1f2756',
                borderRadius: '2px',
                color: '#e0e0e0',
                fontSize: '12px',
                fontFamily: 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF6B35';
                e.currentTarget.style.color = '#FF6B35';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1f2756';
                e.currentTarget.style.color = '#e0e0e0';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>

            {/* Email Button */}
            <button
              id="auth-email-btn"
              type="button"
              onClick={() => handleAuthClick('Email')}
              style={{
                flex: '1 1 120px',
                minWidth: '110px',
                padding: '11px 16px',
                backgroundColor: '#111738',
                border: '1px solid #1f2756',
                borderRadius: '2px',
                color: '#e0e0e0',
                fontSize: '12px',
                fontFamily: 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF6B35';
                e.currentTarget.style.color = '#FF6B35';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1f2756';
                e.currentTarget.style.color = '#e0e0e0';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span>Email</span>
            </button>

            {/* Notion Button */}
            <button
              id="auth-notion-btn"
              type="button"
              onClick={() => handleAuthClick('Notion')}
              style={{
                flex: '1 1 120px',
                minWidth: '110px',
                padding: '11px 16px',
                backgroundColor: '#111738',
                border: '1px solid #1f2756',
                borderRadius: '2px',
                color: '#e0e0e0',
                fontSize: '12px',
                fontFamily: 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF6B35';
                e.currentTarget.style.color = '#FF6B35';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1f2756';
                e.currentTarget.style.color = '#e0e0e0';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.093-.373L17.84 1.69c-.466-.373-.886-.606-2.146-.513L2.593 2.156c-.373.047-.466.28-.28.466l2.146 1.586zm.886 4.385v12.268c0 .84.42 1.12 1.353 1.073l13.915-.84c.933-.047 1.073-.606 1.073-1.353V7.52c0-.746-.28-.98-1.026-.933l-14.288.84c-.746.047-1.026.327-1.026.98zM17.42 8.78c.093.42 0 .84-.42.887l-.98.186v8.444c-.606.373-1.166.56-1.726.56-.933 0-1.26-.28-1.96-.98l-4.57-6.904v6.578l1.4.327c.093.42 0 .84-.42.887l-3.872.233c-.093-.42 0-.84.42-.887l1.073-.233V9.667l-1.446-.14c-.093-.42 0-.84.42-.887l4.012-.233 4.804 7.184V9.387l-1.12-.186c-.093-.42 0-.84.42-.887l3.965-.233z" />
              </svg>
              <span>Notion</span>
            </button>
          </div>
        </section>
      </main>

      {/* 5. Footer (bottom): Links + Small Compliance Text */}
      <footer
        id="landing-footer"
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid #1f2756',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Footer Navigation Links */}
        <nav
          id="landing-footer-links"
          style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          <a
            href="#privacy"
            onClick={(e) => handleFooterLinkClick(e, 'Privacy Policy')}
            style={{
              color: '#8e95b0',
              textDecoration: 'none',
              fontSize: '12px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FF6B35')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8e95b0')}
          >
            Privacy Policy
          </a>
          <a
            href="#terms"
            onClick={(e) => handleFooterLinkClick(e, 'Terms of Service')}
            style={{
              color: '#8e95b0',
              textDecoration: 'none',
              fontSize: '12px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FF6B35')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8e95b0')}
          >
            Terms of Service
          </a>
          <a
            href="#contact"
            onClick={(e) => handleFooterLinkClick(e, 'Contact')}
            style={{
              color: '#8e95b0',
              textDecoration: 'none',
              fontSize: '12px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FF6B35')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8e95b0')}
          >
            Contact
          </a>
        </nav>

        {/* Small Data & HydraDB Policy Text */}
        <p
          id="landing-footer-disclaimer"
          style={{
            color: '#656d8a',
            fontSize: '11px',
            lineHeight: 1.5,
            maxWidth: '780px',
            margin: 0
          }}
        >
          HydraDB stores your storyline data to power continuity checking. We do not sell your data. Standard infrastructure vendors (cloud hosting, analytics) may access data for service operations. For details, see our privacy policy.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
