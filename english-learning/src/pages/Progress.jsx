import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Flame, GraduationCap, CheckCircle2, Trash2 } from 'lucide-react';

const PHRASE_COLORS = {
  affirmative:   '#22c55e',
  negative:      '#ef4444',
  interrogative: '#3b82f6',
};

const PHRASE_SYMBOLS = {
  affirmative:   '+',
  negative:      '−',
  interrogative: '?',
};

function CalendarView({ history, language }) {
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth();
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = today.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
    month: 'long', year: 'numeric',
  });

  const dayNames = language === 'en'
    ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    : ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="calendar">
      <div className="calendar-header">{monthName}</div>
      <div className="calendar-grid">
        {dayNames.map((d, i) => (
          <div key={i} className="calendar-day-name">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const entry   = history[dateStr];
          const isToday = day === today.getDate();
          const allDone = entry && entry.completed >= entry.total;

          return (
            <div
              key={dateStr}
              className={`calendar-day ${isToday ? 'calendar-day--today' : ''} ${allDone ? 'calendar-day--done' : entry ? 'calendar-day--partial' : ''}`}
              title={entry ? `${entry.completed}/${entry.total} modes` : ''}
            >
              {day}
              {entry && (
                <span className="calendar-dot" style={{ background: allDone ? '#22c55e' : '#f59e0b' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Progress() {
  const navigate = useNavigate();
  const { language, globalDayCounter, dailyHistory, db, modeProgress, resetProgress } = useApp();

  const totalDaysStudied    = Object.keys(dailyHistory).length;
  const totalModesCompleted = Object.values(dailyHistory).reduce((acc, d) => acc + (d.completed || 0), 0);

  const streak = (() => {
    let s = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (dailyHistory[dateStr]) s++;
      else if (i > 0) break;
    }
    return s;
  })();

  const handleReset = () => {
    if (window.confirm(language === 'en'
      ? 'Reset all progress? This cannot be undone.'
      : '¿Reiniciar todo el progreso? Esto no se puede deshacer.')) {
      resetProgress();
      navigate('/');
    }
  };

  const stats = [
    { icon: <CalendarDays size={22} strokeWidth={1.5} />, value: globalDayCounter, label: language === 'en' ? 'Total Days' : 'Días Totales' },
    { icon: <Flame size={22} strokeWidth={1.5} />,        value: streak,           label: language === 'en' ? 'Streak' : 'Racha' },
    { icon: <GraduationCap size={22} strokeWidth={1.5} />, value: totalDaysStudied, label: language === 'en' ? 'Days Studied' : 'Días Estudiados' },
    { icon: <CheckCircle2 size={22} strokeWidth={1.5} />, value: totalModesCompleted, label: language === 'en' ? 'Modes Done' : 'Modos Hechos' },
  ];

  return (
    <div className="progress-page">
      <h2 className="progress-title">
        {language === 'en' ? 'My Progress' : 'Mi Progreso'}
      </h2>

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <CalendarView history={dailyHistory} language={language} />

      <div className="mode-progress-section">
        <h3 className="section-title">
          {language === 'en' ? 'Mode Progress' : 'Progreso por Modo'}
        </h3>
        <div className="mode-progress-list">
          {db.modes.map(mode => {
            const sets = db.sentence_sets.filter(s => s.mode_id === mode.id);
            const prog = modeProgress[mode.id] || { nextSetIndex: 0 };
            const cur  = prog.nextSetIndex % Math.max(sets.length, 1);
            const pct  = sets.length > 0 ? Math.round((cur / sets.length) * 100) : 0;

            return (
              <div key={mode.id} className="mode-progress-item">
                <div className="mode-progress-name">{mode.name[language]}</div>
                <div className="mode-progress-bar-wrap">
                  <div className="mode-progress-bar-bg">
                    <div className="mode-progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="mode-progress-pct">{cur}/{sets.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {Object.keys(dailyHistory).length > 0 && (
        <div className="history-section">
          <h3 className="section-title">
            {language === 'en' ? 'Recent Sessions' : 'Sesiones Recientes'}
          </h3>
          <div className="history-list">
            {Object.entries(dailyHistory)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 10)
              .map(([date, entry]) => (
                <div key={date} className="history-item">
                  <div className="history-date">
                    {new Date(date + 'T12:00:00').toLocaleDateString(
                      language === 'en' ? 'en-US' : 'es-ES',
                      { weekday: 'short', month: 'short', day: 'numeric' }
                    )}
                  </div>
                  <div className="history-modes">
                    {entry.completed}/{entry.total} {language === 'en' ? 'modes' : 'modos'}
                  </div>
                  {entry.phraseType && (
                    <span
                      className="history-phrase-type"
                      style={{ background: PHRASE_COLORS[entry.phraseType] }}
                    >
                      {PHRASE_SYMBOLS[entry.phraseType]}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="progress-footer">
        <button className="btn btn-danger" onClick={handleReset}>
          <Trash2 size={15} strokeWidth={2} />
          {language === 'en' ? 'Reset Progress' : 'Reiniciar Progreso'}
        </button>
      </div>
    </div>
  );
}
