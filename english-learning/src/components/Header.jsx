import { Link, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, BarChart2, LogOut, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { language, setLanguage, currentUser, logout } = useApp();
  const location = useLocation();
  const isStudy = location.pathname.startsWith('/study');

  return (
    <>
      <header className="header">
        <Link to="/" className="header-logo">
          <BookOpen size={20} strokeWidth={2} />
          <span className="header-logo-text">
            {language === 'en' ? 'Language Learning' : 'Aprendizaje'}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="header-nav header-nav--desktop">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'nav-link--active' : ''}`}>
            {language === 'en' ? 'Dashboard' : 'Inicio'}
          </Link>
          <Link to="/progress" className={`nav-link ${location.pathname === '/progress' ? 'nav-link--active' : ''}`}>
            {language === 'en' ? 'Progress' : 'Progreso'}
          </Link>
        </nav>

        <div className="header-right">
          <div className="header-lang">
            <button className={`lang-btn ${language === 'en' ? 'lang-btn--active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
            <span className="lang-sep">/</span>
            <button className={`lang-btn ${language === 'es' ? 'lang-btn--active' : ''}`} onClick={() => setLanguage('es')}>ES</button>
          </div>

          {currentUser && (
            <div className="header-user">
              <User size={13} strokeWidth={2} />
              <span className="header-username">{currentUser.username}</span>
              <button className="btn-logout" onClick={logout} title="Sign out">
                <LogOut size={13} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile bottom navigation */}
      {!isStudy && (
        <nav className="bottom-nav">
          <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'bottom-nav-item--active' : ''}`}>
            <LayoutDashboard size={22} strokeWidth={1.8} />
            <span>{language === 'en' ? 'Home' : 'Inicio'}</span>
          </Link>
          <Link to="/progress" className={`bottom-nav-item ${location.pathname === '/progress' ? 'bottom-nav-item--active' : ''}`}>
            <BarChart2 size={22} strokeWidth={1.8} />
            <span>{language === 'en' ? 'Progress' : 'Progreso'}</span>
          </Link>
        </nav>
      )}
    </>
  );
}
