import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'

export default function App() {
  const nav = useNavigate()
  useEffect(()=>{
    const t = localStorage.getItem('token')
    if(!t) nav('/login')
  },[])
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  )
}
