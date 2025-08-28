import { useEffect, useState } from 'react'
import axios from 'axios'
import PatientCard from '../components/PatientCard'
import { Link } from 'react-router-dom'

export default function Home() {
  const [recent, setRecent] = useState([])
  const [results, setResults] = useState([])
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadRecent()
  }, [])

  const loadRecent = async () => {
    try {
      const r = await axios.get('http://localhost:8000/patients/recent')
      setRecent(r.data)
    } catch (err) {
      console.error("Error loading recent patients:", err)
    }
  }

  const search = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      const r = await axios.get('http://localhost:8000/patients', {
        params: { search: q }
      })
      setResults(r.data)
      if (q && r.data.length === 0) setMsg('No patient record found')
    } catch (err) {
      console.error("Search failed:", err)
    }
  }

  return (
    <div>
      <div className="flex gap-3 items-center">
        <form onSubmit={search} className="flex w-full gap-3">
          <input
            className="input flex-[7]"
            placeholder="Search patient by name"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <Link to="/add" className="btn-primary flex-[3] text-center">
            Add New Patient
          </Link>
        </form>
      </div>

      <div className="mt-6">
        {q ? (
          <>
            {msg && <div className="text-sm text-muted mb-3">{msg}</div>}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {results.map(p => (
                <PatientCard key={p.patient_id} p={p} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-muted mb-3">Latest Patients</div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recent.map(p => (
                <PatientCard key={p.patient_id} p={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
