import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function PatientCard({ p }) {
  const [imgUrl, setImgUrl] = useState('/placeholder.png')

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/latest-biopsy-image/${p.patient_id}`)
        if (res.data.imageUrl) {
          setImgUrl(`http://localhost:8000${res.data.imageUrl}`)
        }
      } catch (err) {
        console.error("Failed to fetch biopsy image:", err)
      }
    }
    fetchImage()
  }, [p.patient_id])

  return (
    <Link
      to={`/monitor/${p.patient_id}`}
      className="card p-4 hover:shadow-md transition block"
    >
      <img
        src={imgUrl}
        alt="Biopsy"
        className="w-full h-40 object-cover rounded-md mb-3 border"
      />
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{p.name}</div>
      </div>
      <div className="mt-1 text-sm">Age: {p.age}</div>
      <div className="mt-1 text-sm">Weight: {p.weight} kg</div>
      <div className="mt-1 text-sm">Height: {p.height} cm</div>
      <div className="mt-1 text-sm">
        Cancer: {p.is_cancerous ? "Yes" : "No"}
      </div>
    </Link>
  )
}
