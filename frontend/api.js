const BASE_URL = "http://localhost:1337/api"

const getToken = () => localStorage.getItem("token")
const getUser  = () => JSON.parse(localStorage.getItem("user") || "null")
const isLoggedIn = () => {
  const token = getToken()
  return !!token && token !== "undefined" && token !== "null"
}
const isAdmin  = () => getUser()?.isAdmin === true

const getHeaders = () => {
  const headers = { "Content-Type": "application/json" }
  const token = getToken()
  if (token && token !== "undefined") headers["Authorization"] = `Bearer ${token}`
  return headers
}

// ── fetch wrapper ที่ throw ถ้า response ไม่ ok ──
const apiFetch = async (path, options = {}) => {
  const res  = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: getHeaders(),
  })
  const data = await res.json()
  if (!res.ok) {
    // ดึง message จาก Strapi error format
    const msg = data?.error?.message || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data
}

const apiGet    = (path)        => apiFetch(path)
const apiPost   = (path, body)  => apiFetch(path, { method: "POST",   body: JSON.stringify(body) })
const apiPut    = (path, body)  => apiFetch(path, { method: "PUT",    body: JSON.stringify(body) })
const apiDelete = (path)        => apiFetch(path, { method: "DELETE" })

const logout = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "home.html"
}