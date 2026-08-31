import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import StudentDashboard from './features/student/StudentDashboard'
import InviteEntry from './features/student/InviteEntry'
import QuizPlaceholder from './features/student/QuizPlaceholder'

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