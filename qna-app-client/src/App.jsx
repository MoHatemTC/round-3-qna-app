import { Route, Routes } from 'react-router'
import './App.css'
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
  )
}

export default App
