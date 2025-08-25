import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'

export default function PatientDetail(){
  const { id } = useParams()
  const [p,setP]=useState(null)
  const [file,setFile]=useState(null)
  const [msg,setMsg]=useState('')
  useEffect(()=>{ load() },[id])
  const load = async()=>{
    const r = await api.get(`/patients/${id}`)
    setP(r.data)
  }
  const up = async()=>{
    if(!file) return
    const form = new FormData()
    form.append('file', file)
    await api.post(`/patients/${id}/upload_mammogram`, form, { headers:{'Content-Type':'multipart/form-data'} })
    await load()
  }
  const analyze = async()=>{
    const r = await api.get(`/patients/${id}/analysis`)
    setMsg(`Prediction: ${r.data.prediction} | Score: ${r.data.score}`)
  }
  if(!p) return null
  return (
    <div className="grid gap-6">
      <div className="card p-4">
        <div className="text-xl font-semibold">{p.name}</div>
        <div className="text-sm text-muted">Patient ID: {p.patient_uid}</div>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div>Age: {p.age}</div>
          <div>Phone: {p.phone}</div>
          <div>Email: {p.email}</div>
          <div>Last Visit: {p.last_visit ? new Date(p.last_visit).toLocaleString() : ''}</div>
        </div>
        <div className="mt-3">Doctor Review: {p.doctor_review}</div>
        <div className="mt-3">Biopsy Result: {p.has_cancer===null ? 'Pending' : (p.has_cancer ? 'Positive' : 'Negative')}</div>
      </div>
      {p.has_cancer ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-4">
            <div className="mb-2 font-semibold">Add Mammogram</div>
            <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
            <button onClick={up} className="btn-primary mt-3">Upload</button>
          </div>
          <div className="card p-4">
            <div className="mb-2 font-semibold">Analysis</div>
            <button onClick={analyze} className="btn-primary">Run Analysis</button>
            {msg && <div className="mt-3 text-sm">{msg}</div>}
            {p.mammograms?.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {p.mammograms.map(m=>(
                  <div key={m.id} className="text-xs text-muted">{m.image_path.split('/').pop()}</div>
                ))}
              </div>
            ): <div className="text-sm text-muted mt-2">No mammograms uploaded yet</div>}
          </div>
        </div>
      ) : (
        <div className="card p-4 text-sm text-muted">Add biopsy report to enable mammogram analysis</div>
      )}
    </div>
  )
}
// import { useEffect, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import api from '../api'

// export default function PatientDetail() {
//   const { id } = useParams()
//   const [p, setP] = useState(null)
//   const [file, setFile] = useState(null)
//   const [preview, setPreview] = useState(null)
//   const [msg, setMsg] = useState('')

//   useEffect(() => { load() }, [id])

//   const load = async () => {
//     const r = await api.get(`/patients/${id}`)
//     setP(r.data)
//   }

//   const handleFileChange = (e) => {
//     const f = e.target.files?.[0] || null
//     setFile(f)
//     if (f) setPreview(URL.createObjectURL(f))
//     else setPreview(null)
//   }

//   const uploadFile = async () => {
//     if (!file) return alert("Please select an image first")
//     const form = new FormData()
//     form.append('file', file)
//     await api.post(`/patients/${id}/upload_mammogram`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
//     setFile(null)
//     setPreview(null)
//     await load()
//   }

//   const analyze = async () => {
//     if (!file && (!p.mammograms || !p.mammograms.length)) {
//       return alert("Please upload/select an image first for diagnosis")
//     }
//     const r = await api.get(`/patients/${id}/analysis`)
//     setMsg(`Prediction: ${r.data.prediction} | Score: ${r.data.score}`)
//   }

//   if (!p) return null

//   return (
//     <div className="grid gap-6">
//       {/* Patient Info */}
//       <div className="card p-4">
//         <div className="text-xl font-semibold">{p.name}</div>
//         <div className="text-sm text-muted">Patient ID: {p.patient_uid}</div>
//         <div className="grid sm:grid-cols-2 gap-3 mt-3">
//           <div>Age: {p.age}</div>
//           <div>Phone: {p.phone}</div>
//           <div>Email: {p.email}</div>
//           <div>Last Visit: {p.last_visit ? new Date(p.last_visit).toLocaleString() : ''}</div>
//         </div>
//         <div className="mt-3">Doctor Review: {p.doctor_review}</div>
//         <div className="mt-3">
//           Biopsy Result: {p.has_cancer === null ? 'Pending' : (p.has_cancer ? 'Positive' : 'Negative')}
//         </div>
//       </div>

//       {/* Mammogram Upload & Diagnosis */}
//       {p.has_cancer && (
//         <div className="grid md:grid-cols-2 gap-6">
//           {/* Upload + Preview */}
//           <div className="card p-4">
//             <div className="mb-2 font-semibold">Add Mammogram</div>
//             <div className="border border-gray-300 rounded h-48 flex items-center justify-center overflow-hidden">
//               {preview ? (
//                 <img src={preview} alt="Preview" className="w-full h-full object-cover" />
//               ) : (
//                 <span className="text-gray-400">No image selected</span>
//               )}
//             </div>
//             <input 
//               type="file" 
//               accept="image/*" 
//               onChange={handleFileChange} 
//               className="mt-2 w-full"
//             />
//             <button onClick={uploadFile} className="btn-primary mt-2 w-full">Upload</button>
//             <button onClick={analyze} className="btn-primary mt-2 w-full">Diagnosis</button>
//             {msg && <div className="mt-3 text-sm">{msg}</div>}
//           </div>

//           {/* Existing Mammograms */}
//           <div className="card p-4">
//             <div className="mb-2 font-semibold">Existing Mammograms</div>
//             {p.mammograms?.length ? (
//               <div className="mt-3 grid grid-cols-2 gap-2">
//                 {p.mammograms.map(m => (
//                   <img
//                     key={m.id}
//                     src={`http://localhost:5000/${m.image_path}`}
//                     alt="Mammogram"
//                     className="w-full h-32 object-cover rounded"
//                   />
//                 ))}
//               </div>
//             ) : (
//               <div className="text-sm text-muted mt-2">No mammograms uploaded yet</div>
//             )}
//           </div>
//         </div>
//       )}

//       {!p.has_cancer && (
//         <div className="card p-4 text-sm text-muted">
//           Add biopsy report to enable mammogram analysis
//         </div>
//       )}
//     </div>
//   )
// }
