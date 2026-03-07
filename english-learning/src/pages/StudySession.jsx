import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const PHRASE_LABELS = {
  affirmative:  { en: 'Affirmative (+)', es: 'Afirmativa (+)', color: '#22c55e' },
  negative:     { en: 'Negative (–)',    es: 'Negativa (–)',    color: '#ef4444' },
  interrogative:{ en: 'Interrogative (?)', es: 'Interrogativa (?)', color: '#3b82f6' },
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function StudySession() {
  const { modeIndex } = useParams();
  const navigate = useNavigate();
  const { language, phraseType, getTodayPlan, completeMode, db } = useApp();

  const plan = getTodayPlan();
  const currentIndex = parseInt(modeIndex, 10);
  const item = plan[currentIndex];

  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'incorrect'
  const [showPhrase, setShowPhrase] = useState(false);
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setInput('');
    setFeedback(null);
    setShowPhrase(false);
    setCompleted(false);
    if (inputRef.current) inputRef.current.focus();
  }, [currentIndex]);

  if (!item || !item.sentenceSet) {
    return (
      <div className="study-error">
        <p>{language === 'en' ? 'No content available.' : 'Sin contenido disponible.'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          {language === 'en' ? 'Back to Dashboard' : 'Volver al Dashboard'}
        </button>
      </div>
    );
  }

  if (item.completed) {
    // Skip to next
    const next = plan.findIndex((p, i) => i > currentIndex && !p.completed);
    if (next >= 0) navigate(`/study/${next}`, { replace: true });
    else navigate('/');
    return null;
  }

  const { mode, sentenceSet } = item;
  const verb = db.verbs.find(v => v.id === sentenceSet.verb_id);
  const category = db.categories.find(c => c.id === sentenceSet.category_id);
  const examples = sentenceSet.examples[language];
  const targetPhrase = examples?.[phraseType] || '';
  const phraseLabel = PHRASE_LABELS[phraseType];
  const isBible = sentenceSet.category_id === 'bible';
  const bibleRef = sentenceSet.bible_reference;

  function handleVerify() {
    if (!input.trim()) return;
    const correct = normalizeText(input) === normalizeText(targetPhrase);
    setFeedback(correct ? 'correct' : 'incorrect');
    setShowPhrase(true);
    if (correct) {
      setCompleted(true);
    }
  }

  function handleRetry() {
    setInput('');
    setFeedback(null);
    setShowPhrase(false);
    if (inputRef.current) inputRef.current.focus();
  }

  function handleNext() {
    completeMode(mode.id);
    const nextIncomplete = plan.findIndex((p, i) => i > currentIndex && !p.completed);
    if (nextIncomplete >= 0) {
      navigate(`/study/${nextIncomplete}`);
    } else {
      navigate('/');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && feedback === null) {
      e.preventDefault();
      handleVerify();
    }
  }

  const completedCount = plan.filter(p => p.completed).length;
  const totalCount = plan.length;

  return (
    <div className="study-session">
      {/* Top progress bar */}
      <div className="session-progress-bar">
        <div
          className="session-progress-fill"
          style={{ width: `${(completedCount / totalCount) * 100}%`, background: phraseLabel.color }}
        />
      </div>

      <div className="session-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← {language === 'en' ? 'Dashboard' : 'Inicio'}
        </button>
        <div className="session-counter">{completedCount + 1}/{totalCount}</div>
      </div>

      <div className="session-card">
        {/* Mode & Category */}
        <div className="session-mode-header">
          <div className="session-mode-name">{mode.name[language]}</div>
          <div className="session-category">
            {isBible && <span className="bible-badge">✟ Bible</span>}
            <span className="category-badge">{category?.name[language]}</span>
            <span
              className="phrase-type-badge-sm"
              style={{ background: phraseLabel.color }}
            >
              {phraseLabel[language]}
            </span>
          </div>
        </div>

        {/* Mode definition */}
        <div className="session-definition">
          <span className="definition-label">{language === 'en' ? 'Definition:' : 'Definición:'}</span>
          {' '}{mode.definition[language]}
        </div>

        {/* Verb block */}
        {verb && (
          <div className="session-verb-block">
            <div className="session-verb">
              <span className="verb-word">{verb.word[language]}</span>
            </div>
            <div className="session-verb-def">{verb.definition[language]}</div>
          </div>
        )}

        <hr className="session-divider" />

        {/* Phrase display */}
        <div className="session-phrase-section">
          <div
            className="session-phrase-label"
            style={{ color: phraseLabel.color }}
          >
            {language === 'en' ? 'Phrase to practice:' : 'Frase para practicar:'}
          </div>
          <div className="session-phrase">
            "{targetPhrase}"
          </div>
          {isBible && bibleRef && (
            <div className="bible-reference">
              — {bibleRef.book} {bibleRef.chapter}:{bibleRef.verse} ({language === 'en' ? bibleRef.version_en : bibleRef.version_es})
            </div>
          )}
        </div>

        <hr className="session-divider" />

        {/* Rewrite section */}
        <div className="session-rewrite">
          <label className="rewrite-label">
            {language === 'en' ? 'Rewrite the phrase:' : 'Reescriba la frase:'}
          </label>
          <textarea
            ref={inputRef}
            className={`rewrite-input ${feedback === 'correct' ? 'input-correct' : feedback === 'incorrect' ? 'input-incorrect' : ''}`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={completed}
            rows={3}
            placeholder={language === 'en' ? 'Type the phrase here...' : 'Escriba la frase aquí...'}
          />

          {/* Feedback */}
          {feedback && (
            <div className={`feedback-box ${feedback === 'correct' ? 'feedback-correct' : 'feedback-incorrect'}`}>
              {feedback === 'correct' ? (
                <>
                  <span className="feedback-icon">✓</span>
                  {language === 'en' ? 'Correct! Well done.' : '¡Correcto! ¡Bien hecho.'}
                </>
              ) : (
                <>
                  <span className="feedback-icon">✗</span>
                  {language === 'en' ? 'Not quite. The correct phrase:' : 'Casi. La frase correcta:'}
                  <div className="correct-phrase">"{targetPhrase}"</div>
                </>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="session-actions">
            {!feedback && (
              <button className="btn btn-primary" onClick={handleVerify} disabled={!input.trim()}>
                {language === 'en' ? 'Check' : 'Verificar'}
              </button>
            )}
            {feedback === 'incorrect' && (
              <button className="btn btn-secondary" onClick={handleRetry}>
                {language === 'en' ? 'Try Again' : 'Intentar de nuevo'}
              </button>
            )}
            {(feedback === 'correct' || feedback === 'incorrect') && (
              <button
                className="btn btn-next"
                onClick={handleNext}
                style={{ borderColor: phraseLabel.color, color: phraseLabel.color }}
              >
                {currentIndex === totalCount - 1
                  ? (language === 'en' ? 'Finish Session ✓' : 'Finalizar Sesión ✓')
                  : (language === 'en' ? 'Next Mode →' : 'Siguiente Modo →')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
