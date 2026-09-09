import { Route, Routes } from 'react-router'
import './App.css'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import { Proxy, PublicRoute } from './utils/proxy';
import VerifyAccountPage from './pages/VerifyAccountPage';
import AdminQuizzes from './pages/AdminQuizzes';
import AdminQuizQuestions from './pages/AdminQuizQuestions';
import StudentDashboard from './pages/StudentDashboard';
import InviteEntry from './pages/InviteEntry';
import QuizPlaceholder from './pages/QuizPlaceholder';

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/verify-account' element={<VerifyAccountPage />} />
      </Route>
      <Route element={<Proxy />}>
        <Route path='/admin-panel' element={<AdminQuizzes />} />
        <Route path='/admin-panel/quizzes/:quizId/questions' element={<AdminQuizQuestions />} />
        <Route path='/dashboard' element={<StudentDashboard />} />
        <Route path="/quiz/invite/:token" element={<InviteEntry />} />
        <Route path="/quiz/:id" element={<QuizPlaceholder />} />
      
      </Route>
    </Routes>
  )
}

export default App