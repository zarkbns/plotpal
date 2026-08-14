import React from 'react';
import { 
  Plus, 
  GitBranch, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  FileText
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
    { id: 'all', label: 'All' },
    { id: 'mystery', label: 'Mystery' },
    { id: 'scifi', label: 'Sci-Fi' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'historical', label: 'Historical' },
    { id: 'dystopian', label: 'Dystopian' }
  ];

  return (
    <div className="manuscript-grid-container">
      {/* Category Pills Bar & Create Action */}
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

        <button
          id="create-manuscript-btn-main"
          type="button"
          className="btn-create-manuscript"
          onClick={onOpenCreateModal}
        >
          <Plus size={16} />
          <span>New Storyline</span>
        </button>
      </div>

      {/* Grid of Storyline Cards or Empty State */}
      {manuscripts.length === 0 ? (
        <div className="empty-grid-placeholder">
          <GitBranch size={40} className="empty-icon" />
          <h3>No storylines found</h3>
          <p>Create a storyline manuscript to begin tracking scene timeline continuity.</p>
          <button
            type="button"
            className="btn-primary-orange"
            onClick={onOpenCreateModal}
          >
            + Create Storyline
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
                {/* Card Plot Header */}
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

                {/* Card Body */}
                <div className="card-info-body">
                  <p className="card-excerpt-snippet">
                    "{story.excerpt}"
                  </p>

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

                  <div className="card-status-row">
                    {hasViolations ? (
                      <span className="status-badge-violation">
                        <AlertTriangle size={13} />
                        <span>{story.violationsCount} {story.violationsCount === 1 ? 'Issue' : 'Issues'}</span>
                      </span>
                    ) : (
                      <span className="status-badge-clean">
                        <CheckCircle2 size={13} />
                        <span>Continuity Verified</span>
                      </span>
                    )}
                  </div>

                  <button
                    id={`open-editor-btn-${story.id}`}
                    type="button"
                    className="card-open-editor-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditor(story);
                    }}
                  >
                    <span>Open Editor</span>
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
