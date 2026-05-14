# 🦆 BookDucks

A full-stack web application for a bookstore where users can browse books, save their reading list, and rate books. Built with Vanilla JavaScript and Strapi v5.

---

## ✨ Features

### Public
- Browse all books with cover images, author, pages, and published date
- Register and log in

### Logged-in Users
- See which user is logged in, with logout option
- Save books to a personal **"Att läsa"** (To-Read) reading list
- Rate books with a 1–5 star rating system
- View profile page with:
  - Reading list (sortable by title and author)
  - Rated books list (sortable by title, author, and rating)
  - Remove books from reading list

### Admin
- Access to admin panel via the website
- Upload new books directly from the frontend
- Theme is controlled from Strapi — admin can switch between **default**, **christmas**, and **halloween** themes

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript, HTML, CSS |
| HTTP Client | Axios (CDN) |
| Backend / CMS | Strapi v5 |
| Database | SQLite |
| Dev Server | Live Server (port 5500) |

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

## 🚀 Getting Started

### Prerequisites
- Node.js
- npm

### 1. Start Strapi Backend

```bash
cd backend
npm install
npm run develop
```

Strapi runs at: `http://localhost:1337`

### 2. Start Frontend

Open `frontend/home.html` with **Live Server** (VS Code extension) on port `5500`.

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

*BookDucks — Read more, quack more 🦆*
