import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GamificationProvider } from './engine';
import { AppLayout } from './layouts';
import { Dashboard, CoursePage, CoursesPage, CourseWorkshop, PracticePage, MadMinutePage, LessonPage } from './pages';

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
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="workshop" element={<CourseWorkshop />} />
            <Route path="workshop/:courseId" element={<CourseWorkshop />} />
            <Route path="course/:moduleId" element={<CoursePage />} />
            <Route path="practice/:moduleId" element={<PracticePage />} />
            <Route path="lesson/:moduleId/:roundId" element={<LessonPage />} />
            <Route path="mad-minute/:moduleId" element={<MadMinutePage />} />
            <Route path="profile" element={<div style={{ textAlign: 'center', padding: '60px 20px' }}><h2>Profile</h2><p>Coming soon...</p></div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GamificationProvider>
  );
}

export default App;
