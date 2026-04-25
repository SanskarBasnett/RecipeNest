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
├── package.json                  ← Root: runs both servers with one command
│
├── backend/
│   ├── package.json
│   ├── .env                      ← Environment variables (port, DB, JWT secret)
│   └── src/
│       ├── index.js              ← Express app entry point
│       ├── controllers/          ← Business logic
│       │   ├── auth.controller.js
│       │   ├── chef.controller.js
│       │   ├── recipe.controller.js
│       │   ├── category.controller.js
│       │   ├── notification.controller.js
│       │   └── admin.controller.js
│       ├── models/               ← Mongoose schemas
│       │   ├── User.model.js
│       │   ├── Recipe.model.js       ← includes likes + comments
│       │   ├── Category.model.js
│       │   ├── Notification.model.js
│       │   └── ActivityLog.model.js
│       ├── routes/               ← API route definitions
│       ├── middleware/           ← JWT auth + Multer file upload
│       ├── utils/                ← Seed scripts, helpers
│       └── uploads/              ← Uploaded images (auto-created)
│
└── frontend/
    ├── package.json
    └── src/
        ├── index.js              ← React entry point
        ├── App.jsx               ← Router + protected routes
        ├── index.css             ← Global styles + CSS variables (light/dark)
        ├── api/
        │   └── axios.js          ← Axios instance + JWT interceptor + getImageUrl()
        ├── context/
        │   ├── AuthContext.jsx   ← Global auth state (login, register, logout)
        │   └── ThemeContext.jsx  ← Light/dark mode toggle
        ├── components/
        │   ├── Navbar.jsx        ← Sticky navbar with bell notification badge (chefs)
        │   ├── RecipeForm.jsx    ← Add/edit recipe form with dynamic category combobox
        │   └── ProfileForm.jsx   ← Profile editor (avatar, bio, social links, password)
        └── pages/
            ├── Home.jsx              ← Landing page with hero, featured recipes, chefs
            ├── Login.jsx             ← Login page
            ├── Register.jsx          ← Register with role selector (User / Chef)
            ├── Recipes.jsx           ← Recipe listing with search, sort, filter
            ├── RecipeDetail.jsx      ← Full recipe view with likes, comments, sharing
            ├── ChefsList.jsx         ← Browse all chefs
            ├── ChefProfile.jsx       ← Individual chef profile + their recipes
            ├── Dashboard.jsx         ← Chef dashboard (recipes, notifications, profile)
            ├── UserDashboard.jsx     ← User feed (discover recipes, browse chefs)
            ├── AdminDashboard.jsx    ← Admin panel (users, recipes, stats)
            └── UserProfile.jsx       ← Admin view of a user's profile
```

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017 (or a MongoDB Atlas connection string)

### 1. Install all dependencies

From the root `RecipeNest/` folder:

```bash
npm run install:all
```

Installs dependencies for both `backend/` and `frontend/` in one command.

### 2. Configure environment

`backend/.env` is pre-configured for local development:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/recipenest
JWT_SECRET=recipenest_super_secret_key_2024
NODE_ENV=development
```

Replace `MONGO_URI` with your Atlas connection string if using MongoDB Atlas.

### 3. Run the app

```bash
npm run dev
```

Starts both servers simultaneously:
- Backend API → http://localhost:5000
- Frontend app → http://localhost:3000

On first start the backend automatically seeds the admin account, categories, chefs, and recipes.

---

## Available Scripts (root)

| Command               | Description                                      |
|-----------------------|--------------------------------------------------|
| `npm run install:all` | Install dependencies for backend and frontend    |
| `npm run dev`         | Run both backend (nodemon) and frontend together |
| `npm start`           | Run both in production mode                      |

---

## User Roles

| Role  | Access                                                                    |
|-------|---------------------------------------------------------------------------|
| User  | Browse recipes, view chef profiles, like recipes, leave comments          |
| Chef  | All user access + dashboard to manage recipes, view notifications         |
| Admin | Full access + user management, view user profiles, platform stats         |

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint          | Description              | Auth |
|--------|-------------------|--------------------------|------|
| POST   | /register         | Register user or chef    | No   |
| POST   | /login            | Login and receive JWT    | No   |
| GET    | /me               | Get current user info    | Yes  |
| PUT    | /change-password  | Change own password      | Yes  |

### Chefs — `/api/chefs`
| Method | Endpoint  | Description                  | Auth       |
|--------|-----------|------------------------------|------------|
| GET    | /         | List all chefs               | No         |
| GET    | /:id      | Chef profile + their recipes | No         |
| PUT    | /profile  | Update own profile           | Chef/Admin |
| PUT    | /avatar   | Upload profile picture       | Chef/Admin |

### Recipes — `/api/recipes`
| Method | Endpoint                      | Description                        | Auth       |
|--------|-------------------------------|------------------------------------|------------|
| GET    | /                             | All recipes (sort, filter)         | No         |
| GET    | /:id                          | Single recipe detail               | No         |
| GET    | /chef/my                      | Logged-in chef's own recipes       | Chef       |
| POST   | /                             | Create a new recipe                | Chef       |
| PUT    | /:id                          | Update a recipe                    | Chef/Admin |
| DELETE | /:id                          | Delete a recipe                    | Chef/Admin |
| POST   | /:id/like                     | Toggle like on a recipe            | Any user   |
| POST   | /:id/comments                 | Add a comment                      | Any user   |
| DELETE | /:id/comments/:commentId      | Delete a comment                   | Owner/Admin|

### Categories — `/api/categories`
| Method | Endpoint   | Description                          | Auth       |
|--------|------------|--------------------------------------|------------|
| GET    | /          | List all categories                  | No         |
| POST   | /          | Add a new category                   | Chef/Admin |
| DELETE | /:name     | Delete a category                    | Admin      |

### Notifications — `/api/notifications`
| Method | Endpoint        | Description                          | Auth  |
|--------|-----------------|--------------------------------------|-------|
| GET    | /               | Get all notifications for chef       | Chef  |
| GET    | /unread-count   | Get unread notification count        | Chef  |
| PUT    | /read-all       | Mark all notifications as read       | Chef  |
| DELETE | /:id            | Delete a notification                | Chef  |

### Admin — `/api/admin`
| Method | Endpoint      | Description                  | Auth  |
|--------|---------------|------------------------------|-------|
| GET    | /stats        | Platform stats               | Admin |
| GET    | /activity     | Recent activity log          | Admin |
| GET    | /users        | List all users               | Admin |
| GET    | /users/:id    | View a single user's profile | Admin |
| DELETE | /users/:id    | Delete user + their recipes  | Admin |
| GET    | /recipes      | List all recipes             | Admin |
| DELETE | /recipes/:id  | Delete any recipe            | Admin |

---

## Default Accounts

### Admin
| Field    | Value           |
|----------|-----------------|
| Email    | admin@gmail.com |
| Password | admin@123       |

### Seeded Chefs (all use the same password)

| Name             | Email              | Specialty               |
|------------------|--------------------|-------------------------|
| Marco Rossi      | marco@gmail.com    | Italian Cuisine         |
| Aisha Patel      | aisha@gmail.com    | Indian & Fusion         |
| Jean-Luc Moreau  | jeanluc@gmail.com  | French Pastry           |
| Sofia Hernandez  | sofia@gmail.com    | Mexican & Latin American|
| Kenji Tanaka     | kenji@gmail.com    | Japanese & Asian Fusion |

**Chef password:** `chef@123`

---

## Features

- JWT authentication with role-based access control (User / Chef / Admin)
- Light and dark mode toggle (persisted in localStorage)
- Chef profiles with avatar, bio, specialty, location, and social links
- Recipe CRUD with image upload, ingredients, step-by-step instructions, difficulty, and category
- Dynamic category combobox — pick existing or type a new one to create it on the fly
- Likes and comments on recipes — any logged-in user can like or comment
- Chef notifications — real-time bell badge in the navbar, dedicated notifications tab in the dashboard
- Notifications created when someone likes or comments on a chef's recipe (not self-triggered)
- Back button on chef profile and recipe detail pages — returns to the correct dashboard tab
- Tab state stored in the URL for all dashboards — survives navigation and browser back
- Admin can view individual user profiles
- Recipe listing with sort (newest, oldest, A–Z, difficulty) and filter by difficulty/category
- Read More toggle on recipe cards
- Social media sharing (Web Share API + Twitter/Facebook links)
- Fully responsive design for mobile, tablet, and desktop
- Auto-seeded admin, categories, chefs, and recipes on first backend start
