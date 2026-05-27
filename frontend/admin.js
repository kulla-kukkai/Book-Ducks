// admin.js — BookDucks Admin Panel

// ── Guard: admin only ──
if (!isLoggedIn() || !isAdmin()) {
    window.location.replace("home.html")
}

// ── Show admin name ──
document.addEventListener("DOMContentLoaded", () => {
    const user = getUser()
    if (user) {
        document.getElementById("admin-name").textContent = user.username
    }
})


// ── Page switching ──
function showPage(name, btn) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"))
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"))
    document.getElementById(`page-${name}`).classList.add("active")
    if (btn) btn.classList.add("active")
    if (name === "books") loadBooks()
}

// ALL BOOKS

async function loadBooks() {
    const el = document.getElementById("books-list")
    el.innerHTML = `<div class="empty-state"><div class="emoji">🔄</div><p>Loading...</p></div>`

    try {
        const res = await apiGet("/books?populate=cover&sort=createdAt:desc&pagination[limit]=100")
        const books = res.data || []

        if (!books.length) {
            el.innerHTML = `<div class="empty-state"><div class="emoji">📭</div><p>No books yet</p></div>`
            return
        }

        el.innerHTML = books.map(book => renderBookRow(book)).join("")

    } catch (err) {
        console.error("Load books error:", err)
        el.innerHTML = `<div class="empty-state"><div class="emoji">❌</div><p>Error loading books</p></div>`
    }
}

function renderBookRow(book) {
    const coverUrl = getStrapiMediaUrl(book.cover?.url)
    const year = book.publishedDate ? book.publishedDate.slice(0, 4) : "—"

    return `
        <div class="book-row">
            <div class="book-thumb">
                ${coverUrl ? `<img src="${coverUrl}" alt="${book.title}" />` : `📖`}
            </div>
            <div class="book-info-cell">
                <div class="title">${book.title}</div>
            </div>
            <div class="cell">${book.author || "—"}</div>
            <div class="cell">${book.pages || "—"}</div>
            <div class="cell">${year}</div>
            <div class="actions">
                <button class="btn-edit" onclick="openEdit('${book.documentId}', '${book.title}', '${book.author || ""}', '${book.pages || ""}', '${book.publishedDate || ""}')">Edit</button>
                <button class="btn-delete" onclick="deleteBook('${book.documentId}', this)">Delete</button>
            </div>
        </div>
    `
}

// UPLOAD BOOK
async function uploadBook() {
    const title  = document.getElementById("book-title").value.trim()
    const author = document.getElementById("book-author").value.trim()
    const pages  = document.getElementById("book-pages").value
    const date   = document.getElementById("book-date").value
    const cover  = document.getElementById("book-cover").files[0]
    const btn    = document.getElementById("upload-btn")

    if (!title || !author) {
        showMsg("upload-msg", "Title and Author are required!", "error")
        return
    }

    btn.disabled = true
    btn.textContent = "Uploading..."

    try {
        let coverId = null

        if (cover) {
            const formData = new FormData()
            formData.append("files", cover)
            const uploadRes = await axios.post(
                `http://localhost:1337/api/upload`,
                formData,
                { headers: { "Authorization": `Bearer ${getToken()}` } }
            )
            coverId = uploadRes.data[0].id
        }

        await apiPost("/books", {
            data: {
                title,
                author,
                pages:         pages ? Number(pages) : null,
                publishedDate: date  ? date           : null,
                cover:         coverId ? coverId       : null,
            }
        })

        showMsg("upload-msg", "✓ Book uploaded successfully!", "success")
        clearUploadForm()

    } catch (err) {
        console.error(err)
        showMsg("upload-msg", err.message || "Upload failed!", "error")
    } finally {
        btn.disabled = false
        btn.textContent = "Upload Book"
    }
}

function clearUploadForm() {
    document.getElementById("book-title").value  = ""
    document.getElementById("book-author").value = ""
    document.getElementById("book-pages").value  = ""
    document.getElementById("book-date").value   = ""
    document.getElementById("book-cover").value  = ""
}

// EDIT BOOK

function openEdit(docId, title, author, pages, date) {
    document.getElementById("edit-doc-id").value  = docId
    document.getElementById("edit-title").value   = title
    document.getElementById("edit-author").value  = author
    document.getElementById("edit-pages").value   = pages
    document.getElementById("edit-date").value    = date
    document.getElementById("edit-msg").className = "upload-msg"
    document.getElementById("edit-modal").classList.add("open")
}

function closeModal() {
    document.getElementById("edit-modal").classList.remove("open")
}

async function saveEdit() {
    const docId  = document.getElementById("edit-doc-id").value
    const title  = document.getElementById("edit-title").value.trim()
    const author = document.getElementById("edit-author").value.trim()
    const pages  = document.getElementById("edit-pages").value
    const date   = document.getElementById("edit-date").value

    if (!title || !author) {
        showMsg("edit-msg", "Title and Author are required!", "error")
        return
    }

    try {
        await apiPut(`/books/${docId}`, {
            data: {
                title,
                author,
                pages:         pages ? Number(pages) : null,
                publishedDate: date  ? date           : null,
            }
        })

        showMsg("edit-msg", "✓ Saved!", "success")
        setTimeout(() => { closeModal(); loadBooks() }, 800)

    } catch (err) {
        showMsg("edit-msg", err.message || "Save failed!", "error")
    }
}

// DELETE BOOK

async function deleteBook(docId, btn) {
    if (!confirm("Delete this book? This cannot be undone.")) return

    btn.disabled = true
    btn.textContent = "..."

    try {
        await apiDelete(`/books/${docId}`)
        loadBooks()
    } catch (err) {
        console.error(err)
        btn.disabled = false
        btn.textContent = "Delete"
        alert("Delete failed: " + err.message)
    }
}

// HELPERS

function showMsg(id, text, type) {
    const el = document.getElementById(id)
    el.textContent = text
    el.className = `upload-msg ${type}`
}

document.getElementById("edit-modal").addEventListener("click", function(e) {
    if (e.target === this) closeModal()
})

// ── Init ──
loadTheme()
loadBooks()