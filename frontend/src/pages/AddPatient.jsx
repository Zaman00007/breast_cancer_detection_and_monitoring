import { useState, useRef } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function AddPatient() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [f, setF] = useState({
    name: '',
    age: '',
    phone: '',
    email: '',
    doctor_review: '',
    prev_doctor_name: '',
    prev_doctor_history: '',
    prev_medicine_history: ''
  })
  const [status, setStatus] = useState('')  // Diagnosis result
  const fileInputRef = useRef()
  const [showPreview, setShowPreview] = useState(false)
  const nav = useNavigate()

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  const handleDiagnosis = async () => {
    if (!file) {
      alert('Please upload biopsy image first!')
      return
    }
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/patients/temp_diagnose', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      // Set the diagnosis result in field
      setStatus(res.data.has_cancer ? 'Yes' : 'No')
    } catch (e) {
      setStatus('Diagnosis failed')
    }
  }

const handleSubmit = async () => {
  // Required fields check
  const required = ["name", "age", "phone", "email", "doctor_review", "prev_medicine_history"];
  for (let field of required) {
    if (!f[field] || f[field].toString().trim() === "") {
      alert("Please fill all required fields!");
      return;
    }
  }

  try {
    const form = new FormData();
    form.append("name", f.name.toString().trim());
    form.append("age", f.age.toString());
    form.append("phone", f.phone.toString().trim());
    form.append("email", f.email.toString().trim());
    form.append("doctor_review", f.doctor_review.toString().trim());
    form.append("prev_doctor_name", f.prev_doctor_name?.toString().trim() || "");
    form.append("prev_doctor_history", f.prev_doctor_history?.toString().trim() || "");
    form.append("prev_medicine_history", f.prev_medicine_history.toString().trim());

    const r = await api.post("/patients", form); // multipart/form-data
    const pid = r.data.patient_uid;

    // Upload biopsy if exists
    if (file) {
      const fileForm = new FormData();
      fileForm.append("file", file);
      await api.post(`/patients/${pid}/upload_biopsy`, fileForm);
    }

    nav(`/patient/${pid}`);
  } catch (e) {
    console.log(e?.response?.data);
    alert(e?.response?.data?.error || "Submission failed");
  }
};


  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Biopsy Image Box */}
      <div className="card p-4 flex flex-col">
        <div className="mb-3 font-semibold">Biopsy Image</div>

        <div
          className="border-2 border-dashed border-gray-400 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 h-72"
          onClick={() => !file && fileInputRef.current.click()}
        >
          {!file ? (
            <>
              <div className="text-4xl font-bold text-purple-500 mb-2">+</div>
              <div>Click to select an image</div>
            </>
          ) : (
            <>
              <div
                className="text-xl font-semibold text-grey-100 underline cursor-pointer"
                onClick={() => setShowPreview(true)}
              >
                {file.name}
              </div>
              <div className="text-xs mt-2">or</div>
              <button
                className="btn-primary mt-1 px-4 py-1 text-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current.click()
                }}
              >
                Browse
              </button>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setShowPreview(false)}
          >
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-[80%] max-w-[80%] rounded shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="text-xs text-muted mt-2">JPEG/PNG only</div>

        {/* Diagnose Button */}
        <button
          className="btn-primary mt-4 w-full"
          onClick={handleDiagnosis}
        >
          Diagnose
        </button>

        {/* Diagnosis Result Field */}
        <div className="mt-3">
          <label className="label mb-1">Patient Has Cancer</label>
          <input
            className="input bg-gray-100"
            value={status}
            readOnly
          />
        </div>
      </div>

      {/* Patient Form */}
      <div className="card p-4 flex flex-col justify-between">
        <form onSubmit={(e) => e.preventDefault()} className="grid gap-3">
          <div>
            <div className="label mb-1">Name *</div>
            <input
              className="input"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label mb-1">Age *</div>
              <input
                type="number"
                className="input"
                value={f.age}
                onChange={(e) => setF({ ...f, age: e.target.value })}
              />
            </div>
            <div>
              <div className="label mb-1">Phone *</div>
              <input
                className="input"
                value={f.phone}
                onChange={(e) => setF({ ...f, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <div className="label mb-1">Email *</div>
            <input
              className="input"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </div>
          <div>
            <div className="label mb-1">Doctor Review *</div>
            <textarea
              className="input"
              rows="3"
              value={f.doctor_review}
              onChange={(e) => setF({ ...f, doctor_review: e.target.value })}
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label mb-1">Previous Doctor Name</div>
              <input
                className="input"
                value={f.prev_doctor_name}
                onChange={(e) => setF({ ...f, prev_doctor_name: e.target.value })}
              />
            </div>
            <div>
              <div className="label mb-1">Previous Doctor History</div>
              <input
                className="input"
                value={f.prev_doctor_history}
                onChange={(e) => setF({ ...f, prev_doctor_history: e.target.value })}
              />
            </div>
          </div>
          <div>
            <div className="label mb-1">Previous Medicine History *</div>
            <textarea
              className="input"
              rows="2"
              value={f.prev_medicine_history}
              onChange={(e) => setF({ ...f, prev_medicine_history: e.target.value })}
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            className="btn-primary mt-4 w-full"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
