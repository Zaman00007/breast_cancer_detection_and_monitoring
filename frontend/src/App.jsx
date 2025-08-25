import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AddPatient from './pages/AddPatient';
import PatientMonitoring from './pages/PatientMonitoring';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddPatient />} />
          <Route path="/monitor/:patientId" element={<PatientMonitoring />} />
        </Routes>
      </div>
    </div>
  );
}
