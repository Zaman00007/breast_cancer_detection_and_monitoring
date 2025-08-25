import { Outlet, Link, useNavigate, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import AddPatient from './pages/AddPatient'

export default function App() {
  const nav = useNavigate()
  // useEffect(()=>{
  //   const t = localStorage.getItem('token')
  //   if(!t) nav('/login')
  // },[])
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddPatient />} />
          {/* <Route path="*" element={<Outlet />} /> */}
        </Routes>
      </div>
    </div>
  )
}
