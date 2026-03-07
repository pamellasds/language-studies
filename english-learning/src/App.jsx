import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import StudySession from './pages/StudySession';
import Progress from './pages/Progress';
import LoginPage from './pages/LoginPage';

function AppRoutes() {
  const { currentUser } = useApp();
  if (!currentUser) return <LoginPage />;
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/study/:modeIndex" element={<StudySession />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
