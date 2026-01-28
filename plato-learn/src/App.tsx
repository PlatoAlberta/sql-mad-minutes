import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GamificationProvider } from './engine';
import { AppLayout } from './layouts';
import { Home, ModulePage } from './pages';
import './styles/global.css';

/**
 * PLATO Learn - Main Application
 * A modular, gamified learning platform for software testing and development
 */
function App() {
  return (
    <GamificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="module/:moduleId" element={<ModulePage />} />
            <Route path="profile" element={<div style={{ textAlign: 'center', padding: '60px 20px' }}><h2>Profile</h2><p>Coming soon...</p></div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GamificationProvider>
  );
}

export default App;
