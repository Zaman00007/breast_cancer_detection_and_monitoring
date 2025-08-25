
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login(){
  const [doctorId,setDoctorId] = useState('')
  const [password,setPassword] = useState('')
  const [err,setErr] = useState('')
  const nav = useNavigate()

  const submit = async(e)=>{
  e.preventDefault()
  setErr('')

  if (!doctorId || !password) {
    setErr("Please fill in both Doctor ID and Password")
    return
  }

  try {
    const r = await api.post('/auth/login', { doctor_id: doctorId, password })
    localStorage.setItem('token', r.data.access_token)
    nav('/home')
  } catch(e){ 
    setErr(e?.response?.data?.error || 'Login failed') 
  }
}


  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      
      {/* Left Image Section */}
      <div className="hidden md:flex items-center justify-center bg-white">
        <img 
          src="/login-image.jpg" 
          alt="Login" 
          className="w-[580px] h-[480px] rounded-2xl object-cover shadow-lg" 
        />
      </div>

      {/* Right Form Section */}
      <div className="flex items-center justify-center px-6">
        <div className="card w-full max-w-md p-6">
          <div className="text-4xl font-bold text-center text-purple-700">OncoVision</div>
          <div className="text-sm text-gray-600 mb-4 text-center italic">Vision for Cure</div>
          <div className="text-3xl font-semibold mb-1 text-center">Login</div>
          
          {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
          
          <form onSubmit={submit} className="grid gap-3">
            <div>
              <div className="label mb-1 text-sm">Doctor ID</div>
              <input 
                className="input text-base py-2 px-3" 
                value={doctorId} 
                onChange={e => setDoctorId(e.target.value)} 
                placeholder="e.g. DOC1001" 
              />
            </div>
            <div>
              <div className="label mb-1 text-sm">Password</div>
              <input 
                className="input text-base py-2 px-3" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
            <button className="btn-primary w-full mt-2 text-base py-2">Login</button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            New doctor? <Link className="text-secondary" to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
