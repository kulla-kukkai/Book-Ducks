// ============================================================
// auth.js — Login & Register สำหรับ BookDucks
// ใช้ Strapi v5 ผ่าน api.js
// ============================================================

// ── redirect ถ้า login อยู่แล้ว ──
if (isLoggedIn()) {
  location.href = "home.html"
}

// ── helper แสดง/ซ่อน error ──
function showError(msg, isSuccess = false) {
  const el = document.getElementById("auth-error")
  if (!el) return
  el.textContent   = msg
  el.style.display = msg ? "block" : "none"
  el.style.color   = isSuccess ? "var(--accent)" : "crimson"
}

// ============================================================
// TOGGLE PASSWORD SHOW/HIDE
// ============================================================
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId)
  if (!input) return
  const isHidden = input.type === "password"
  input.type  = isHidden ? "text" : "password"
  btn.textContent = isHidden ? "HIDE" : "SHOW"
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
// PASSWORD VALIDATION RULES (register)
// เช็ค real-time ขณะพิมพ์
// ============================================================
function checkPasswordRules(password) {
  const rules = [
    {
      id:    "rule-length",
      label: "At least 8 characters",
      pass:  password.length >= 8,
    },
    {
      id:    "rule-upper",
      label: "At least one capital letter",
      pass:  /[A-Z]/.test(password),
    },
    {
      id:    "rule-number",
      label: "At least one number",
      pass:  /[0-9]/.test(password),
    },
  ]

  rules.forEach(({ id, pass }) => {
    const el = document.getElementById(id)
    if (!el) return
    el.classList.toggle("rule-pass", pass)
    el.classList.toggle("rule-fail", !pass)
  })

  // return true ถ้าผ่านหมดทุกข้อ
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
    const res = await apiPost("/auth/local", {
      identifier: email,
      password:   password,
    })

    localStorage.setItem("token", res.jwt)
    localStorage.setItem("user", JSON.stringify(res.user))

    // ดึง /users/me เพื่อให้ได้ isAdmin field
    const me = await apiGet("/users/me")
    localStorage.setItem("user", JSON.stringify(me))

    location.href = "home.html"

  } catch (err) {
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

  // เช็ค password rules ทั้งหมด
  const rulesOk = checkPasswordRules(password)
  if (!rulesOk) {
    showError("Password doesn't meet all requirements.")
    return
  }

  btn.disabled    = true
  btn.textContent = "Creating account..."

  try {
    await apiPost("/auth/local/register", {
      username: username,
      email:    email,
      password: password,
    })

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
  // toggle password buttons
  const toggleLogin = document.getElementById("toggle-login-pw")
  if (toggleLogin) {
    toggleLogin.addEventListener("click", () => togglePassword("login-password", toggleLogin))
  }

  const toggleReg = document.getElementById("toggle-reg-pw")
  if (toggleReg) {
    toggleReg.addEventListener("click", () => togglePassword("reg-password", toggleReg))
  }

  // real-time password validation
  const regPwInput = document.getElementById("reg-password")
  if (regPwInput) {
    regPwInput.addEventListener("input", () => checkPasswordRules(regPwInput.value))
  }

  // เปิด tab ตาม URL hash
  if (location.hash === "#register") {
    switchTab("register")
  } else {
    switchTab("login")
  }
})