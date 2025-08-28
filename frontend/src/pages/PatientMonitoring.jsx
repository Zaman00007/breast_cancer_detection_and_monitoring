import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const PatientMonitoring = () => {
  const { patientId: paramId } = useParams();
  const [patientId, setPatientId] = useState(paramId || '');
  const [image, setImage] = useState(null);
  const [latestBiopsy, setLatestBiopsy] = useState(null);
  const [latestMammo, setLatestMammo] = useState(null);
  const [results, setResults] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg','image/jpg','image/png','image/bmp','image/tiff','image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a valid image.');
        setImage(null);
        return;
      }
      setError(null);
      setImage(file);
    }
  };

  const fetchAnnotatedImages = async () => {
    if (!patientId) return;
    try {
      const [biopsyRes, mammoRes] = await Promise.all([
        axios.get(`http://localhost:8000/latest-biopsy-image/${patientId}`),
        axios.get(`http://localhost:8000/latest-image/${patientId}?type=mammography`)
      ]);
      setLatestBiopsy(biopsyRes.data?.imageUrl || null);
      setLatestMammo(mammoRes.data?.imageUrl || null);
    } catch (err) {
      console.error(err);
      setLatestBiopsy(null);
      setLatestMammo(null);
    }
  };

  const fetchAnalysis = async () => {
    if (!patientId) return;
    try {
      const res = await axios.get(`http://localhost:8000/patient-analysis/${patientId}`);
      setAnalysis(res.data);
    } catch (err) {
      console.error(err);
      setAnalysis(null);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchAnnotatedImages();
      fetchAnalysis();
    }
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
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setResults(response.data);
      fetchAnnotatedImages();
      fetchAnalysis();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred while processing the image.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 p-6 font-sans bg-gray-50 min-h-screen">
      {/* Left Panel */}
      <div className="card p-4 flex flex-col space-y-6">
        <div>
          <div className="mb-3 font-semibold">Upload Mammography Image</div>
          <label
            htmlFor="fileInput"
            className="border-2 border-dashed border-gray-400 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 h-72"
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

        {latestBiopsy ? (
          <div>
            <div className="mb-3 font-semibold">Latest Annotated Biopsy</div>
            <img
              src={latestBiopsy} // Direct S3 URL
              alt="Biopsy"
              className="max-h-72 w-full object-contain rounded-lg border"
            />
          </div>
        ) : (
          <div className="text-gray-500 italic">No biopsy image available</div>
        )}

        {latestMammo ? (
          <div>
            <div className="mb-3 font-semibold">Latest Annotated Mammography</div>
            <img
              src={latestMammo} // Direct S3 URL
              alt="Mammography"
              className="max-h-72 w-full object-contain rounded-lg border"
            />
          </div>
        ) : (
          <div className="text-gray-500 italic">No mammography image available</div>
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

      {/* Right Panel */}
      <div className="card p-4 flex flex-col justify-between">
        <input
          name="patientId"
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="input mb-4"
        />

        {results && (
          <div>
            <span className="font-semibold">Has Cancer:</span>{' '}
            {results.is_cancerous ? 'Yes' : 'No'}
          </div>
        )}

        {analysis && (
          <>
            <div>
              <span className="font-semibold">Change in Area:</span>{' '}
              {analysis.change_in_area_percent?.toFixed(2) || 'N/A'} %
            </div>
            <div>
              <span className="font-semibold">IoU:</span>{' '}
              {analysis.iou ? analysis.iou.toFixed(3) : 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Aspect Ratio:</span>{' '}
              Prev: {analysis.aspect_ratios?.previous?.toFixed(3) || 'N/A'} | Last:{' '}
              {analysis.aspect_ratios?.last?.toFixed(3) || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Diameter:</span>{' '}
              Prev: {analysis.diameters?.previous?.toFixed(2) || 'N/A'} px | Last:{' '}
              {analysis.diameters?.last?.toFixed(2) || 'N/A'} px
            </div>
            <div>
              <span className="font-semibold">Centroid Shift:</span>{' '}
              {analysis.centroid_shift?.toFixed(2) || 'N/A'} px
            </div>
            {analysis.centroids && (
              <div>
                <span className="font-semibold">Centroids:</span>{' '}
                Prev: ({analysis.centroids.previous[0].toFixed(1)}, {analysis.centroids.previous[1].toFixed(1)}) | Last:{' '}
                ({analysis.centroids.last[0].toFixed(1)}, {analysis.centroids.last[1].toFixed(1)})
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Last Scan: {analysis.last_timestamp} <br />
              Previous Scan: {analysis.prev_timestamp}
            </div>
          </>
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
