import { Link, useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function Navbar() {
  const nav = useNavigate()
  const logout = () => { 
    localStorage.removeItem('token'); 
    nav('/login') 
  }

  return (
    <div className="w-full bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-primary/20 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white">
            <Home size={22} strokeWidth={2.2} />
          </span>
          <span className="font-bold text-2xl">OncoVision</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/home" className="text-muted hover:text-text">Home</Link>
          <Link to="/add" className="btn-primary">Add Patient</Link>
          <button 
            onClick={logout} 
            className="rounded-xl px-3 py-2 border border-primary/30 hover:bg-primary/10"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
