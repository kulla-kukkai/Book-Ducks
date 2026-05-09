// ============================================================
// auth.js — Login & Register สำหรับ BookDucks
// ============================================================

// ── redirect ถ้า login อยู่แล้ว ──
if (isLoggedIn()) {
  location.href = "home.html"
}

loadTheme()

function showError(msg, isSuccess = false) {
  const el = document.getElementById("auth-error")
  if (!el) return
  el.textContent   = msg
  el.style.display = msg ? "block" : "none"
  el.style.color   = isSuccess ? "var(--color-accent)" : "crimson"
}

// ============================================================
// TAB SWITCHING
// ============================================================
function switchTab(tab) {
  const loginForm    = document.getElementById("form-login")
  const registerForm = document.getElementById("form-register")
  const loginTab     = document.getElementById("tab-login")
  const registerTab  = document.getElementById("tab-register")

  showError("")

  if (tab === "login") {
    loginForm.style.display    = "block"
    registerForm.style.display = "none"
    loginTab.classList.add("active")
    registerTab.classList.remove("active")
  } else {
    loginForm.style.display    = "none"
    registerForm.style.display = "block"
    loginTab.classList.remove("active")
    registerTab.classList.add("active")
  }
}

// ============================================================
// TOGGLE PASSWORD
// ============================================================
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId)
  if (!input) return
  const isHidden  = input.type === "password"
  input.type      = isHidden ? "text" : "password"
  btn.textContent = isHidden ? "🙈" : "👁️"
}

// ============================================================
// PASSWORD RULES
// ============================================================
function checkPasswordRules(password) {
  const rules = [
    { id: "rule-length", pass: password.length >= 8 },
    { id: "rule-upper",  pass: /[A-Z]/.test(password) },
    { id: "rule-number", pass: /[0-9]/.test(password) },
  ]
  rules.forEach(({ id, pass }) => {
    const el = document.getElementById(id)
    if (!el) return
    el.classList.toggle("rule-pass", pass)
    el.classList.toggle("rule-fail", !pass)
  })
  return rules.every(r => r.pass)
}

// ============================================================
// LOGIN
// ============================================================
async function handleLogin() {
  const email    = document.getElementById("login-email").value.trim()
  const password = document.getElementById("login-password").value
  const btn      = document.getElementById("login-btn")

  showError("")

  if (!email || !password) {
    showError("Please fill in all fields.")
    return
  }

  btn.disabled    = true
  btn.textContent = "Logging in..."

  try {
    // Step 1: login → ได้ jwt
    const res = await axios.post(`http://localhost:1337/api/auth/local`, {
    identifier: email,
    password:   password,
    })
    const { jwt, user } = res.data 

    // Step 2: เก็บ token ก่อน
    localStorage.setItem("token", jwt)

    // Step 3: ดึง /users/me เพื่อให้ได้ username + isAdmin
    const me = await apiGet("/users/me")

    // Guard: ถ้า me ไม่มี id แปลว่าได้ error object มา
    if (!me?.id) throw new Error("Could not load user profile")

    localStorage.setItem("user", JSON.stringify(me))
    location.href = "home.html"

  } catch (err) {
    // ล้าง token ที่อาจเก็บไปแล้วถ้า /users/me fail
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    showError(err.message || "Invalid email or password.")
    btn.disabled    = false
    btn.textContent = "Login"
  }
}

// ============================================================
// REGISTER
// ============================================================
async function handleRegister() {
  const username = document.getElementById("reg-username").value.trim()
  const email    = document.getElementById("reg-email").value.trim()
  const password = document.getElementById("reg-password").value
  const btn      = document.getElementById("register-btn")

  showError("")

  if (!username || !email || !password) {
    showError("Please fill in all fields.")
    return
  }
  if (!email.includes("@")) {
    showError("Please enter a valid email.")
    return
  }
  if (!checkPasswordRules(password)) {
    showError("Password doesn't meet all requirements.")
    return
  }

  btn.disabled    = true
  btn.textContent = "Creating account..."

  try {
    await axios.post(`http://localhost:1337/api/auth/local/register`, { username, email, password })
    switchTab("login")
    showError("✓ Account created! Please log in.", true)
  } catch (err) {
    showError(err.message || "Registration failed. Try a different email.")
    btn.disabled    = false
    btn.textContent = "Create Account"
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("toggle-login-pw")
    ?.addEventListener("click", function() { togglePassword("login-password", this) })
  document.getElementById("toggle-reg-pw")
    ?.addEventListener("click", function() { togglePassword("reg-password", this) })
  document.getElementById("reg-password")
    ?.addEventListener("input", e => checkPasswordRules(e.target.value))

  switchTab(location.hash === "#register" ? "register" : "login")
})