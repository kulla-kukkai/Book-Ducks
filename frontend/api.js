const BASE_URL = "http://localhost:1337/api"

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
    window.location.replace("home.html")  // ← กลับ home แทน login
}

// load theme on page load
const loadTheme = async () => {
    try {
        const res = await axios.get(`${BASE_URL}/site-setting?populate[0]=hero_default&populate[1]=hero_christmas&populate[2]=hero_halloween&populate[3]=banner_default&populate[4]=banner_christmas&populate[5]=banner_halloween`
        )
        const data = res.data.data
        const theme = data.theme || "default"

        // เปลี่ยน body class
        const current = document.body.className
        const hasAuthPage = current.includes("auth-page")
        document.body.className = hasAuthPage ? `${theme} auth-page` : theme

        // เลือกรูปตาม theme
        const heroImg   = data[`hero_${theme}`]   || data.hero_default
        const bannerImg = data[`banner_${theme}`] || data.banner_default

        const heroUrl   = heroImg?.url   ? `http://localhost:1337${heroImg.url}`   : null
        const bannerUrl = bannerImg?.url ? `http://localhost:1337${bannerImg.url}` : null

        // เปลี่ยน hero background ผ่าน CSS
        if (heroUrl) {
            const heroEl = document.querySelector(".hero")
            if (heroEl) heroEl.style.backgroundImage = `url('${heroUrl}')`
        }

        // เปลี่ยนรูป duck banner
        if (bannerUrl) {
            const bannerEl = document.querySelector(".duck-banner img")
            if (bannerEl) bannerEl.src = bannerUrl
        }

    } catch (err) {
        console.error("Theme load error:", err)
    }
}