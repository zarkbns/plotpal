import React, { useState } from 'react';
import { X, Sparkles, Clock, Tag, Feather, GitBranch } from 'lucide-react';
import { Manuscript } from '../types';

interface CreateManuscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newManuscript: Partial<Manuscript>) => void;
  defaultAuthor?: string;
}

export const CreateManuscriptModal: React.FC<CreateManuscriptModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  defaultAuthor = 'Author'
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(defaultAuthor);
  const [genre, setGenre] = useState('Mystery');
  const [inUniverseTime, setInUniverseTime] = useState<number>(100);
  const [description, setDescription] = useState('');
  const [initialText, setInitialText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      author: author.trim() || 'Author',
      genre,
      inUniverseTime: Number(inUniverseTime) || 100,
      description: description.trim() || 'A new storyline.',
      excerpt: initialText.trim() || 'Opening scene begins...',
      chaptersCount: 1,
      currentChapter: 1,
      timelineSpan: `Timeline ${inUniverseTime} – ...`,
      chapters: [
        {
          id: 1,
          title: 'Act I: Scene 01',
          timelineMarker: Number(inUniverseTime) || 100,
          text: initialText.trim() || 'Opening scene begins...',
          wordCount: initialText.trim() ? initialText.trim().split(/\s+/).length : 50
        }
      ]
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <Sparkles size={18} className="text-orange" />
            <h3>Create New Storyline</h3>
          </div>
          <button 
            type="button" 
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-grid">
            {/* Title */}
            <div className="modal-input-group full-width">
              <label className="modal-label">
                <GitBranch size={14} />
                <span>Story Title</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. The Glass Kingdom"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="modal-input"
              />
            </div>

            {/* Author */}
            <div className="modal-input-group">
              <label className="modal-label">
                <Feather size={14} />
                <span>Writer</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Elena Vance"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="modal-input"
              />
            </div>

            {/* Genre */}
            <div className="modal-input-group">
              <label className="modal-label">
                <Tag size={14} />
                <span>Genre</span>
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="modal-select"
              >
                <option value="Mystery">Mystery</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Fantasy">Fantasy</option>
                <option value="Historical">Historical</option>
                <option value="Dystopian">Dystopian</option>
                <option value="Thriller">Thriller</option>
                <option value="Romance">Romance</option>
              </select>
            </div>

            {/* In-universe Timeline Marker */}
            <div className="modal-input-group">
              <label className="modal-label">
                <Clock size={14} />
                <span>Starting Timeline Marker</span>
              </label>
              <input
                type="number"
                value={inUniverseTime}
                onChange={(e) => setInUniverseTime(Number(e.target.value) || 0)}
                className="modal-input"
              />
            </div>

            {/* Premise */}
            <div className="modal-input-group full-width">
              <label className="modal-label">
                <span>Premise</span>
              </label>
              <input
                type="text"
                placeholder="Brief synopsis of core conflict..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="modal-input"
              />
            </div>

            {/* Opening Scene Text */}
            <div className="modal-input-group full-width">
              <label className="modal-label">
                <span>Opening Scene Draft</span>
              </label>
              <textarea
                rows={4}
                placeholder="Write or paste your first scene draft..."
                value={initialText}
                onChange={(e) => setInitialText(e.target.value)}
                className="modal-textarea"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-create"
            >
              Create Storyline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
