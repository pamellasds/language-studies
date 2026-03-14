import { useNavigate } from 'react-router-dom';
import { CalendarDays, Check, Play, Circle, BookHeart, ChevronRight, PartyPopper } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProgressBar from '../components/ProgressBar';
import LoadingScreen from '../components/LoadingScreen';

const PHRASE_LABELS = {
  affirmative:  { en: 'Affirmative', es: 'Afirmativa',     symbol: '+', color: '#22c55e' },
  negative:     { en: 'Negative',    es: 'Negativa',        symbol: '−', color: '#ef4444' },
  interrogative:{ en: 'Interrogative', es: 'Interrogativa', symbol: '?', color: '#3b82f6' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { language, globalDayCounter, phraseType, getTodayPlan, db, dbLoading } = useApp();

  if (dbLoading) return <LoadingScreen language={language} />;

  const plan = getTodayPlan();
  const completed = plan.filter(p => p.completed).length;
  const total = plan.length;
  const phraseLabel = PHRASE_LABELS[phraseType];
  const allDone = completed === total;
  const nextModeIndex = plan.findIndex(p => !p.completed);

  const today = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
    weekday: 'long', month: 'short', day: 'numeric',
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="day-badge">
          <CalendarDays size={26} strokeWidth={1.5} className="badge-icon" />
          <div>
            <div className="day-number">{language === 'en' ? `Day ${globalDayCounter}` : `Día ${globalDayCounter}`}</div>
            <div className="day-date">{today}</div>
          </div>
        </div>

        <div className="phrase-type-badge" style={{ borderColor: phraseLabel.color, color: phraseLabel.color }}>
          <span className="phrase-icon">{phraseLabel.symbol}</span>
          <div>
            <div className="phrase-type-label">
              {language === 'en' ? "Today's type" : 'Tipo de hoy'}
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
          {language === 'en' ? `Today's modes (${total})` : `Modos del día (${total})`}
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
              onClick={() => navigate(`/study/${index}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(`/study/${index}`)}
            >
              <div className="mode-card-status">
                {item.completed ? (
                  <span className="status-icon status-done"><Check size={13} strokeWidth={3} /></span>
                ) : isNext ? (
                  <span className="status-icon status-next"><Play size={11} strokeWidth={2.5} fill="currentColor" /></span>
                ) : (
                  <span className="status-icon status-pending"><Circle size={13} strokeWidth={1.5} /></span>
                )}
              </div>
              <div className="mode-card-content">
                <div className="mode-card-name">{item.mode.name[language]}</div>
                <div className="mode-card-info">
                  {isBible && <span className="bible-tag"><BookHeart size={12} strokeWidth={2} /></span>}
                  <span className="category-tag">{category?.name[language]}</span>
                  {verb && <span className="verb-tag">{verb.word[language]}</span>}
                </div>
              </div>
              {!item.completed && (
                <ChevronRight size={16} strokeWidth={2} style={{ color: phraseLabel.color, flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="dashboard-footer">
        {allDone ? (
          <div className="all-done">
            <PartyPopper size={36} strokeWidth={1.5} style={{ color: '#22c55e' }} />
            <div className="all-done-text">
              {language === 'en'
                ? 'All modes completed for today!'
                : '¡Todos los modos completados!'}
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/progress')}>
              {language === 'en' ? 'View Progress' : 'Ver Progreso'}
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-full" onClick={() => navigate(`/study/${nextModeIndex}`)}>
            <Play size={16} strokeWidth={2} fill="currentColor" />
            {completed === 0
              ? (language === 'en' ? 'Start Study Session' : 'Iniciar Sesión')
              : (language === 'en' ? 'Continue Studying' : 'Continuar')}
          </button>
        )}
      </div>
    </div>
  );
}
