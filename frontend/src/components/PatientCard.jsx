import { Link } from 'react-router-dom'

export default function PatientCard({p}){
  return (
    <Link to={`/patient/${p.patient_uid}`} className="card p-4 hover:shadow-md transition block">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{p.name}</div>
        <div className="text-xs text-muted">{p.last_visit ? new Date(p.last_visit).toLocaleString() : ''}</div>
      </div>
      <div className="mt-1 text-sm">Age: {p.age}</div>
      <div className="mt-1 text-sm">Email: {p.email}</div>
      <div className="mt-1 text-sm">Phone: {p.phone}</div>
      <div className="mt-1 text-sm">Cancer: {p.has_cancer === null ? '—' : (p.has_cancer ? 'Yes' : 'No')}</div>
    </Link>
  )
}
