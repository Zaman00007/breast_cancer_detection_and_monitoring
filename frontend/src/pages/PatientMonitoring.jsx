import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PatientMonitoring = () => {
  const [patientId, setPatientId] = useState('');
  const [image, setImage] = useState(null);
  const [prevImage, setPrevImage] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/bmp',
        'image/tiff',
        'image/gif'
      ];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a valid image.');
        setImage(null);
        return;
      }
      setError(null);
      setImage(file);
    }
  };

  const fetchPreviousImage = async () => {
    if (!patientId) return;
    try {
      const response = await axios.get(
        `http://localhost:8000/latest-image/${patientId}`
      );
      if (response.data?.imageUrl) {
        setPrevImage(response.data.imageUrl);
      } else {
        setPrevImage(null);
      }
    } catch (err) {
      console.error(err);
      setPrevImage(null);
    }
  };

  useEffect(() => {
    if (patientId) fetchPreviousImage();
  }, [patientId]);

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
        'http://localhost:8000/predict-mammography',
        formPayload,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setResults(response.data); // { is_cancerous, iou, change_in_area, etc. }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          'An error occurred while processing the image.'
      );
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 p-6 font-sans bg-gray-50 min-h-screen">
      {/* Left Panel */}
      <div className="card p-4 flex flex-col space-y-6">
        {/* Upload Section */}
        <div>
          <div className="mb-3 font-semibold">Upload Mammography Image</div>
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
        </div>

        {/* Previous Image Section */}
        {prevImage && (
          <div>
            <div className="mb-3 font-semibold">Previous Mammography Image</div>
            <img
              src={prevImage}
              alt="Previous"
              className="max-h-72 max-w-full object-contain rounded-lg border"
            />
          </div>
        )}

        <button
          className="btn-primary mt-4 w-full"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Analyze Mammography'}
        </button>
        {error && (
          <p className="text-red-600 text-center mt-4 bg-red-50 p-2 rounded-lg border border-red-200">
            {error}
          </p>
        )}
      </div>

      {/* Right Panel - Results */}
      <div className="card p-4 flex flex-col justify-between">
        <input
          name="patientId"
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="input mb-4"
        />

        {results && (
          <div className="space-y-3">
            <div>
              <span className="font-semibold">Has Cancer:</span>{' '}
              {results.is_cancerous ? 'Yes' : 'No'}
            </div>
            {results.iou !== undefined && (
              <div>
                <span className="font-semibold">IoU:</span> {results.iou}
              </div>
            )}
            {results.change_in_area !== undefined && (
              <div>
                <span className="font-semibold">Change in Area:</span>{' '}
                {results.change_in_area}%
              </div>
            )}
          </div>
        )}

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
