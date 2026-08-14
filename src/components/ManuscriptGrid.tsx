import React from 'react';
import { 
  Plus, 
  GitBranch, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  FileText, 
  Users, 
  Layers, 
  Sparkles,
  MapPin,
  Key
} from 'lucide-react';
import { Manuscript, GenreFilter } from '../types';

interface ManuscriptGridProps {
  manuscripts: Manuscript[];
  selectedManuscriptId: string | null;
  activeFilter: GenreFilter;
  onSelectFilter: (filter: GenreFilter) => void;
  onSelectManuscript: (manuscript: Manuscript) => void;
  onOpenEditor: (manuscript: Manuscript) => void;
  onOpenCreateModal: () => void;
}

export const ManuscriptGrid: React.FC<ManuscriptGridProps> = ({
  manuscripts,
  selectedManuscriptId,
  activeFilter,
  onSelectFilter,
  onSelectManuscript,
  onOpenEditor,
  onOpenCreateModal
}) => {
  const filterCategories: { id: GenreFilter; label: string }[] = [
    { id: 'all', label: 'All Storylines' },
    { id: 'mystery', label: 'Mystery & Thriller' },
    { id: 'scifi', label: 'Sci-Fi' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'historical', label: 'Historical' },
    { id: 'dystopian', label: 'Dystopian' }
  ];

  return (
    <div className="manuscript-grid-container">
      {/* Category Pills Bar */}
      <div className="category-tabs-bar">
        <div className="category-scroll-group">
          {filterCategories.map((cat) => {
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                id={`filter-tab-${cat.id}`}
                type="button"
                className={`category-pill ${isActive ? 'active' : ''}`}
                onClick={() => onSelectFilter(cat.id)}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Create Storyline Prominent Action */}
        <button
          id="create-manuscript-btn-main"
          type="button"
          className="btn-create-manuscript"
          onClick={onOpenCreateModal}
        >
          <Plus size={16} />
          <span>Create New Storyline</span>
        </button>
      </div>

      {/* Section Header */}
      <div className="section-title-row">
        <div>
          <h2 className="section-heading">Active Storylines & Plot Blueprints</h2>
          <p className="section-subheading">
            Audit scene sequences, track character lifelines, verify locked locations, and resolve narrative plot holes.
          </p>
        </div>
        <div className="manuscript-counter-badge">
          {manuscripts.length} {manuscripts.length === 1 ? 'Storyline' : 'Storylines'}
        </div>
      </div>

      {/* Grid of Storyline Cards */}
      {manuscripts.length === 0 ? (
        <div className="empty-grid-placeholder">
          <GitBranch size={40} className="empty-icon" />
          <h3>No storylines match your query or filter</h3>
          <p>Create a new story plot outline to start tracking timeline continuity with HydraDB.</p>
          <button
            type="button"
            className="btn-primary-orange"
            onClick={onOpenCreateModal}
          >
            + Create New Storyline
          </button>
        </div>
      ) : (
        <div id="manuscripts-grid" className="manuscripts-cards-grid">
          {manuscripts.map((story) => {
            const isSelected = selectedManuscriptId === story.id;
            const hasViolations = story.violationsCount > 0;

            return (
              <div
                key={story.id}
                id={`manuscript-card-${story.id}`}
                className={`story-plot-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectManuscript(story)}
              >
                {/* Card Plot Header with Narrative Banner */}
                <div 
                  className="card-plot-banner"
                  style={{ background: story.coverBg }}
                >
                  <div className="plot-banner-top">
                    <span 
                      className="plot-genre-chip"
                      style={{ color: story.coverAccent }}
                    >
                      {story.genre}
                    </span>
                    <span className="plot-timeline-chip">
                      {story.timelineSpan}
                    </span>
                  </div>

                  <h3 className="plot-title-heading" style={{ color: story.textColor || '#F5E6D3' }}>
                    {story.title}
                  </h3>
                  <p className="plot-author-sub">
                    By {story.author}
                  </p>
                </div>

                {/* Card Body & Plot Details */}
                <div className="card-info-body">
                  {/* Premise & Hook */}
                  <p className="card-excerpt-snippet">
                    "{story.excerpt}"
                  </p>

                  {/* Tracked Entities Mini Bar */}
                  {story.trackedEntities && story.trackedEntities.length > 0 && (
                    <div className="card-entities-preview">
                      <span className="entities-label-text">
                        <Users size={11} /> Tracked:
                      </span>
                      <div className="entities-inline-chips">
                        {story.trackedEntities.slice(0, 3).map((e, idx) => (
                          <span key={idx} className="mini-entity-tag">
                            {e.name}
                          </span>
                        ))}
                        {story.trackedEntities.length > 3 && (
                          <span className="mini-entity-more">+{story.trackedEntities.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chapters & Time Stats */}
                  <div className="card-stats-row">
                    <span className="stat-pill">
                      <FileText size={13} />
                      {story.chaptersCount} {story.chaptersCount === 1 ? 'Chapter' : 'Chapters'}
                    </span>
                    <span className="stat-pill">
                      <Clock size={13} />
                      {story.lastCheckedDate}
                    </span>
                  </div>

                  {/* Continuity Status Badge */}
                  <div className="card-status-row">
                    {hasViolations ? (
                      <span className="status-badge-violation">
                        <AlertTriangle size={13} />
                        <span>{story.violationsCount} Plot {story.violationsCount === 1 ? 'Contradiction' : 'Contradictions'}</span>
                      </span>
                    ) : (
                      <span className="status-badge-clean">
                        <CheckCircle2 size={13} />
                        <span>Continuity Verified</span>
                      </span>
                    )}

                    <span className="rating-pill-tag">
                      {story.ratingScore || 'HydraDB Synced'}
                    </span>
                  </div>

                  {/* Open Plot Editor Button */}
                  <button
                    id={`open-editor-btn-${story.id}`}
                    type="button"
                    className="card-open-editor-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditor(story);
                    }}
                  >
                    <span>Open Plot Editor</span>
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
