const BASE_URL = "http://localhost:1337/api"

// ── Token helpers ──
const getToken   = () => localStorage.getItem("token")
const getUser    = () => JSON.parse(localStorage.getItem("user") || "null")
const isLoggedIn = () => !!getToken() && getToken() !== "null"
const isAdmin    = () => getUser()?.isAdmin === true

// ── GET ──
const apiGet = async (path) => {
    try {
        let response = await axios.get(`${BASE_URL}${path}`, {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        })
        return response.data
    } catch (err) {
        console.log(err)
        throw new Error(err.response?.data?.error?.message || err.message)
    }
}

// ── POST ──
const apiPost = async (path, body) => {
    try {
        let response = await axios.post(`${BASE_URL}${path}`, body, {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        })
        return response.data
    } catch (err) {
        console.log(err)
        throw new Error(err.response?.data?.error?.message || err.message)
    }
}

// ── PUT ──
const apiPut = async (path, body) => {
    try {
        let response = await axios.put(`${BASE_URL}${path}`, body, {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        })
        return response.data
    } catch (err) {
        console.log(err)
        throw new Error(err.response?.data?.error?.message || err.message)
    }
}

// ── DELETE ──
const apiDelete = async (path) => {
    try {
        let response = await axios.delete(`${BASE_URL}${path}`, {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        })
        return response.data
    } catch (err) {
        console.log(err)
        throw new Error(err.response?.data?.error?.message || err.message)
    }
}

// ── Logout ──
const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "home.html"
}