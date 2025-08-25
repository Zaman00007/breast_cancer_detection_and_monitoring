import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true // only if needed for cookies
})

export default api


// import axios from 'axios'

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
//   withCredentials: false // set to true only if using cookies
// })

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token')
//   if (token) config.headers.Authorization = `Bearer ${token}`
//   return config
// }, (error) => {
//   return Promise.reject(error)
// })

// export default api
