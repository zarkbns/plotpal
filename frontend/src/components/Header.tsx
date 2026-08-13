import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="header-container" id="plotpal-header">
      <div className="header-title-group">
        <h1 className="header-title">
          <span className="prompt-char">&gt;</span> plotpal
        </h1>
        <p className="header-subtitle">
          manuscript continuity checker powered by hydradb
        </p>
      </div>
      <div className="header-badge" id="system-status-badge">
        <span className="status-dot"></span>
        <span>hydradb : connected</span>
      </div>
    </header>
  );
};
