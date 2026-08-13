import React from 'react';
import { ManuscriptFormData } from '../types';

interface ManuscriptInputProps {
  formData: ManuscriptFormData;
  onChange: (data: Partial<ManuscriptFormData>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const ManuscriptInput: React.FC<ManuscriptInputProps> = ({
  formData,
  onChange,
  onSubmit,
  isLoading
}) => {
  const textLength = formData.text.trim().length;
  const isTimeProvided = formData.in_universe_time !== '' && formData.in_universe_time !== null;
  const isSubmitDisabled = !formData.text.trim() || !isTimeProvided || isLoading;

  const handleSampleSelect = (preset: 'conflict' | 'ownership' | 'valid') => {
    if (preset === 'conflict') {
      onChange({
        text: "Eren Yeager stood healthy and uninjured atop Wall Maria at sunrise, gazing determinedly across the vast plains beyond Shiganshina. His heart was steady as he adjusted his Survey Corps cloak, breathing in the fresh morning air with renewed strength.",
        in_universe_time: 600,
        chapter: 12,
        manuscript_position: 0.45
      });
    } else if (preset === 'ownership') {
      onChange({
        text: "Eren Yeager reached into his pocket and produced the heavy iron Basement Key that had unlocked the mysterious desk in Shiganshina District, twirling the key in his fingers before handing it directly to Armin Arlert in the middle of Wall Rose.",
        in_universe_time: 600,
        chapter: 14,
        manuscript_position: 0.52
      });
    } else {
      onChange({
        text: "The Survey Corps scouts gathered in the courtyard of Wall Rose under the twilight sky. Captain Levi inspected the new omni-directional mobility gear supplies while the fresh recruits assembled their rations for tomorrow's expedition.",
        in_universe_time: 450,
        chapter: 5,
        manuscript_position: 0.15
      });
    }
  };

  return (
    <div className="panel" id="manuscript-input-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span>//</span> active manuscript segment
        </div>
        <div className="sample-presets">
          <span className="panel-meta">presets:</span>
          <button
            type="button"
            className="preset-btn"
            id="preset-conflict-btn"
            onClick={() => handleSampleSelect('conflict')}
            disabled={isLoading}
          >
            deceased conflict
          </button>
          <button
            type="button"
            className="preset-btn"
            id="preset-ownership-btn"
            onClick={() => handleSampleSelect('ownership')}
            disabled={isLoading}
          >
            item transfer
          </button>
          <button
            type="button"
            className="preset-btn"
            id="preset-valid-btn"
            onClick={() => handleSampleSelect('valid')}
            disabled={isLoading}
          >
            clean scene
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="manuscript-textarea">
          <span>Manuscript Scene Text <span className="form-label-req">*</span></span>
          <span className="panel-meta">(min 200 chars recommended)</span>
        </label>
        <textarea
          id="manuscript-textarea"
          value={formData.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Paste or write your manuscript scene text here... e.g., character actions, dialogue, item interactions, and locations."
          rows={10}
          disabled={isLoading}
        />
        <div className={`char-counter ${textLength >= 200 ? 'valid' : textLength > 0 ? 'invalid' : ''}`}>
          {textLength} / 200 chars {textLength >= 200 ? '✓' : ''}
        </div>
      </div>

      <div className="input-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="input-time">
            <span>In-Universe Time <span className="form-label-req">*</span></span>
          </label>
          <input
            type="number"
            id="input-time"
            value={formData.in_universe_time}
            onChange={(e) => onChange({ in_universe_time: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
            placeholder="e.g. 850"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="input-chapter">
            <span>Chapter</span>
          </label>
          <input
            type="number"
            id="input-chapter"
            value={formData.chapter}
            onChange={(e) => onChange({ chapter: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
            placeholder="e.g. 12"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="input-position">
            <span>Position <span className="panel-meta">(optional)</span></span>
          </label>
          <input
            type="number"
            step="0.01"
            id="input-position"
            value={formData.manuscript_position ?? ''}
            onChange={(e) => onChange({ manuscript_position: e.target.value === '' ? '' : parseFloat(e.target.value) })}
            placeholder="e.g. 0.45"
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        type="button"
        id="check-continuity-btn"
        className="btn-primary"
        onClick={onSubmit}
        disabled={isSubmitDisabled}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            <span>Evaluating Timeline Graph...</span>
          </>
        ) : (
          <span>&gt; Check Continuity</span>
        )}
      </button>
    </div>
  );
};
