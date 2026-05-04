const BASE_URL = "http://localhost:1337/api"

// to get token from localStorage
const getToken = () => localStorage.getItem("token")

// to get user from localStorage
const getUser = () => JSON.parse(localStorage.getItem("user") || "null")

// to check if user is logged in
const isLoggedIn = () => !!getToken()

// to check if user is admin
const isAdmin = () => getUser()?.isAdmin === true

// to create headers for request
const getHeaders = () => {
    const headers = { "Content-Type": "application/json" }
    const token = getToken()
    if (token) headers["Authorization"] = `Bearer ${token}`
    return headers
}

// GET request
const apiGet = async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: getHeaders()
    })
    return res.json()
}

// POST request
const apiPost = async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    return res.json()
}

// PUT request
const apiPut = async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    return res.json()
}

// DELETE request
const apiDelete = async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "DELETE",
        headers: getHeaders()
    })
    return res.json()
}

// logout
const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "home.html"
}