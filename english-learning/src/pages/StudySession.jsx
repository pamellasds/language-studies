import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, BookHeart, Volume2, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const LANG_VOICE = { en: 'en-US', es: 'es-ES' };

function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  function speak(text, lang) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_VOICE[lang] || 'en-US';
    u.rate = 0.88;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }

  return { speak, speaking };
}

function SpeakBtn({ text, lang }) {
  const { speak, speaking } = useSpeech();
  return (
    <button
      className="btn-speak"
      onClick={() => speak(text, lang)}
      title="Listen"
      type="button"
    >
      {speaking
        ? <Loader2 size={16} strokeWidth={2} className="spin" />
        : <Volume2 size={16} strokeWidth={2} />}
    </button>
  );
}

const WRONG_KEY = 'study_wrong_queue';

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
    .replace(/[.,!?;:\-–—]+/g, ' ')  // punctuation → space
    .replace(/\s+/g, ' ')
    .trim();
}

export default function StudySession() {
  const { modeIndex } = useParams();
  const [searchParams] = useSearchParams();
  const isRetry = searchParams.get('retry') === 'true';
  const navigate = useNavigate();
  const { language, phraseType, getTodayPlan, completeMode, db } = useApp();

  const plan = getTodayPlan();
  const currentIndex = parseInt(modeIndex, 10);
  const item = plan[currentIndex];

  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'incorrect'
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setInput('');
    setFeedback(null);
    setCompleted(false);
    if (inputRef.current) inputRef.current.focus();
  }, [currentIndex, isRetry]);

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
    if (correct) setCompleted(true);
  }

  function handleNext() {
    if (isRetry) {
      // Advance sentence set only if correct
      completeMode(mode.id, feedback === 'correct');
      const queue = JSON.parse(sessionStorage.getItem(WRONG_KEY) || '[]');
      const pos = queue.indexOf(currentIndex);
      const nextWrong = queue[pos + 1];
      if (nextWrong !== undefined) {
        navigate(`/study/${nextWrong}?retry=true`);
      } else {
        sessionStorage.removeItem(WRONG_KEY);
        navigate('/');
      }
      return;
    }

    // Track wrong answers for retry at end
    if (feedback === 'incorrect') {
      const queue = JSON.parse(sessionStorage.getItem(WRONG_KEY) || '[]');
      if (!queue.includes(currentIndex)) {
        sessionStorage.setItem(WRONG_KEY, JSON.stringify([...queue, currentIndex]));
      }
    }

    // Advance sentence set only if correct
    completeMode(mode.id, feedback === 'correct');
    const nextIncomplete = plan.findIndex((p, i) => i > currentIndex && !p.completed);
    if (nextIncomplete >= 0) {
      navigate(`/study/${nextIncomplete}`);
    } else {
      // All modes done — retry wrong answers if any
      const queue = JSON.parse(sessionStorage.getItem(WRONG_KEY) || '[]');
      if (queue.length > 0) {
        navigate(`/study/${queue[0]}?retry=true`);
      } else {
        navigate('/');
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && feedback === null) {
      e.preventDefault();
      handleVerify();
    }
  }

  const wrongQueue = JSON.parse(sessionStorage.getItem(WRONG_KEY) || '[]');
  const completedCount = isRetry
    ? wrongQueue.indexOf(currentIndex) + 1
    : plan.filter(p => p.completed).length;
  const totalCount = isRetry ? wrongQueue.length : plan.length;

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
        <button className="btn-back" onClick={() => { sessionStorage.removeItem(WRONG_KEY); navigate('/'); }}>
          ← {language === 'en' ? 'Dashboard' : 'Inicio'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isRetry && (
            <span style={{ fontSize: '0.75rem', background: '#f59e0b22', color: '#f59e0b', padding: '2px 8px', borderRadius: '999px', border: '1px solid #f59e0b55' }}>
              {language === 'en' ? 'Retrying errors' : 'Revisando errores'}
            </span>
          )}
          <div className="session-counter">{completedCount}/{totalCount}</div>
        </div>
      </div>

      <div className="session-card">
        {/* Mode & Category */}
        <div className="session-mode-header">
          <div className="session-mode-name">{mode.name[language]}</div>
          <div className="session-category">
            {isBible && <span className="bible-badge"><BookHeart size={12} strokeWidth={2} /> Bible</span>}
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
              <SpeakBtn text={verb.word[language]} lang={language} />
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
            <span>"{targetPhrase}"</span>
            <SpeakBtn text={targetPhrase} lang={language} />
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
                  <CheckCircle2 size={18} strokeWidth={2} className="feedback-icon" />
                  {language === 'en' ? 'Correct! Well done.' : '¡Correcto! ¡Bien hecho!'}
                </>
              ) : (
                <>
                  <XCircle size={18} strokeWidth={2} className="feedback-icon" />
                  <span>{language === 'en' ? 'Not quite. Correct phrase:' : 'Casi. Frase correcta:'}</span>
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
            {feedback && (
              <button
                className="btn btn-next"
                onClick={handleNext}
                style={{ borderColor: phraseLabel.color, color: phraseLabel.color }}
              >
                {isRetry && completedCount === totalCount
                  ? (language === 'en' ? 'Finish' : 'Finalizar')
                  : (language === 'en' ? 'Next' : 'Siguiente')}
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
