// books.js — หน้า All Books

let allBooks = []      // collect all books for easy search + sort
let currentSort = 'title'  // sort name: title, author, pages

function updateNav() {
  const user = getUser()
  if (user) {
    const navUsername = document.getElementById("nav-username")
    if (navUsername) navUsername.textContent = `Hi, ${user.username}`
    document.getElementById("nav-logout").style.display = "inline"
    document.getElementById("nav-login").style.display = "none"

    if (isAdmin()) {
      document.getElementById("nav-profile").style.display = "none"
      document.getElementById("nav-admin").style.display = "inline"
    } else {
      document.getElementById("nav-profile").style.display = "inline"
    }
  }
}

// pull books from backend and render
async function loadBooks() {
  try {
    const res = await apiGet("/books?populate=cover&pagination[limit]=100")
    allBooks = res.data

    document.getElementById("book-count").textContent =
      `${allBooks.length} books in the library`

    renderBooks(allBooks)

  } catch (err) {
    console.error("Error:", err)
    document.getElementById("books-grid").innerHTML =
      `<p style="color:red">Cannot connect to Strapi — make sure it's running!</p>`
  }
}

// render books as cards in grid
function renderBooks(books) {
  const grid = document.getElementById("books-grid")
  const empty = document.getElementById("empty-state")

  if (!books || books.length === 0) {
    grid.innerHTML = ""
    empty.style.display = "block"
    return
  }

  empty.style.display = "none"

  grid.innerHTML = books.map(book => {
    const { title, author, pages, publishedDate, cover, averageRating } = book

    const coverUrl = cover?.url
      ? `http://localhost:1337${cover.url}`
      : null

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
        : `<div class="book-cover no-cover">📖</div>`
      }
      <div class="book-info">
        <h3 class="book-title">${title}</h3>
        <p class="book-author">${author}</p>
        ${ratingHtml}
        <p class="book-meta">${pages ? pages + ' pages' : ''} ${publishedDate ? '· ' + publishedDate.slice(0,4) : ''}</p>
        <div class="book-actions">
            <button class="btn-icon" 
                ${isAdmin() ? 'disabled style="opacity:0.4;cursor:not-allowed"' : `onclick="event.stopPropagation(); saveBook('${book.documentId}', this)"`}>
                + save
            </button>
        </div>
      </div>
    </div>
  `
  }).join("")
}

// sort
function setSort(type, btn) {
  currentSort = type
  document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active"))
  btn.classList.add("active")
  applyFilters()
}

// search + sort together
function applyFilters() {
  const query = document.getElementById("search-input").value.toLowerCase().trim()

  let filtered = allBooks.filter(book => {
    const title = book.title?.toLowerCase() || ""
    const author = book.author?.toLowerCase() || ""
    return title.includes(query) || author.includes(query)
  })

  // sort
  filtered.sort((a, b) => {
    if (currentSort === 'title')
      return (a.title || "").localeCompare(b.title || "")
    if (currentSort === 'author')
      return (a.author || "").localeCompare(b.author || "")
    if (currentSort === 'pages')
      return (a.pages || 0) - (b.pages || 0)
    return 0
  })

  renderBooks(filtered)
}

// save book
async function saveBook(bookDocumentId, btn) {
  console.log("saveBook called!", bookDocumentId) 
  if (!isLoggedIn()) {
    alert("Please login first!")
    window.location.href = "login.html"
    return
  }

  try {
    btn.textContent = "Saving..."
    btn.disabled = true

    const user = getUser()

    // ดึง book เพื่อเอา numeric id
    const bookRes = await apiGet(`/books/${bookDocumentId}?populate=savedByUsers`)
    const book = bookRes.data
    const alreadySaved = book.savedByUsers?.some(u => u.id === user.id)

    if (alreadySaved) {
      btn.textContent = "✓ Saved"
      btn.classList.add("saved")
      return
    }

    // update ผ่าน users endpoint
    const result = await axios.put(
    `http://localhost:1337/api/users/${user.id}`,
    { savedBooks: { connect: [{ id: book.id }] } },
    { headers: { "Authorization": `Bearer ${getToken()}` } }
    )

    btn.textContent = "✓ Saved"
    btn.classList.add("saved")

  } catch (err) {
    console.error("Save error:", err)
    btn.textContent = "Error"
    btn.disabled = false
  }
}

// search listener
document.getElementById("search-input").addEventListener("input", applyFilters)

// เริ่มทำงาน
loadTheme()
updateNav()
loadBooks()
document.querySelector('a[href="books.html"]')?.classList.add("nav-active")