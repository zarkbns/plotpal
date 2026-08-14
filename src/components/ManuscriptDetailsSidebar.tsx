import React from 'react';
import { 
  GitBranch, 
  RotateCw, 
  History, 
  Sliders, 
  Share2, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  User, 
  Key, 
  MapPin, 
  Users,
  Edit3,
  Sparkles,
  Layers
} from 'lucide-react';
import { Manuscript } from '../types';

interface ManuscriptDetailsSidebarProps {
  manuscript: Manuscript | null;
  onOpenEditor: (manuscript: Manuscript) => void;
  onCheckNow: (manuscript: Manuscript) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const ManuscriptDetailsSidebar: React.FC<ManuscriptDetailsSidebarProps> = ({
  manuscript,
  onOpenEditor,
  onCheckNow,
  isOpenMobile = false,
  onCloseMobile
}) => {
  if (!manuscript) {
    return (
      <>
        {isOpenMobile && (
          <div className="details-mobile-backdrop" onClick={onCloseMobile} aria-hidden="true" />
        )}
        <aside 
          id="litverse-details-sidebar" 
          className={`details-sidebar-container empty ${isOpenMobile ? 'mobile-open' : ''}`}
        >
          {onCloseMobile && (
            <div className="details-mobile-header">
              <span className="details-mobile-title">Storyline Inspector</span>
              <button 
                type="button" 
                className="details-mobile-close-btn"
                onClick={onCloseMobile}
                aria-label="Close details"
              >
                ×
              </button>
            </div>
          )}
          <div className="details-empty-state">
            <GitBranch size={36} className="empty-book-icon" />
            <h3>No Storyline Selected</h3>
            <p>Select any plot blueprint card to inspect timeline states, character lifelines, and HydraDB continuity health.</p>
          </div>
        </aside>
      </>
    );
  }

  const hasViolations = manuscript.violationsCount > 0;

  return (
    <>
      {/* Backdrop for tablet/mobile drawer mode */}
      {isOpenMobile && (
        <div 
          className="details-mobile-backdrop" 
          onClick={onCloseMobile}
          aria-hidden="true" 
        />
      )}

      <aside 
        id="litverse-details-sidebar" 
        className={`details-sidebar-container ${isOpenMobile ? 'mobile-open' : ''}`}
      >
        {/* Mobile Header with close button */}
        {onCloseMobile && (
          <div className="details-mobile-header">
            <span className="details-mobile-title">Storyline Diagnostics & Inspector</span>
            <button 
              type="button" 
              className="details-mobile-close-btn"
              onClick={onCloseMobile}
              aria-label="Close Inspector Panel"
            >
              ×
            </button>
          </div>
        )}

        {/* Story Plot Header Banner */}
        <div 
          className="details-cover-hero"
          style={{ background: manuscript.coverBg }}
        >
          <div className="cover-badge-row">
            <span 
              className="details-genre-badge"
              style={{ color: manuscript.coverAccent }}
            >
              {manuscript.genre}
            </span>
            <span className="details-timeline-badge">
              {manuscript.timelineSpan}
            </span>
          </div>

          <h3 className="details-cover-title" style={{ color: manuscript.textColor || '#F5E6D3' }}>
            {manuscript.title}
          </h3>
          <p className="details-cover-author">By {manuscript.author}</p>
        </div>

        {/* Primary Action Buttons */}
        <div className="details-action-buttons-group">
          <button
            id="sidebar-open-editor-btn"
            type="button"
            className="btn-primary-editor"
            onClick={() => {
              onOpenEditor(manuscript);
              if (onCloseMobile) onCloseMobile();
            }}
          >
            <Edit3 size={16} />
            <span>Open Plot Editor</span>
          </button>

          <button
            id="sidebar-check-now-btn"
            type="button"
            className="btn-secondary-check"
            onClick={() => onCheckNow(manuscript)}
          >
            <RotateCw size={15} />
            <span>Audit</span>
          </button>
        </div>

        {/* Mini Action Tools */}
        <div className="details-icon-tools-row">
          <button 
            type="button" 
            className="tool-action-btn"
            title="Inspect Beat Sheets"
            onClick={() => console.log('[Plotpal] Inspect Beat Sheets clicked')}
          >
            <Layers size={15} />
            <span>Beats</span>
          </button>
          <button 
            type="button" 
            className="tool-action-btn"
            title="View Timeline History"
            onClick={() => console.log('[Plotpal] View Timeline History clicked')}
          >
            <History size={15} />
            <span>History</span>
          </button>
          <button 
            type="button" 
            className="tool-action-btn"
            title="HydraDB Graph Settings"
            onClick={() => console.log('[Plotpal] Graph Settings clicked')}
          >
            <Sliders size={15} />
            <span>Graph</span>
          </button>
          <button 
            type="button" 
            className="tool-action-btn"
            title="Share Plot Report"
            onClick={() => console.log('[Plotpal] Share Report clicked')}
          >
            <Share2 size={15} />
            <span>Export</span>
          </button>
        </div>

        {/* Continuity Health & Timeline Metadata Card */}
        <div className="details-meta-card">
          <div className="meta-row">
            <span className="meta-label">Continuity Health:</span>
            <span className="meta-val highlight">{manuscript.ratingScore || 'Continuity Verified'}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Total Chapters:</span>
            <span className="meta-val">{manuscript.chaptersCount} Chapters</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Timeline Bounds:</span>
            <span className="meta-val">{manuscript.timelineSpan}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Active Scene Marker:</span>
            <span className="meta-val">T = {manuscript.inUniverseTime}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Last Audited:</span>
            <span className="meta-val">{manuscript.lastCheckedDate}</span>
          </div>
        </div>

        {/* Continuity Violations Summary */}
        <div className="details-violations-section">
          <div className="section-header-row">
            <div className="section-title-with-icon">
              {hasViolations ? (
                <ShieldAlert size={16} className="text-orange" />
              ) : (
                <CheckCircle2 size={16} className="text-green" />
              )}
              <h4>Plot Continuity Diagnostics</h4>
            </div>
            <span className={`badge-pill ${hasViolations ? 'badge-warning' : 'badge-clean'}`}>
              {hasViolations ? `${manuscript.violationsCount} Issues` : 'Clean'}
            </span>
          </div>

          {hasViolations ? (
            <div className="violations-summary-list">
              {manuscript.violations.map((violation, idx) => (
                <div key={violation.id || idx} className="violation-summary-box">
                  <div className="violation-type-tag">
                    <AlertCircle size={12} />
                    <span>{violation.type.replace('_', ' ')}</span>
                  </div>
                  <p className="violation-text-preview">{violation.explanation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="clean-timeline-notice">
              <CheckCircle2 size={24} className="clean-icon" />
              <p>No narrative contradictions detected across all recorded HydraDB timeline markers.</p>
            </div>
          )}
        </div>

        {/* Tracked Entities in Storyline Graph */}
        <div className="details-entities-section">
          <div className="section-header-row">
            <h4>Tracked Graph Entities</h4>
            <span className="entity-count-tag">{manuscript.trackedEntities?.length || 0}</span>
          </div>

          <div className="entities-chips-list">
            {manuscript.trackedEntities?.map((entity, i) => {
              let IconComp = User;
              if (entity.type === 'item') IconComp = Key;
              if (entity.type === 'location') IconComp = MapPin;
              if (entity.type === 'faction') IconComp = Users;

              return (
                <div key={i} className="entity-chip-item">
                  <IconComp size={13} className="entity-icon" />
                  <div className="entity-info-group">
                    <span className="entity-name">{entity.name}</span>
                    <span className="entity-status-meta">
                      {entity.status} • T={entity.lastSeenMarker}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};
