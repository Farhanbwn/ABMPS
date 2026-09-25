# Admin-Only Member Management System (MMS)

A robust, production-ready **Member Management System** engineered specifically for organizations requiring high-integrity member records, multi-language English & Bengali (বাংলা) support, sequential/custom member serial numbering, dynamic annual membership renewals, bill tracking, customized printing layouts (A4 Portrait/Landscape with custom column selection), and Excel exporting (.xlsx).

---

## 🌟 Key Features

* **Admin-Only Security Model**: No public registration or member portals. Dedicated single-admin authentication with bcrypt password hashing and JWT authorization.
* **Full Bilingual Support**: Native UTF-8 support for English and Bengali names and addresses (`Noto Sans Bengali` & `Inter` typography).
* **Comprehensive Member Profiles**:
  * Serial No. (Unique Member ID, auto-generable or manually entered)
  * Name in Bengali & English
  * Date of Birth (validated with age checks)
  * Address & Validated Indian Mobile Number (10 digits starting 6–9)
  * Gender (`Male`, `Female`, `Other`)
  * Joining Year & Membership Status (`Active`, `Inactive`)
  * Active Membership Bill ID
* **Independent Renewal Architecture**:
  * Dedicated `MembershipRenewal` collection to prevent array bloating.
  * Compound unique index (`memberId + membershipYear`) prevents duplicate renewals for the same year.
  * Member document always maintains active status and the latest Bill ID for rapid query performance.
  * Complete historical bill IDs and notes recorded chronologically.
* **Server-Side Operations**:
  * Multi-field search (Serial No, English Name, Bengali Name, Mobile, Bill ID).
  * Multi-criteria filters: Status, Gender, Join Year, and Membership Renewal Year.
  * Server-side pagination (10, 25, 50, 100 records/page) and multi-field sorting.
* **Professional Print System**:
  * Dedicated modal with interactive column selector.
  * Support for **A4 Portrait** and **A4 Landscape**.
  * Official organization letterhead and summary metadata.
  * Dedicated print media rules that hide sidebar, navbars, and buttons.
* **Excel Export (XLSX)**:
  * Interactive column picker modal.
  * Export options: **Current Filtered Results** or **All Members**.
  * Auto-fitted column widths, frozen header row, bold headers, and native Bengali Unicode compatibility.
* **Soft Delete Safety**:
  * Members are soft-deleted (`isDeleted: true, deletedAt: timestamp`) to preserve relational and audit history.
  * Confirmation modal before deletion.
* **Responsive Admin UI**:
  * Built with Tailwind CSS using solid administrative tokens.
  * Collapsible sidebar drawer for mobile and tablets.
  * Interactive Toast notifications (no browser `alert()`).
  * Loading indicators and double-submission protection.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript |
| **Styling** | Tailwind CSS |
| **State & API** | React Hooks, Context API, Axios |
| **Form Management** | React Hook Form, Zod Schema Validation |
| **Icons & Export** | Lucide React, SheetJS (XLSX) |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MongoDB with Mongoose ODM |
| **Security** | JWT, bcryptjs, Helmet, CORS, Express Rate Limit |

---

## 📁 Project Directory Structure

```text
MMS/
├── client/                      # Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Reusable Modal, ProtectedRoute
│   │   │   ├── layout/          # Sidebar, Header, AdminLayout
│   │   │   └── members/         # PrintModal, ExcelExportModal, RenewalModal, DeleteConfirmModal
│   │   ├── context/             # AuthContext, ToastContext
│   │   ├── pages/               # Login, Dashboard, Members, Add, Edit, Details, Renewals, Settings
│   │   ├── services/            # Axios API client
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # React Router configuration
│   │   ├── main.tsx
│   │   └── index.css            # Tailwind & print media stylesheet
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── server/                      # Backend API Application
│   ├── config/                  # MongoDB connection (db.ts)
│   ├── controllers/             # authController, memberController, renewalController, dashboardController
│   ├── middleware/              # auth.ts (JWT guard), errorHandler.ts (standardized JSON error handler)
│   ├── models/                  # Admin.ts, Member.ts, MembershipRenewal.ts
│   ├── routes/                  # authRoutes, memberRoutes, renewalRoutes, dashboardRoutes
│   ├── utils/                   # jwt.ts (sign and verify)
│   ├── seed/                    # seedAdmin.ts, seedMembers.ts, seed.ts (master runner)
│   ├── server.ts                # Main Express application
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
│
├── package.json                 # Root orchestration scripts
└── README.md
```

---

## ⚙️ Environment Variables

### Backend Configuration (`server/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mms_db
JWT_SECRET=super_secret_jwt_key_mms_2026_secure
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin12345
CLIENT_URL=http://localhost:5173
```

### Frontend Configuration (`client/.env`)

```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api

# Organization Branding Details
VITE_APP_NAME="Member Management System"
VITE_ORG_NAME="Organization Member Directory"
```

For production deployment (e.g., on Vercel, Netlify, or AWS S3), set `VITE_API_URL` to your live backend domain:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js v18+ (tested on v24)
* MongoDB Server running locally or MongoDB Atlas connection string

### 2. Install All Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or navigate to `server` and `client` individually and run `npm install`)*

### 3. Seed the Database
You can seed both or choose to seed individually:
- **Seed Both (Master)**:
  ```bash
  npm run seed
  ```
- **Seed Admin User Only** (`seed/seedAdmin.ts`):
  ```bash
  npm run seed:admin
  ```
- **Seed Member & Renewal Records Only** (`seed/seedMembers.ts`):
  ```bash
  npm run seed:members
  ```

Default credentials configured in `.env`:
* **Username**: `admin`
* **Password**: `admin12345`

### 4. Run Development Servers
Start both the Express API (`http://localhost:5000`) and the Vite React app (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 📡 API Reference

All `/api/members`, `/api/renewals`, and `/api/dashboard` endpoints require the `Authorization: Bearer <token>` header.

### Authentication
* `POST /api/auth/login`: Authenticate admin with username & password
* `POST /api/auth/logout`: Invalidate session
* `GET /api/auth/me`: Get current authenticated admin

### Member Management
* `GET /api/members`: Paginated member list with search, filters, sorting
  * Query parameters: `page`, `limit`, `search`, `status`, `gender`, `joinYear`, `membershipYear`, `sortBy`, `sortOrder`
* `GET /api/members/all`: Fetch all filtered members (used for unpaginated Excel export)
* `GET /api/members/next-serial`: Get the next sequential available serial number
* `GET /api/members/join-years`: Get distinct list of joining years for dropdown filters
* `GET /api/members/:id`: Get full member profile and renewal history
* `GET /api/members/serial/:serialNo`: Get member by Serial No.
* `POST /api/members`: Create new member (validates unique Serial No.)
* `PUT /api/members/:id`: Update member details
* `DELETE /api/members/:id`: Soft delete member

### Membership Renewals
* `POST /api/renewals`: Renew membership (prevents duplicate renewal for same member & year; updates Member active status & Bill ID)
* `GET /api/renewals`: Get organization-wide renewals with pagination and search
* `GET /api/renewals/member/:memberId`: Get all renewal history for a member
* `GET /api/renewals/year/:year`: Get all renewals for a given year
* `PUT /api/renewals/:id`: Update renewal record
* `DELETE /api/renewals/:id`: Remove renewal record

### Dashboard
* `GET /api/dashboard/stats`: Returns Total Members, Active Members, Inactive Members, Renewed This Year, Pending Renewal, Recent Members, and Recent Renewals.

---

## 📦 Production Build & Deployment

To compile TypeScript and create optimized production bundles:
```bash
npm run build
```
To run the production server:
```bash
npm start
```
