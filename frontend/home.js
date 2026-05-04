// home.js — โหลดหนังสือและ navbar

// อัปเดต navbar ตาม login state
function updateNav() {
  const user = getUser()
  if (user) {
    document.getElementById("nav-username").textContent = `Hi, ${user.username}!`
    document.getElementById("nav-profile").style.display = "inline"
    document.getElementById("nav-logout").style.display = "inline"
    document.getElementById("nav-login").style.display = "none"

    // VG: แสดง admin panel ถ้าเป็น admin
    if (isAdmin()) {
      document.getElementById("admin-panel").style.display = "block"
    }
  }
}

// ดึงหนังสือทั้งหมดจาก Strapi
async function loadBooks() {
  try {
    const res = await apiGet("/books?populate=cover")
    const books = res.data

    const grid = document.getElementById("books-grid")
    const countEl = document.getElementById("book-count")

    if (!books || books.length === 0) {
      grid.innerHTML = "<p>No books found — add some in Strapi Admin!</p>"
      return
    }

    countEl.textContent = `${books.length} books`

    grid.innerHTML = books.map(book => {
      const { title, author, pages, publishedDate, cover, averageRating } = book

      // สร้าง URL รูปปก
      const coverUrl = cover?.url
        ? `http://localhost:1337${cover.url}`
        : null

      // แสดง rating ถ้ามี
      const ratingHtml = averageRating
        ? `<p class="book-rating">★ ${averageRating.toFixed(1)}</p>`
        : ""

      return `
        <div class="book-card">
          ${coverUrl
            ? `<img class="book-cover" src="${coverUrl}" alt="${title}" />`
            : `<div class="book-cover" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">📖</div>`
          }
          <div class="book-info">
            <h3 class="book-title">${title}</h3>
            <p class="book-author">${author}</p>
            ${ratingHtml}
            <p class="book-meta">${pages ? pages + " pages" : ""}</p>
            <div class="book-actions">
              <button class="btn-icon" onclick="saveBook(${book.id}, this)">
                + Att läsa
              </button>
            </div>
          </div>
        </div>
      `
    }).join("")

  } catch (err) {
    console.error("Error:", err)
    document.getElementById("books-grid").innerHTML = `
      <p style="color:red">
        Cannot connect to Strapi — make sure it's running on localhost:1337
      </p>
    `
  }
}

// บันทึกหนังสือใน Att läsa
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

    // ดึง reading list ของ user ก่อน
    const res = await apiGet(`/reading-lists?filters[users_permissions_user][id][$eq]=${user.id}&populate=books`)
    const lists = res.data

    if (lists && lists.length > 0) {
      // มี reading list อยู่แล้ว — เพิ่มหนังสือเข้าไป
      const listId = lists[0].id
      const existingBooks = lists[0].attributes.books?.data || []
      const bookIds = existingBooks.map(b => b.id)

      if (bookIds.includes(bookId)) {
        btn.textContent = "✓ Saved"
        btn.classList.add("saved")
        return
      }

      await apiPut(`/reading-lists/${listId}`, {
        data: { books: [...bookIds, bookId] }
      })
    } else {
      // ยังไม่มี reading list — สร้างใหม่
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

// เริ่มทำงาน
updateNav()
loadBooks()