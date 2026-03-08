import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import fallbackDb from '../data/db.json';

const AppContext  = createContext(null);
const API_BASE    = '/api';
const SESSION_KEY = 'el_session'; // stores { id, username, language }

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

const BLANK_PROGRESS = {
  globalDayCounter: 1,
  studyStartDate:   new Date().toISOString().split('T')[0],
  modeProgress:     {},
  dailyHistory:     {},
  todayCompleted:   [],
  lastStudyDate:    null,
};

// Advance day counter if the user didn't study today
function advanceDay(prog) {
  const today = new Date().toISOString().split('T')[0];
  if (!prog.lastStudyDate || prog.lastStudyDate === today) return prog;
  const diff = Math.round((new Date(today) - new Date(prog.lastStudyDate)) / 86400000);
  if (diff < 1) return prog;
  return { ...prog, globalDayCounter: prog.globalDayCounter + diff, todayCompleted: [] };
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(loadSession);
  const [progress, setProgress]       = useState(BLANK_PROGRESS);
  const [db, setDb]                   = useState(fallbackDb);
  const [dbLoading, setDbLoading]     = useState(true);
  const [dbError, setDbError]         = useState(null);
  const syncTimer                     = useRef(null);
  const fetchedDb                     = useRef(false);

  // ── Load content from MongoDB ──────────────────────────────────────────
  useEffect(() => {
    if (fetchedDb.current) return;
    fetchedDb.current = true;
    fetch(`${API_BASE}/data`)
      .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); })
      .then(data => { setDb(data); setDbError(null); })
      .catch(err => { console.warn('⚠ Fallback to local db.json:', err.message); setDbError(err.message); })
      .finally(() => setDbLoading(false));
  }, []);

  // ── Restore session on reload ──────────────────────────────────────────
  useEffect(() => {
    const session = loadSession();
    if (!session) { setDbLoading(false); return; }
    const lang = session.language || 'en';
    fetch(`${API_BASE}/auth/me/${session.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { localStorage.removeItem(SESSION_KEY); setCurrentUser(null); return; }
        setCurrentUser(data.user);
        // Load progress for the saved language
        return fetch(`${API_BASE}/progress/${session.id}?lang=${lang}`);
      })
      .then(r => (r && r.ok) ? r.json() : null)
      .then(prog => {
        if (prog?.globalDayCounter) setProgress(advanceDay(prog));
      })
      .catch(() => {});
  }, []);

  // ── Debounced sync to MongoDB ─────────────────────────────────────────
  const syncProgress = useCallback((newProgress) => {
    if (!currentUser) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch(`${API_BASE}/progress/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProgress, language }),
      }).catch(() => {});
    }, 800);
  }, [currentUser, language]);

  // ── Login ─────────────────────────────────────────────────────────────
  async function login(username, password) {
    try {
      const r = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (!r.ok) return data.error || 'Login failed';
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      setCurrentUser(data.user);
      setProgress(data.progress?.globalDayCounter ? advanceDay(data.progress) : BLANK_PROGRESS);
      return null;
    } catch {
      return 'Could not reach server';
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setProgress(BLANK_PROGRESS);
  }

  // ── Language ──────────────────────────────────────────────────────────
  const language = currentUser?.language || 'en';

  function setLanguage(lang) {
    const updated = { ...currentUser, language: lang };
    setCurrentUser(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    if (currentUser) {
      fetch(`${API_BASE}/auth/language`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, language: lang }),
      }).catch(() => {});
      // Load progress for the new language
      fetch(`${API_BASE}/progress/${currentUser.id}?lang=${lang}`)
        .then(r => r.ok ? r.json() : null)
        .then(prog => {
          setProgress(prog?.globalDayCounter ? advanceDay(prog) : BLANK_PROGRESS);
        })
        .catch(() => setProgress(BLANK_PROGRESS));
    }
  }

  // ── Study logic ───────────────────────────────────────────────────────
  const phraseType = ['affirmative', 'negative', 'interrogative'][(progress.globalDayCounter - 1) % 3];

  function getSentenceSetForMode(modeId) {
    const sets = db.sentence_sets.filter(s => s.mode_id === modeId);
    if (sets.length === 0) return null;
    const idx = (progress.modeProgress[modeId]?.nextSetIndex || 0) % sets.length;
    return sets[idx];
  }

  function getTodayPlan() {
    return db.modes.map(mode => ({
      mode,
      sentenceSet: getSentenceSetForMode(mode.id),
      completed: progress.todayCompleted.includes(mode.id),
    }));
  }

  function completeMode(modeId) {
    const today = new Date().toISOString().split('T')[0];
    const sets  = db.sentence_sets.filter(s => s.mode_id === modeId);
    const cur   = (progress.modeProgress[modeId]?.nextSetIndex || 0) % Math.max(sets.length, 1);
    const next  = (cur + 1) % Math.max(sets.length, 1);

    setProgress(prev => {
      const newCompleted = prev.todayCompleted.includes(modeId)
        ? prev.todayCompleted : [...prev.todayCompleted, modeId];
      const allModes = db.modes.map(m => m.id);
      const allDone  = allModes.every(id => newCompleted.includes(id));

      const newHistory = { ...prev.dailyHistory };
      if (!newHistory[today]) newHistory[today] = { completed: 0, total: db.modes.length };
      newHistory[today] = { ...newHistory[today], completed: newCompleted.length, phraseType };

      const updated = {
        ...prev,
        todayCompleted: newCompleted,
        lastStudyDate:  today,
        modeProgress:   { ...prev.modeProgress, [modeId]: { nextSetIndex: next } },
        dailyHistory:   newHistory,
        globalDayCounter:
          allDone && !prev.todayCompleted.includes(modeId) && newCompleted.length === allModes.length
            ? prev.globalDayCounter + 1 : prev.globalDayCounter,
      };
      syncProgress(updated);
      return updated;
    });
  }

  function resetProgress() {
    const fresh = { ...BLANK_PROGRESS, studyStartDate: new Date().toISOString().split('T')[0] };
    setProgress(fresh);
    syncProgress(fresh);
  }

  return (
    <AppContext.Provider value={{
      currentUser,
      language,
      db, dbLoading, dbError,
      phraseType,
      ...progress,
      login, logout, setLanguage,
      getSentenceSetForMode,
      getTodayPlan,
      completeMode,
      resetProgress,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
