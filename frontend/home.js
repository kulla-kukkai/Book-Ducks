// ── Navbar แสดง username / ปุ่ม login ──
function updateNav() {
  const user = getUser()
  const navUsername = document.getElementById("nav-username")
  const navProfile  = document.getElementById("nav-profile")
  const navLogout   = document.getElementById("nav-logout")
  const navLogin    = document.getElementById("nav-login")
 
  if (isLoggedIn() && user) {
    navUsername.textContent = `Hi, ${user.username} 🦆`
    if (navProfile) navProfile.style.display  = "inline-block"
    if (navLogout)  navLogout.style.display   = "inline-block"
    if (navLogin)   navLogin.style.display    = "none"
  }
  if (isAdmin()) {
    const adminPanel = document.getElementById("admin-panel")
    if (adminPanel) adminPanel.style.display = "block"
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
  } catch (err) {
    console.error("Load error:", err)
    document.getElementById("books-grid").innerHTML =
      `<p style="color:crimson">Cannot connect to Strapi — make sure it's running on localhost:1337</p>`
  }
}
 
// ── Render การ์ดหนังสือ ──
function renderCard(book) {
  const title     = book.title    || "Untitled"
  const author    = book.author   || ""
  const pages     = book.pages    || ""
  const coverUrl  = book.cover?.url ? `http://localhost:1337${book.cover.url}` : null
  const avgRating = book.avgRating || null
 
  const starsHtml = avgRating
    ? `<p class="book-rating">${renderStars(avgRating)} <span style="font-size:11px;color:var(--color-text-muted)">${avgRating.toFixed(1)}</span></p>`
    : ""
 
  return `
    <div class="book-card" onclick="location.href='book-detail.html?id=${book.documentId}'" style="cursor:pointer">
      ${coverUrl
        ? `<img class="book-cover" src="${coverUrl}" alt="${title}" />`
        : `<div class="book-cover book-cover-placeholder">📖</div>`}
      <div class="book-info">
        <h3 class="book-title">${title}</h3>
        <p class="book-author">${author}</p>
        ${starsHtml}
        <p class="book-meta">${pages ? pages + " pages" : ""}</p>
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
 
updateNav()
loadBooks()