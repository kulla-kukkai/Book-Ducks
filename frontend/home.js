function updateNav() {
    const user = getUser()
    const navUsername = document.getElementById("nav-username")
    const navProfile  = document.getElementById("nav-profile")
    const navLogout   = document.getElementById("nav-logout")
    const navLogin    = document.getElementById("nav-login")
    const navAdmin    = document.getElementById("nav-admin")

    if (isLoggedIn() && user) {
        navUsername.textContent = `Hi, ${user.username} `
        if (navLogout) navLogout.style.display = "inline-block"
        if (navLogin)  navLogin.style.display  = "none"

        if (isAdmin()) {
            if (navAdmin)   navAdmin.style.display   = "inline-block"
            if (navProfile) navProfile.style.display = "none"
            // แสดง admin panel section
            const adminPanel = document.getElementById("admin-panel")
            if (adminPanel) adminPanel.style.display = "block"
        } else {
            if (navProfile) navProfile.style.display = "inline-block"
        }
    }
}
    
// ── Logout ──
const logoutBtn = document.getElementById("nav-logout")
if (logoutBtn) logoutBtn.addEventListener("click", (e) => {
    e.preventDefault()
    logout()
})

// ── โหลดหนังสือ ──
async function loadBooks() {
    try {
        // sort createdAt desc, limit 10 — เล่มใหม่สุด
        const res = await apiGet("/books?populate=cover&sort=createdAt:desc&pagination[limit]=10")
        const books = res.data || []
    
        const countEl = document.getElementById("book-count")
        if (countEl) countEl.textContent = `${books.length} books`
    
        const grid = document.getElementById("books-grid")
        if (!books.length) {
        grid.innerHTML = `<p style="color:var(--color-text-muted)">No books yet — add some in Strapi!</p>`
        return
        }
    
        grid.innerHTML = books.map(book => renderCard(book)).join("")
        setTimeout(initCarousel, 100)
    } catch (err) {
        console.error("Load error:", err)
        document.getElementById("books-grid").innerHTML =
        `<p style="color:crimson">Cannot connect to Strapi — make sure it's running on localhost:1337</p>`
    }
}
 
// ── Render การ์ดหนังสือ ──
function renderCard(book) {
    const title    = book.title    || "Untitled"
    const author   = book.author   || ""
    const pages    = book.pages    || ""
    const published = book.publishedDate ? book.publishedDate.slice(0, 4) : ""
    const coverUrl = book.cover?.url ? `http://localhost:1337${book.cover.url}` : null

    // คำนวณ avg จาก ratings array เหมือน books.js
    const ratings = book.ratings || []
    const avg = ratings.length
        ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
        : null

    const ratingHtml = avg
        ? `<p class="book-rating">★ ${avg.toFixed(1)}</p>`
        : `<p class="book-rating" style="color:var(--color-text-muted);font-size:11px">Not rated yet</p>`

    return `
        <div class="book-card" onclick="location.href='book-detail.html?id=${book.documentId}'" style="cursor:pointer">
            ${coverUrl
                ? `<img class="book-cover" src="${coverUrl}" alt="${title}" />`
                : `<div class="book-cover book-cover-placeholder">📖</div>`}
            <div class="book-info">
                <h3 class="book-title">${title}</h3>
                <p class="book-author">${author}</p>
                ${ratingHtml}
                <p class="book-meta">${pages ? pages + " pages" : ""}${published ? " · " + published : ""}</p>
            </div>
        </div>
    `
}

// ── Star renderer (0–5) ──
function renderStars(rating, max = 5) {
    let html = ""
    for (let i = 1; i <= max; i++) {
        if (rating >= i)          html += `<span class="star star-full">★</span>`
        else if (rating >= i - 0.5) html += `<span class="star star-half">½</span>`
        else                        html += `<span class="star star-empty">☆</span>`
    }
    return html
}

loadTheme()
updateNav()
loadBooks()

// CAROUSEL
function initCarousel() {
    const track = document.getElementById("books-grid")
    const btnPrev = document.getElementById("btn-prev")
    const btnNext = document.getElementById("btn-next")
    const dotsWrap = document.getElementById("carousel-dots")

    const cardWidth = 180 + 20 // card + gap
    const visibleCards = Math.floor(track.clientWidth / cardWidth)
    const totalCards = track.children.length
    const steps = Math.ceil(totalCards / visibleCards)

  // สร้าง dots
    dotsWrap.innerHTML = Array.from({ length: steps }, (_, i) =>
        `<button class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="goToStep(${i})"></button>`
    ).join("")

  // ปุ่มเลื่อน
    btnNext.onclick = () => {
        track.scrollBy({ left: cardWidth * visibleCards, behavior: "smooth" })
    }
    btnPrev.onclick = () => {
        track.scrollBy({ left: -cardWidth * visibleCards, behavior: "smooth" })
    }

  // อัปเดต dots ตาม scroll
    track.addEventListener("scroll", () => {
        const step = Math.round(track.scrollLeft / (cardWidth * visibleCards))
        document.querySelectorAll(".carousel-dot").forEach((d, i) => {
        d.classList.toggle("active", i === step)
        })
        btnPrev.disabled = track.scrollLeft < 10
        btnNext.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10
    })

  // drag to scroll
    let isDown = false, startX, scrollLeft
    track.addEventListener("mousedown", e => {
        isDown = true
        track.classList.add("dragging")
        startX = e.pageX - track.offsetLeft
        scrollLeft = track.scrollLeft
    })
    track.addEventListener("mouseleave", () => { isDown = false; track.classList.remove("dragging") })
    track.addEventListener("mouseup", () => { isDown = false; track.classList.remove("dragging") })
    track.addEventListener("mousemove", e => {
        if (!isDown) return
        e.preventDefault()
        const x = e.pageX - track.offsetLeft
        track.scrollLeft = scrollLeft - (x - startX) * 1.5
    })

    btnPrev.disabled = true
}

window.goToStep = (i) => {
    const track = document.getElementById("books-grid")
    const cardWidth = 180 + 20
    const visibleCards = Math.floor(track.clientWidth / cardWidth)
    track.scrollTo({ left: i * cardWidth * visibleCards, behavior: "smooth" })
}