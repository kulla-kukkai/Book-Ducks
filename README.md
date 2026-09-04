# 🦆 BookDucks

A full-stack web application for a bookstore where users can browse books, save their reading list, and rate books. Built with Vanilla JavaScript and Strapi v5. Admins can add, edit, and delete books directly from the website.
 
Final project for the **Interaction with CMS** course at Nackademin.

---

## ✨ Features
 
### Guest
- Browse all books in the library
- Search and sort books
- View book details
### User (logged in)
- Register and login
- Save books to reading list
- Rate books (1-5 stars)
- View personal profile and reading list
### Admin
- Access to admin panel via the website
- Add, edit, and delete books
- Upload book cover images
- Upload new books directly from the frontend
- Manage all content via CMS admin panel
- Theme is controlled from Strapi — admin can switch between **default**, **christmas**, and **halloween** themes

---

## 🛠️ Tech Stack
 
| Part | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend / CMS | Strapi v5 |
| Database | PostgreSQL (Neon) |
| Frontend Hosting | Netlify |
| Backend Hosting | Render |
| Version Control | GitHub |
 
---
 
## 🚀 How to Run Locally
 
### Backend
```bash
cd backend
npm install
npm run develop
```
Strapi runs at: http://localhost:1337
 
### Frontend
Open `frontend/home.html` in a browser or use VS Code Live Server.
---

## 📁 Project Structure

```
frontend/
├── home.html / home.js / home.css
├── books.html / books.js / books.css
├── book-detail.html / book-detail.js / book-detail.css
├── profile.html / profile.js / profile.css
├── admin.html / admin.js / admin.css
├── login.html / auth.js / login.css
├── api.js
├── style.css
├── themes.css
└── logo.png

backend/ (Strapi v5)
├── src/
├── config/
├── database/
└── .tmp/data.db
```

---

## 🗄 Strapi Data Structure

### Collection Types

**Book**
- `title` — Text
- `author` — Text
- `pages` — Number
- `publishedDate` — Date
- `cover` — Media (image)
- `ratings` — JSON (`[{ userId, score }]`)
- `savedByUsers` — Many-to-Many → User

**User** *(extended from Strapi built-in)*
- `isAdmin` — Boolean
- `savedBooks` — Many-to-Many → Book

### Single Type

**SiteSetting**
- `theme` — Enumeration (`default` / `christmas` / `halloween`)
- `hero_default`, `hero_christmas`, `hero_halloween` — Media
- `banner_default`, `banner_christmas`, `banner_halloween` — Media

---

## 🔐 Strapi Permissions Setup

### Public Role
| Collection | Permissions |
|---|---|
| Book | find, findOne |
| Site-setting | find |
| Auth | register, callback, refresh |

### Authenticated Role
| Collection | Permissions |
|---|---|
| Book | find, findOne, create, update, delete |
| Site-setting | find |
| User | me, update, find, findOne |
| Upload | upload, find, findOne |

---

## 🎨 Themes

Themes are managed entirely from Strapi's admin panel under **SiteSetting**. Changing the theme updates the site's colors and hero/banner images automatically on page refresh. Regular users cannot change the theme — only the Super Admin.

---

## 📝 Design Decisions

- **Ratings as JSON field** — Chosen for simplicity in a smaller project. The average rating is calculated on the frontend. For a larger application, a separate `Rating` collection with one-to-many relations would be more scalable.
- **Theme via Single Type** — All theme-related images are stored in named fields (`hero_christmas`, `banner_halloween`, etc.), allowing the frontend to dynamically select the correct assets based on the active theme string.

---

## 🔗 Links
 
- **GitHub:** https://github.com/kulla-kukkai/Book-Ducks
- **Frontend:** https://book-ducks.netlify.app
- *BookDucks — Read more, quack more 🦆*
