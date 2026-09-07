import { Route, Routes } from 'react-router'
import './App.css'
<<<<<<< HEAD
import { BrowserRouter, Routes, Route } from "react-router-dom"
import StudentDashboard from './pages/StudentDashboard'
import InviteEntry from './pages/InviteEntry'
import QuizPlaceholder from './pages/QuizPlaceholder'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/quiz/invite/:token" element={<InviteEntry />} />
        <Route path="/quiz/:id" element={<QuizPlaceholder />} />
      </Routes>
    </BrowserRouter>
=======
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import { Proxy, PublicRoute } from './utils/proxy';
import VerifyAccountPage from './pages/VerifyAccountPage';
import AdminQuizzes from './pages/AdminQuizzes';
import StudentDashboard from './pages/StudentDashboard';

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
        <Route path='/dashboard' element={<StudentDashboard />} />
      </Route>
    </Routes>
>>>>>>> main
  )
}

export default App