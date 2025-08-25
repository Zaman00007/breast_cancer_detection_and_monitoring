import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Register(){
  const [name,setName]=useState('')
  const [doctor_id,setDoctorId]=useState('')
  const [password,setPassword]=useState('')
  const [err,setErr]=useState('')
  const [ok,setOk]=useState('')
  const nav = useNavigate()
  const submit = async(e)=>{
    e.preventDefault()
    setErr(''); setOk('')
    try{
      await api.post('/auth/register',{name,doctor_id,password})
      setOk('Registered. You can login now.')
      setTimeout(()=>nav('/login'),1000)
    }catch(e){ setErr(e?.response?.data?.error || 'Registration failed') }
  }
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="card w-full max-w-md p-6">
        <div className="text-2xl font-semibold mb-4 text-center">Doctor Registration</div>
        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
        {ok && <div className="mb-3 text-sm text-green-700">{ok}</div>}
        <form onSubmit={submit} className="grid gap-3">
          <div>
            <div className="label mb-1">Doctor Name</div>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <div className="label mb-1">Doctor ID</div>
            <input className="input" value={doctor_id} onChange={e=>setDoctorId(e.target.value)} placeholder="DOC1001...DOC1010" />
          </div>
          <div>
            <div className="label mb-1">Password</div>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <button className="btn-primary w-full mt-2">Register</button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already registered? <Link className="text-secondary" to="/login">Login</Link>
        </div>
      </div>
    </div>
  )
}
