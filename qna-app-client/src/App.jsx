import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import { Proxy, PublicRoute } from './utils/proxy';
import VerifyAccountPage from './pages/VerifyAccountPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/verify-account' element={<VerifyAccountPage />} />
        </Route>
        <Route element={<Proxy />}> {/* add admin-panel and student dashboard here */} </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
