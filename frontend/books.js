// books.js — หน้า All Books

let allBooks = []      // เก็บหนังสือทั้งหมด
let currentSort = 'title'  // sort ปัจจุบัน

// อัปเดต navbar
function updateNav() {
  const user = getUser()
  if (user) {
    document.getElementById("nav-username").textContent = `Hi, ${user.username}!`
    document.getElementById("nav-profile").style.display = "inline"
    document.getElementById("nav-logout").style.display = "inline"
    document.getElementById("nav-login").style.display = "none"
  }
}

// ดึงหนังสือทั้งหมด
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

// render การ์ดหนังสือ
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

    const ratingHtml = averageRating
      ? `<p class="book-rating">★ ${Number(averageRating).toFixed(1)}</p>`
      : `<p class="book-rating muted">Not rated yet</p>`

    return `
      <div class="book-card">
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
            <button class="btn-icon" onclick="saveBook(${book.id}, this)">+ Att läsa</button>
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

// search + sort รวมกัน
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

// save Att läsa
async function saveBook(bookId, btn) {
  if (!isLoggedIn()) {
    alert("Please login first!")
    window.location.href = "login.html"
    return
  }

  try {
    btn.textContent = "Saving..."
    btn.disabled = true

    const user = getUser()
    const res = await apiGet(
      `/reading-lists?filters[users_permissions_user][id][$eq]=${user.id}&populate=books`
    )
    const lists = res.data

    if (lists && lists.length > 0) {
      const listId = lists[0].id
      const existingBooks = lists[0].books?.map(b => b.id) || []

      if (existingBooks.includes(bookId)) {
        btn.textContent = "✓ Saved"
        btn.classList.add("saved")
        return
      }

      await apiPut(`/reading-lists/${listId}`, {
        data: { books: [...existingBooks, bookId] }
      })
    } else {
      await apiPost("/reading-lists", {
        data: {
          books: [bookId],
          users_permissions_user: user.id
        }
      })
    }

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
updateNav()
loadBooks()