import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './styles.css'
import App from './App'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import AddPatient from './pages/AddPatient'
import PatientMonitoring from './pages/PatientMonitoring'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <Navigate to="/home" /> },
        { path: 'home', element: <Home /> },
        { path: 'add', element: <AddPatient /> },
        { path: 'monitor/:patientId', element: <PatientMonitoring /> },
      ],
    },
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    { path: '*', element: <Navigate to="/home" /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true, // ✅ Enables v7 behavior now
    },
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
)
