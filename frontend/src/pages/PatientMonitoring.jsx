import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PatientMonitoring = () => {
  const [patientId, setPatientId] = useState('');
  const [image, setImage] = useState(null);
  const [isCancerous, setIsCancerous] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    if (!patientId) {
      setError('Please enter Patient ID.');
      return;
    }
    if (!image) {
      setError('Please upload a mammography image.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formPayload = new FormData();
      formPayload.append('file', image);
      formPayload.append('patientId', patientId);

      const response = await axios.post(
        'http://localhost:8000/predict-mammography', // your ML API endpoint
        formPayload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setIsCancerous(response.data.is_cancerous ? 'Yes' : 'No');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred while processing the image.');
      setIsCancerous('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 p-6 font-sans bg-gray-50 min-h-screen">
      <div className="card p-4 flex flex-col">
        <div className="mb-3 font-semibold">Mammography Image</div>

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

        <input
          type="file"
          id="fileInput"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        <div className="text-xs text-gray-500 mt-2">JPEG/PNG only</div>

        <button className="btn-primary mt-4 w-full" onClick={handleSubmit}>
          {loading ? 'Processing...' : 'Analyze Mammography'}
        </button>

        <div className="mt-3">
          <label className="label mb-1">Patient Has Cancer</label>
          <input className="input bg-gray-100" value={isCancerous} readOnly />
        </div>

        {error && <p className="text-red-600 text-center mt-4 bg-red-50 p-2 rounded-lg border border-red-200">{error}</p>}
      </div>

      <div className="card p-4 flex flex-col justify-between">
        <input
          name="patientId"
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="input mb-4"
        />

        <button
          className="btn-secondary w-full mt-4"
          onClick={() => navigate('/patients')}
        >
          Back to Patients List
        </button>
      </div>
    </div>
  );
};

export default PatientMonitoring;
