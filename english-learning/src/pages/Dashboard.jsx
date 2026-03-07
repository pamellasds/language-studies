import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProgressBar from '../components/ProgressBar';
import LoadingScreen from '../components/LoadingScreen';

const PHRASE_LABELS = {
  affirmative: { en: 'Affirmative (+)', es: 'Afirmativa (+)', icon: '✚', color: '#22c55e' },
  negative:    { en: 'Negative (–)',    es: 'Negativa (–)',    icon: '−', color: '#ef4444' },
  interrogative:{ en: 'Interrogative (?)', es: 'Interrogativa (?)', icon: '?', color: '#3b82f6' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { language, globalDayCounter, phraseType, getTodayPlan, todayCompleted, db, dbLoading, dbError } = useApp();

  if (dbLoading) return <LoadingScreen language={language} />;


  const plan = getTodayPlan();
  const completed = plan.filter(p => p.completed).length;
  const total = plan.length;
  const phraseLabel = PHRASE_LABELS[phraseType];
  const allDone = completed === total;

  const today = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Find the first non-completed mode index
  const nextModeIndex = plan.findIndex(p => !p.completed);

  function handleStart() {
    if (nextModeIndex >= 0) {
      navigate(`/study/${nextModeIndex}`);
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="day-badge">
          <span className="day-icon">📅</span>
          <div>
            <div className="day-number">{language === 'en' ? `Day ${globalDayCounter}` : `Día ${globalDayCounter}`}</div>
            <div className="day-date">{today}</div>
          </div>
        </div>

        <div className="phrase-type-badge" style={{ borderColor: phraseLabel.color, color: phraseLabel.color }}>
          <span className="phrase-icon">{phraseLabel.icon}</span>
          <div>
            <div className="phrase-type-label">
              {language === 'en' ? 'Today\'s phrase type' : 'Tipo de frase de hoy'}
            </div>
            <div className="phrase-type-name">{phraseLabel[language]}</div>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <span>{language === 'en' ? 'Daily Progress' : 'Progreso diario'}</span>
          <span className="progress-count">{completed}/{total} {language === 'en' ? 'modes' : 'modos'}</span>
        </div>
        <ProgressBar value={completed} max={total} color={phraseLabel.color} />
      </div>

      <div className="modes-list">
        <h3 className="modes-title">
          {language === 'en' ? `Modes for today (${total} total)` : `Modos del día (${total} en total)`}
        </h3>
        {plan.map((item, index) => {
          if (!item.sentenceSet) return null;
          const verb = db.verbs.find(v => v.id === item.sentenceSet.verb_id);
          const category = db.categories.find(c => c.id === item.sentenceSet.category_id);
          const isBible = item.sentenceSet.category_id === 'bible';
          const isNext = index === nextModeIndex;

          return (
            <div
              key={item.mode.id}
              className={`mode-card ${item.completed ? 'mode-card--done' : ''} ${isNext ? 'mode-card--next' : ''}`}
              onClick={() => !item.completed && navigate(`/study/${index}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && !item.completed && navigate(`/study/${index}`)}
            >
              <div className="mode-card-status">
                {item.completed ? (
                  <span className="status-icon status-done">✓</span>
                ) : isNext ? (
                  <span className="status-icon status-next">▶</span>
                ) : (
                  <span className="status-icon status-pending">○</span>
                )}
              </div>
              <div className="mode-card-content">
                <div className="mode-card-name">{item.mode.name[language]}</div>
                <div className="mode-card-info">
                  {isBible && <span className="bible-tag">✟</span>}
                  <span className="category-tag">{category?.name[language]}</span>
                  {verb && (
                    <span className="verb-tag">
                      {verb.word[language]}
                    </span>
                  )}
                </div>
              </div>
              {!item.completed && (
                <div className="mode-card-phrase-type" style={{ color: phraseLabel.color }}>
                  {phraseLabel[language]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="dashboard-footer">
        {allDone ? (
          <div className="all-done">
            <div className="all-done-icon">🎉</div>
            <div className="all-done-text">
              {language === 'en'
                ? 'Great job! All modes completed for today!'
                : '¡Excelente trabajo! ¡Todos los modos completados hoy!'}
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/progress')}>
              {language === 'en' ? 'View Progress' : 'Ver Progreso'}
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={handleStart}>
            {completed === 0
              ? (language === 'en' ? '▶ Start Study Session' : '▶ Iniciar Sesión de Estudio')
              : (language === 'en' ? '▶ Continue Study' : '▶ Continuar Estudio')}
          </button>
        )}
      </div>
    </div>
  );
}
