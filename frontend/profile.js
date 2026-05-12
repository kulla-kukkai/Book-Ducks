// profile.js — หน้า Profile

let readingListData = []  // เก็บ Att läsa
let ratedBooksData = []   // เก็บ Rated books (VG)

// ── Init ──
async function init() {
  if (!isLoggedIn()) {
    window.location.href = "login.html"
    return
  }
  updateNav()
  await loadProfile()
  await loadReadingList()
  await loadRatedBooks()
}

// ── Navbar ──
function updateNav() {
    const user = getUser()
    const navUsername = document.getElementById("nav-username")
    const navProfile  = document.getElementById("nav-profile")
    const navLogout   = document.getElementById("nav-logout")
    const navLogin    = document.getElementById("nav-login")
    if (isLoggedIn() && user) {
        navUsername.textContent = `Hi, ${user.username}`
        if (navProfile) navProfile.style.display = "inline-block"
        if (navLogout)  navLogout.style.display  = "inline-block"
        if (navLogin)   navLogin.style.display   = "none"
    }
}

// ── Profile Header ──
async function loadProfile() {
    try {
        const user = await apiGet("/users/me")
        document.getElementById("profile-name").textContent = user.username
        document.getElementById("profile-email").textContent = user.email

        // tagline สุ่ม
        const taglines = [
            "Ready to quack into your next book?",
            "What the duck are you reading today?",
            "Keep calm and read on, little duck!",
            "Another day, another chapter! ",
            "Your reading adventure continues...",
            "Books are waiting, let's dive in! ",
            "A duck who reads is a duck who leads!"
        ]
        const random = taglines[Math.floor(Math.random() * taglines.length)]
        document.getElementById("profile-tagline").textContent = random

        localStorage.setItem("user", JSON.stringify(user))
    } catch (err) {
        console.error("Profile error:", err)
    }
}

// ── Att läsa ──
async function loadReadingList() {
  const container = document.getElementById("reading-list")

  try {
    // ไม่ต้องส่ง filter — Strapi return แค่ของ user ที่ login อยู่เองค่ะ
    const res = await apiGet(`/reading-lists?populate[books][populate]=cover`)
    const lists = res.data

    if (!lists || lists.length === 0 || !lists[0].books?.length) {
      container.innerHTML = `<p class="empty-msg">No books saved yet — go find some! 🦆</p>`
      return
    }

    readingListData = lists[0].books
    readingListId = lists[0].documentId  // Strapi v5 ใช้ documentId
    renderReadingList(readingListData)

  } catch (err) {
    console.error("Reading list error:", err)
    container.innerHTML = `<p class="empty-msg">Error loading list</p>`
  }
}

let readingListId = null

// ── Render Att läsa ──
function renderReadingList(books) {
  const container = document.getElementById("reading-list")

  if (!books || books.length === 0) {
    container.innerHTML = `<p class="empty-msg">No books saved yet — go find some! 🦆</p>`
    return
  }

  container.innerHTML = books.map(book => {
    const coverUrl = book.cover?.url
      ? `http://localhost:1337${book.cover.url}`
      : null

    return `
      <div class="book-card">
        ${coverUrl
          ? `<img class="book-cover" src="${coverUrl}" alt="${book.title}" />`
          : `<div class="book-cover book-cover-placeholder">📖</div>`
        }
        <div class="book-info">
          <h3 class="book-title">${book.title}</h3>
          <p class="book-author">${book.author}</p>
          <p class="book-meta">${book.pages ? book.pages + ' pages' : ''}</p>
          <div class="book-actions">
            <button class="btn-icon btn-remove" onclick="removeBook(${book.id}, this)">
              🗑 Remove
            </button>
          </div>
        </div>
      </div>
    `
  }).join("")
}

// ── Remove book from Att läsa ──
async function removeBook(bookId, btn) {
  try {
    btn.textContent = "Removing..."
    btn.disabled = true

    const updatedBooks = readingListData
      .filter(b => b.id !== bookId)
      .map(b => b.id)

    await apiPut(`/reading-lists/${readingListId}`, {
      data: { books: updatedBooks }
    })

    // อัปเดต local data
    readingListData = readingListData.filter(b => b.id !== bookId)
    renderReadingList(readingListData)

  } catch (err) {
    console.error("Remove error:", err)
    btn.textContent = "Error"
    btn.disabled = false
  }
}

// ── Sort Att läsa ──
function sortList(type) {
  document.querySelectorAll("#reading-list ~ * .sort-btn, .sort-controls .sort-btn")
    .forEach(b => b.classList.remove("active"))
  event.target.classList.add("active")

  const sorted = [...readingListData].sort((a, b) => {
    if (type === "title")  return (a.title || "").localeCompare(b.title || "")
    if (type === "author") return (a.author || "").localeCompare(b.author || "")
    return 0
  })
  renderReadingList(sorted)
}

// ── Rated Books ──
async function loadRatedBooks() {
  const container = document.getElementById("rated-list")

  try {
    const res = await apiGet("/books?populate=cover&pagination[limit]=100")
    const allBooks = res.data || []
    const user = getUser()

    // กรองเฉพาะหนังสือที่ user นี้เคย rate
    ratedBooksData = allBooks
      .filter(book => {
        const ratings = book.ratings || []
        return ratings.some(r => r.userId === user.id)
      })
      .map(book => {
        const ratings = book.ratings || []
        const myRating = ratings.find(r => r.userId === user.id)
        return { ...book, myScore: myRating?.score || 0 }
      })

    renderRatedBooks(ratedBooksData)

  } catch (err) {
    console.error("Rated books error:", err)
    container.innerHTML = `<p class="empty-msg">Error loading rated books</p>`
  }
}

// ── Render Rated Books ──
function renderRatedBooks(books) {
  const container = document.getElementById("rated-list")

  if (!books || books.length === 0) {
    container.innerHTML = `<p class="empty-msg">No rated books yet — go rate some! ⭐</p>`
    return
  }

  container.innerHTML = books.map(book => {
    const coverUrl = book.cover?.url
      ? `http://localhost:1337${book.cover.url}`
      : null

    const stars = "★".repeat(book.myScore) + "☆".repeat(5 - book.myScore)

    return `
      <div class="book-card" onclick="location.href='book-detail.html?id=${book.documentId}'" style="cursor:pointer">
        ${coverUrl
          ? `<img class="book-cover" src="${coverUrl}" alt="${book.title}" />`
          : `<div class="book-cover book-cover-placeholder">📖</div>`
        }
        <div class="book-info">
          <h3 class="book-title">${book.title}</h3>
          <p class="book-author">${book.author}</p>
          <p class="book-rating" style="color:#f59e0b">${stars} ${book.myScore}/5</p>
          <p class="book-meta">${book.pages ? book.pages + ' pages' : ''}</p>
        </div>
      </div>
    `
  }).join("")
}

// ── Sort Rated (VG — placeholder) ──
// ── Sort Rated ──
function sortRated(type) {
  event.target.closest(".sort-controls")
    .querySelectorAll(".sort-btn")
    .forEach(b => b.classList.remove("active"))
  event.target.classList.add("active")

  const sorted = [...ratedBooksData].sort((a, b) => {
    if (type === "title")  return (a.title || "").localeCompare(b.title || "")
    if (type === "author") return (a.author || "").localeCompare(b.author || "")
    if (type === "rating") return b.myScore - a.myScore
    return 0
  })
  renderRatedBooks(sorted)
}

// เริ่มทำงาน
loadTheme()
init()
document.querySelector('a[href="profile.html"]')?.classList.add("nav-active")