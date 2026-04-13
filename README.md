# RecipeNest — Chef Portal

A full-stack web application where chefs can share recipes and connect with food lovers.

**Student:** Sanskar Basnet | **ID:** 2425776 | **Unit:** CIS051-2

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, React Router v6, Axios, Plain CSS     |
| Backend   | Node.js, Express.js                             |
| Database  | MongoDB + Mongoose ODM                          |
| Auth      | JWT (JSON Web Tokens) + bcryptjs                |
| Uploads   | Multer (image handling)                         |
| Dev Tools | Concurrently, Nodemon                           |

---

## Project Structure

```
RecipeNest/
├── package.json              ← Root: runs both servers with one command
│
├── backend/
│   ├── package.json
│   ├── .env                  ← Environment variables (port, DB, JWT secret)
│   └── src/
│       ├── index.js          ← Express app entry point
│       ├── controllers/      ← Business logic (auth, chef, recipe, admin)
│       ├── models/           ← Mongoose schemas (User, Recipe)
│       ├── routes/           ← API route definitions
│       ├── middleware/       ← JWT auth + Multer file upload
│       └── uploads/          ← Uploaded images (auto-created)
│
└── frontend/
    ├── package.json
    └── src/
        ├── index.js          ← React entry point
        ├── App.jsx           ← Router + protected routes
        ├── index.css         ← Global styles + CSS variables (light/dark)
        ├── api/
        │   └── axios.js      ← Axios instance + JWT interceptor + getImageUrl()
        ├── context/
        │   ├── AuthContext.jsx   ← Global auth state (login, register, logout)
        │   └── ThemeContext.jsx  ← Light/dark mode toggle
        ├── components/
        │   ├── Navbar.jsx        ← Sticky navbar with dark mode toggle
        │   ├── RecipeForm.jsx    ← Add/edit recipe form
        │   └── ProfileForm.jsx   ← Chef profile editor
        └── pages/
            ├── Home.jsx          ← Landing page with hero, featured recipes, chefs
            ├── Login.jsx         ← Login page
            ├── Register.jsx      ← Register with role selector (User / Chef)
            ├── Recipes.jsx       ← Recipe listing with search, sort, filter
            ├── RecipeDetail.jsx  ← Full recipe view with sharing
            ├── ChefsList.jsx     ← Browse all chefs
            ├── ChefProfile.jsx   ← Individual chef profile + their recipes
            ├── Dashboard.jsx     ← Chef dashboard (manage recipes + profile)
            └── AdminDashboard.jsx← Admin panel (manage users, roles, stats)
```

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017 (or a MongoDB Atlas connection string)

### 1. Install all dependencies

From the root `RecipeNest/` folder, run:

```bash
npm run install:all
```

This installs dependencies for both `backend/` and `frontend/` in one command.

### 2. Configure environment

The `backend/.env` file is already set up with defaults for local development:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/recipenest
JWT_SECRET=recipenest_super_secret_key_2024
NODE_ENV=development
```

If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

### 3. Run the app

```bash
npm run dev
```

This starts both servers simultaneously:
- Backend API → http://localhost:5000
- Frontend app → http://localhost:3000

---

## Available Scripts (root)

| Command               | Description                                      |
|-----------------------|--------------------------------------------------|
| `npm run install:all` | Install dependencies for backend and frontend    |
| `npm run dev`         | Run both backend (nodemon) and frontend together |
| `npm start`           | Run both in production mode                      |

---

## User Roles

| Role  | Access                                                        |
|-------|---------------------------------------------------------------|
| User  | Browse recipes, view chef profiles                            |
| Chef  | All user access + dashboard to manage recipes and profile     |
| Admin | All access + user management, role assignment, platform stats |

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint    | Description             | Auth |
|--------|-------------|-------------------------|------|
| POST   | /register   | Register user or chef   | No   |
| POST   | /login      | Login and receive JWT   | No   |
| GET    | /me         | Get current user info   | Yes  |

### Chefs — `/api/chefs`
| Method | Endpoint  | Description                        | Auth       |
|--------|-----------|------------------------------------|------------|
| GET    | /         | List all chefs                     | No         |
| GET    | /:id      | Chef profile + their recipes       | No         |
| PUT    | /profile  | Update own profile                 | Chef/Admin |
| PUT    | /avatar   | Upload profile picture             | Chef/Admin |

### Recipes — `/api/recipes`
| Method | Endpoint    | Description                          | Auth       |
|--------|-------------|--------------------------------------|------------|
| GET    | /           | All recipes (sort, filter, search)   | No         |
| GET    | /:id        | Single recipe detail                 | No         |
| GET    | /chef/my    | Logged-in chef's own recipes         | Chef       |
| POST   | /           | Create a new recipe                  | Chef       |
| PUT    | /:id        | Update a recipe                      | Chef/Admin |
| DELETE | /:id        | Delete a recipe                      | Chef/Admin |

### Admin — `/api/admin`
| Method | Endpoint         | Description              | Auth  |
|--------|------------------|--------------------------|-------|
| GET    | /stats           | Platform stats           | Admin |
| GET    | /users           | List all users           | Admin |
| DELETE | /users/:id       | Delete user + recipes    | Admin |
| PUT    | /users/:id/role  | Change user role         | Admin |

---

## Creating an Admin Account

Register normally through the app, then update the role directly in MongoDB:

**Using MongoDB shell:**
```js
use recipenest
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

**Using MongoDB Compass:**
Find the user document and change the `role` field from `"user"` to `"admin"`.

---

## Features

- JWT authentication with role-based access control (User / Chef / Admin)
- Light and dark mode toggle (persisted in localStorage)
- Chef profiles with avatar, bio, specialty, location, and social links
- Recipe CRUD with image upload, ingredients, instructions, difficulty, category
- Recipe listing with sort (newest, oldest, A-Z, difficulty) and filter (difficulty, category)
- Read More toggle on recipe cards
- Social media sharing (Web Share API + Twitter/Facebook links)
- Fully responsive design for mobile, tablet, and desktop
- Admin dashboard with user management, role assignment, and platform stats
- Auto-created uploads directory on backend startup
