import { useRef } from 'react'

export default function UploadBox({onFile}){
  const ref = useRef()
  return (
    <div className="border-2 border-dashed border-primary rounded-2xl p-6 flex flex-col items-center justify-center gap-3 bg-primary/5">
      <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-3xl">+</div>
      <div className="text-sm text-muted">Drop image here or</div>
      <button onClick={()=>ref.current.click()} className="btn-primary">Browse</button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e)=>onFile(e.target.files?.[0] || null)} />
    </div>
  )
}
