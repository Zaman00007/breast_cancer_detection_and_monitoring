import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddPatient = () => {
  const [formData, setFormData] = useState({
    patientId: '',
    name: '',
    age: '',
    weight: '',
    height: '',
  });
  const [image, setImage] = useState(null);
  const [isCancerous, setIsCancerous] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a valid image.');
        setImage(null);
        return;
      }
      setError(null);
      setImage(file);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      setError('Please upload a biopsy image.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formPayload = new FormData();
      formPayload.append('file', image);
      formPayload.append('patientId', formData.patientId);
      formPayload.append('name', formData.name);
      formPayload.append('age', formData.age);
      formPayload.append('weight', formData.weight);
      formPayload.append('height', formData.height);
      const response = await axios.post(
        'http://localhost:8000/predict',
        formPayload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setIsCancerous(response.data.is_cancerous ? 'Yes' : 'No');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while processing the image.');
      setIsCancerous('');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!formData.patientId || !formData.name) {
      setError('Patient ID and Name are required to proceed.');
      return;
    }
    navigate(`/monitor/${formData.patientId}`, { state: { name: formData.name } });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 p-6 font-sans bg-gray-50 min-h-screen">
      <div className="card p-4 flex flex-col">
        <div className="mb-3 font-semibold">Biopsy Image</div>
        <label
          className="border-2 border-dashed border-gray-400 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 h-72"
          htmlFor="fileInput"
        >
          {!image ? (
            <>
              <div className="text-4xl font-bold text-purple-500 mb-2">+</div>
              <div>Click to select an image</div>
            </>
          ) : (
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          )}
        </label>
        <input type="file" id="fileInput" accept="image/*" className="hidden" onChange={handleImageChange} />
        <div className="text-xs text-gray-500 mt-2">JPEG/PNG only</div>
        <button className="btn-primary mt-4 w-full" onClick={handleSubmit}>
          {loading ? 'Processing...' : 'Detect Cancer'}
        </button>
        <div className="mt-3">
          <label className="label mb-1">Patient Has Cancer</label>
          <input className="input bg-gray-100" value={isCancerous} readOnly />
        </div>
      </div>

      <div className="card p-4 flex flex-col justify-between">
        <form onSubmit={(e) => e.preventDefault()} className="grid gap-3">
          <input name="patientId" placeholder="Patient ID" value={formData.patientId} onChange={handleChange} className="input" />
          <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="input" />
          <div className="grid grid-cols-2 gap-3">
            <input name="age" type="number" placeholder="Age" value={formData.age} onChange={handleChange} className="input" />
            <input name="weight" type="number" placeholder="Weight (kg)" value={formData.weight} onChange={handleChange} className="input" />
          </div>
          <input name="height" type="number" placeholder="Height (cm)" value={formData.height} onChange={handleChange} className="input" />
          <button className="btn-primary mt-4 w-full" onClick={handleSubmit}>
            {loading ? 'Processing...' : 'Submit'}
          </button>

          <button
            className="btn-primary mt-4 w-full bg-green-500 hover:bg-green-600 text-white"
            onClick={handleProceed}
          >
            Proceed to Monitoring
          </button>

          {error && <p className="text-red-600 text-center mt-4 bg-red-50 p-2 rounded-lg border border-red-200">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
