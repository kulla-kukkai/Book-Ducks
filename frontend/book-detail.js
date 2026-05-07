// ============================================================
// book-detail.js — BookDucks Book Detail Page
// โหลดหนังสือ + avg rating + save to read + user rating
// ============================================================

const bookId = new URLSearchParams(location.search).get("id")
if (!bookId) location.href = "home.html"

// ── Navbar ──
function updateNav() {
    const user = getUser()
    const navUsername = document.getElementById("nav-username")
    const navProfile  = document.getElementById("nav-profile")
    const navLogout   = document.getElementById("nav-logout")
    const navLogin    = document.getElementById("nav-login")
    if (isLoggedIn() && user) {
        navUsername.textContent = `Hi, ${user.username} 🦆`
        if (navProfile) navProfile.style.display = "inline-block"
        if (navLogout)  navLogout.style.display  = "inline-block"
        if (navLogin)   navLogin.style.display   = "none"
    }
}

const logoutBtn = document.getElementById("nav-logout")
if (logoutBtn) logoutBtn.addEventListener("click", e => { e.preventDefault(); logout() })

// ── Stars renderer (read-only) ──
function starsHtml(rating, max = 5) {
    let h = ""
    for (let i = 1; i <= max; i++) {
        if (rating >= i)            h += `<span class="star-full">★</span>`
        else if (rating >= i - 0.5) h += `<span class="star-half">★</span>`
        else                         h += `<span class="star-empty">☆</span>`
    }
    return h
}

// ── Check if book is already saved ──
async function isSaved(bookId) {
    if (!isLoggedIn()) return false
    try {
        const user = getUser()
        const res  = await apiGet(`/reading-lists?filters[users_permissions_user][id][$eq]=${user.id}&populate=books`)
        const list = res.data?.[0]
        if (!list) return false
        return (list.books || []).some(b => b.id == bookId)
    } catch { return false }
}

// ── Save / unsave book ──
async function handleSave(bookId, btn) {
    if (!isLoggedIn()) { location.href = "login.html"; return }

    btn.disabled = true
    btn.textContent = "Saving..."

    try {
        const user = getUser()
        const res  = await apiGet(`/reading-lists?filters[users_permissions_user][id][$eq]=${user.id}&populate=books`)
        const list = res.data?.[0]

        if (list) {
        const existingIds = (list.books || []).map(b => b.id)
        if (existingIds.includes(Number(bookId))) {
            btn.textContent = "✓ Saved to reading list"
            btn.classList.add("saved-state")
            btn.disabled = false
            return
        }
        await apiPut(`/reading-lists/${list.id}`, {
            data: { books: [...existingIds, Number(bookId)] }
        })
        } else {
        await apiPost("/reading-lists", {
            data: { books: [Number(bookId)], users_permissions_user: user.id }
        })
        }

        btn.textContent = "✓ Saved to reading list"
        btn.classList.add("saved-state")
        btn.disabled = false

    } catch (err) {
        console.error(err)
        btn.textContent = "Error — try again"
        btn.disabled = false
    }
}

// ── Submit rating ──
// Note: ต้องมี field "ratings" (JSON array) หรือ relation ใน Strapi
// วิธีง่าย: เก็บเป็น JSON field ratings: [{userId, score}] ใน Book
// แล้วคำนวณ avgRating ฝั่ง frontend จาก array นั้น
// ถ้ายังไม่มี field → จะ fail silently แล้วแสดง coming soon message
async function submitRating(bookId, score, book) {
    const ratingBox = document.getElementById("rating-box")
    ratingBox.innerHTML = `<p class="rating-box-label">YOUR RATING</p><p style="color:var(--color-text-muted);font-size:14px">Saving...</p>`

    try {
        // ดึง ratings เดิม (ถ้ามี field ratings ใน Strapi)
        let ratings = book.ratings || []
        const user  = getUser()

        // อัปเดต score ของ user นี้ (ถ้ามีอยู่แล้ว replace, ถ้ายังไม่มี push)
        const existing = ratings.findIndex(r => r.userId === user.id)
        if (existing >= 0) ratings[existing].score = score
        else               ratings.push({ userId: user.id, score })

        await apiPut(`/books/${bookId}`, { data: { ratings } })

        // คำนวณ avg ใหม่
        const avg = ratings.reduce((s, r) => s + r.score, 0) / ratings.length

        ratingBox.innerHTML = `
        <p class="rating-box-label">YOUR RATING</p>
        <div class="stars-display">${starsHtml(score)}</div>
        <p class="rating-hint">${score} / 5 · saved! avg now ${avg.toFixed(1)}</p>
        `
    } catch (err) {
        ratingBox.innerHTML = `
        <p class="rating-box-label">YOUR RATING</p>
        <p class="rating-login-prompt">Could not save rating — make sure the <em>ratings</em> JSON field exists in Strapi Book collection.</p>
        `
    }
}

// ── Render interactive stars for rating ──
function renderRatingBox(bookId, book, currentScore = 0) {
    let hovered = currentScore

    const starsMarkup = [1,2,3,4,5].map(i => `
        <button class="star-btn ${i <= currentScore ? "active" : ""}"
                data-score="${i}"
                aria-label="${i} star">★</button>
    `).join("")

    const hint = currentScore
        ? `${currentScore} / 5 · click to change`
        : `click to rate`

    return `
        <div class="rating-box" id="rating-box">
        <p class="rating-box-label">YOUR RATING</p>
        <div class="stars-interactive" id="star-row">${starsMarkup}</div>
        <p class="rating-hint" id="rating-hint">${hint}</p>
        </div>
    `
}

// ── Main loader ──
async function loadDetail() {
    try {
        const res  = await apiGet(`/books/${bookId}?populate=cover`)
        const book = res.data

        if (!book) throw new Error("Book not found")

        const title      = book.title       || "Untitled"
        const author     = book.author      || "Unknown"
        const pages      = book.pages       || null
        const published  = book.publishedYear || null
        const genre      = book.genre       || null
        const description= book.description || ""
        const coverUrl   = book.cover?.url  ? `http://localhost:1337${book.cover.url}` : null

        // avg rating จาก ratings array
        const ratings    = book.ratings || []
        const avgRating  = ratings.length
        ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
        : null

        // เช็คว่า user นี้เคยให้คะแนนไว้ไหม
        const user      = getUser()
        const myRating  = user ? (ratings.find(r => r.userId === user.id)?.score || 0) : 0

        // เช็ค saved state
        const saved = await isSaved(bookId)

        // ── Build HTML ──
        const coverHtml = coverUrl
        ? `<img class="detail-cover" src="${coverUrl}" alt="${title}" />`
        : `<div class="detail-cover-placeholder">📖</div>`

        const savedBtnText = saved ? "✓ Saved to reading list" : "🔖 Save to reading list"
        const savedBtnClass = saved ? "btn-primary btn-full saved-state" : "btn-primary btn-full"

        const actionsHtml = isLoggedIn()
        ? `<button class="${savedBtnClass}" id="save-btn" ${saved ? "disabled" : ""}>${savedBtnText}</button>`
        : `<a href="login.html" class="btn-ghost btn-full" style="text-align:center;display:block">Login to save</a>`

        const avgHtml = avgRating !== null
        ? `<div class="stars-display">${starsHtml(avgRating)}</div> <span style="font-weight:700">${avgRating.toFixed(1)}</span>`
        : `<span style="color:var(--color-text-muted);font-size:14px">No ratings yet</span>`

        const ratingSection = isLoggedIn()
        ? renderRatingBox(bookId, book, myRating)
        : `<div class="rating-box"><p class="rating-box-label">RATING</p><p class="rating-login-prompt"><a href="login.html">Login</a> to rate this book</p></div>`

        document.getElementById("detail-content").innerHTML = `
        <!-- LEFT -->
        <div>
            ${coverHtml}
            <div class="detail-actions">
            ${actionsHtml}
            </div>
        </div>

        <!-- RIGHT -->
        <div>
            ${genre ? `<p class="detail-genre">${genre}</p>` : ""}
            <h1 class="detail-title">${title}</h1>
            <p class="detail-author">by <span>${author}</span></p>

            <div class="detail-stats">
            ${pages      ? `<div class="stat-item"><span class="stat-label">Pages</span><span class="stat-value">${pages}</span></div>` : ""}
            ${published  ? `<div class="stat-item"><span class="stat-label">Published</span><span class="stat-value">${published}</span></div>` : ""}
            <div class="stat-item">
                <span class="stat-label">Avg. Rating</span>
                <span class="stat-value" style="display:flex;align-items:center;gap:0.4rem">${avgHtml}</span>
            </div>
            ${ratings.length ? `<div class="stat-item"><span class="stat-label">Ratings</span><span class="stat-value">${ratings.length.toLocaleString()}</span></div>` : ""}
            </div>

            <div class="squiggle">〰〰〰</div>

            ${description ? `<p class="detail-description">${description}</p>` : ""}

            ${ratingSection}
        </div>
        `

        // ── Wire up save button ──
        const saveBtn = document.getElementById("save-btn")
        if (saveBtn && !saved) {
        saveBtn.addEventListener("click", () => handleSave(bookId, saveBtn))
        }

        // ── Wire up interactive stars ──
        if (isLoggedIn()) {
        const starRow = document.getElementById("star-row")
        const hint    = document.getElementById("rating-hint")
        if (starRow) {
            const btns = starRow.querySelectorAll(".star-btn")

            btns.forEach(btn => {
            const score = Number(btn.dataset.score)

            btn.addEventListener("mouseenter", () => {
                btns.forEach(b => b.classList.toggle("active", Number(b.dataset.score) <= score))
                hint.textContent = `${score} / 5`
            })
            btn.addEventListener("mouseleave", () => {
                btns.forEach(b => b.classList.toggle("active", Number(b.dataset.score) <= myRating))
                hint.textContent = myRating ? `${myRating} / 5 · click to change` : "click to rate"
            })
            btn.addEventListener("click", () => submitRating(bookId, score, book))
            })
        }
        }

        // ── Show content, hide skeleton ──
        document.getElementById("detail-skeleton").style.display = "none"
        document.getElementById("detail-content").style.display  = "grid"
        document.title = `${title} — BookDucks`

    } catch (err) {
        console.error(err)
        document.getElementById("detail-skeleton").innerHTML =
        `<p style="color:crimson;padding:2rem">Book not found — <a href="home.html">go back</a></p>`
    }
}

updateNav()
loadDetail()