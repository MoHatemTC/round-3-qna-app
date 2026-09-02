import './App.css'
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
  )
}

export default App