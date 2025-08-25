// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import './styles.css'
// import App from './App'
// import Login from './pages/Login'
// import Register from './pages/Register'
// import Home from './pages/Home'
// import AddPatient from './pages/AddPatient'
// import PatientDetail from './pages/PatientDetail'

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <BrowserRouter>
//     <Routes>
//       <Route path="/" element={<App />}>
//         <Route index element={<Navigate to="/home" />} />
//         <Route path="home" element={<Home />} />
//         <Route path="add" element={<AddPatient />} />
//         <Route path="patient/:id" element={<PatientDetail />} />
//       </Route>
//       <Route path="/login" element={<Login />} />
//       <Route path="/register" element={<Register />} />
//       <Route path="*" element={<Navigate to="/home" />} />
//     </Routes>
//   </BrowserRouter>
// )



import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './styles.css'
import App from './App'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import AddPatient from './pages/AddPatient'
import PatientDetail from './pages/PatientDetail'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <Navigate to="/home" /> },
        { path: 'home', element: <Home /> },
        { path: 'add', element: <AddPatient /> },
        { path: 'patient/:id', element: <PatientDetail /> },
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
