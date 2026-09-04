function getBaseUrl() {
    if (window.location.hostname === "localhost") {
        return "http://localhost:1337/api";
    }
    return "https://book-ducks-backend.onrender.com/api";
}

function getStrapiMediaUrl(url) {
    if (!url) return null
    // ถ้า URL เป็น full URL อยู่แล้ว ไม่ต้องต่ออะไร
    if (url.startsWith("http")) return url
    const strapiBase = window.location.hostname === "localhost"
        ? "http://localhost:1337"
        : "https://book-ducks-backend.onrender.com"
    return `${strapiBase}${url}`
}

const BASE_URL = getBaseUrl();

// ── Token helpers ──
const getToken   = () => localStorage.getItem("token")
const getUser    = () => JSON.parse(localStorage.getItem("user") || "null")
const isLoggedIn = () => !!getToken() && getToken() !== "null"
const isAdmin    = () => getUser()?.isAdmin === true

// ── GET ──
const apiGet = async (path) => {
    try {
        const token = getToken()
        const headers = token ? { "Authorization": `Bearer ${token}` } : {}
        
        let response = await axios.get(`${BASE_URL}${path}`, { headers })
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
    // ล้าง username ใน navbar ก่อน redirect
    const navUsername = document.getElementById("nav-username")
    if (navUsername) navUsername.textContent = ""
    window.location.replace("home.html")
}

// load theme on page load
const loadTheme = async () => {
    try {
        const res = await axios.get(`${BASE_URL}/site-setting?populate[0]=hero_default&populate[1]=hero_christmas&populate[2]=hero_halloween&populate[3]=banner_default&populate[4]=banner_christmas&populate[5]=banner_halloween`
        )
        const data = res.data.data
        const theme = data.theme || "default"

        // change body class
        const current = document.body.className
        const hasAuthPage = current.includes("auth-page")
        document.body.className = hasAuthPage ? `${theme} auth-page` : theme

        // choose img theme
        const heroImg   = data[`hero_${theme}`]   || data.hero_default
        const bannerImg = data[`banner_${theme}`] || data.banner_default

        const heroUrl = getStrapiMediaUrl(heroImg?.url)
        const bannerUrl = getStrapiMediaUrl(bannerImg?.url)

        // change hero background via CSS
        if (heroUrl) {
            const heroEl = document.querySelector(".hero")
            if (heroEl) heroEl.style.backgroundImage = `url('${heroUrl}')`
        }

        // change duck banner image
        if (bannerUrl) {
            const bannerEl = document.querySelector(".duck-banner img")
            if (bannerEl) bannerEl.src = bannerUrl
        }

    } catch (err) {
        console.error("Theme load error:", err)
    }
}