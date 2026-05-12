

let readingListData = []  // saved books (Att läsa)
let ratedBooksData = []   // saved ratings (Betyg)

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

        // tagline random
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

// reading list
async function loadReadingList() {
  const container = document.getElementById("reading-list")

  try {
    const res = await apiGet(`/users/me?populate[savedBooks][populate]=cover`)
    const books = res.savedBooks || []

    if (!books.length) {
      container.innerHTML = `<p class="empty-msg">No books saved yet — go find some! 🦆</p>`
      return
    }

    readingListData = books
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

    const user = getUser()

    await axios.put(
      `http://localhost:1337/api/users/${user.id}`,
      { savedBooks: { disconnect: [{ id: bookId }] } },
      { headers: { "Authorization": `Bearer ${getToken()}` } }
    )

    readingListData = readingListData.filter(b => b.id !== bookId)
    renderReadingList(readingListData)

  } catch (err) {
    console.error("Remove error:", err)
    btn.textContent = "Error"
    btn.disabled = false
  }
}


// ── Sort Att läsa ──
function sortList(type, btn) {
  document.querySelectorAll(".sort-controls .sort-btn")
    .forEach(b => b.classList.remove("active"))
  btn.classList.add("active")

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

    // filter + map for rated books 
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

// ── Sort Rated ──
function sortRated(type, btn) {
  btn.closest(".sort-controls")
    .querySelectorAll(".sort-btn")
    .forEach(b => b.classList.remove("active"))
  btn.classList.add("active")

  const sorted = [...ratedBooksData].sort((a, b) => {
    if (type === "title")  return (a.title || "").localeCompare(b.title || "")
    if (type === "author") return (a.author || "").localeCompare(b.author || "")
    if (type === "rating") return b.myScore - a.myScore
    return 0
  })
  renderRatedBooks(sorted)
}

// starting page
loadTheme()
init()
document.querySelector('a[href="profile.html"]')?.classList.add("nav-active")