import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { language, setLanguage, currentUser, logout } = useApp();
  const location = useLocation();

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <span className="header-logo-icon">📖</span>
        <span className="header-logo-text">
          {language === 'en' ? 'Language Learning' : 'Aprendizaje de Idiomas'}
        </span>
      </Link>

      <nav className="header-nav">
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
            <span className="header-username">👤 {currentUser.username}</span>
            <button className="btn-logout" onClick={logout} title="Sign out">✕</button>
          </div>
        )}
      </div>
    </header>
  );
}
