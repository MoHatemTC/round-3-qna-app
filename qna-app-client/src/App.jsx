import { useEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import './App.css'
import SplashScreen from './components/SplashScreen'
import HomePage from './pages/HomePage'
import AssessmentsPage from './pages/AssessmentsPage'
import InterviewsPage from './pages/InterviewsPage'
import WhatsNewPage from './pages/WhatsNewPage'
import HelpCenterPage from './pages/HelpCenterPage'
import BlogPage from './pages/BlogPage'
import ReviewsPage from './pages/ReviewsPage'
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
  const location = useLocation()
  const [showSplash, setShowSplash] = useState(true)
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      const minDelay = new Promise((resolve) => setTimeout(resolve, 1100))
      const fontsReady = document.fonts?.ready ?? Promise.resolve()
      Promise.all([minDelay, fontsReady]).then(() => setShowSplash(false))
      return
    }

    setShowSplash(true)
    const timeout = setTimeout(() => setShowSplash(false), 700)
    return () => clearTimeout(timeout)
  }, [location.pathname])

  return (
    <>
      <SplashScreen visible={showSplash} />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/features/assessments' element={<AssessmentsPage />} />
        <Route path='/features/interviews' element={<InterviewsPage />} />
        <Route path='/resources/whats-new' element={<WhatsNewPage />} />
        <Route path='/resources/help-center' element={<HelpCenterPage />} />
        <Route path='/resources/blog' element={<BlogPage />} />
        <Route path='/resources/reviews' element={<ReviewsPage />} />
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
    </>
  )
}

export default App