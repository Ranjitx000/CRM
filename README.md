# Mini ERP & CRM Operations Portal

A complete, full-stack enterprise resource planning (ERP) and customer relationship management (CRM) application designed for small to medium businesses. This system provides a unified interface to manage customers, product inventory, stock movements, and sales challans (delivery notes/invoices) with role-based access control.

## 🚀 Tech Stack

**Frontend:**
- **React 18** (Vite)
- **TypeScript**
- **Tailwind CSS** + **Shadcn UI** for modern, responsive components
- **React Query** for data fetching and caching
- **Zustand** for global state management
- **React Hook Form** + **Zod** for robust form validation
- **Recharts** for analytics dashboards
- **React Router** for protected routing

**Backend:**
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose** (Supports standalone local MongoDB and MongoDB Atlas)
- **JWT (JSON Web Tokens)** for secure, stateless authentication (Access & Refresh Tokens)
- **Bcrypt** for password hashing

---

## ✨ Key Features

### 1. Role-Based Access Control (RBAC)
Secure authentication system with strict role-based route protection:
- **ADMIN**: Full access to all modules and user management.
- **SALES**: Access to Customers, Challans, and Dashboard.
- **WAREHOUSE**: Access to Products, Inventory Stock Management, and Challans.
- **ACCOUNTS**: Access to Customers, Challans, and Financial Analytics.

### 2. Comprehensive Dashboard
- **Analytics & Stats**: High-level metrics on total customers, active SKUs, physical stock, and issued challans.
- **Activity Timeline**: Real-time chronological tracking of system-wide actions.
- **Revenue Overview**: Interactive charts visualizing monthly revenue trends.

### 3. Customer Management (CRM)
- Register and categorize customers (Retail, Wholesale, Distributor).
- Track business details, GST numbers, primary contacts, and addresses.
- **Follow-up Notes**: Add, track, and timestamp specific interaction notes per customer.
- Interactive slide-out views for deep-diving into customer data on any device.

### 4. Inventory & Product Catalog
- Manage product SKUs, categories, and unit pricing.
- **Low Stock Alerts**: Define minimum stock thresholds; visual alerts trigger when inventory runs low.
- **Stock Movement Log**: Track `IN` (restock) and `OUT` (dispatch) movements with attached reasons and history trails.

### 5. Sales Challans (Invoicing)
- Create dynamic, multi-item delivery challans linking customers to products.
- Real-time total calculation based on unit prices and quantities.
- Status workflows (`DRAFT` → `CONFIRMED` or `CANCELLED`).
- **Print to PDF**: Built-in, clean, formatted HTML-to-PDF print generation for physical delivery tracking.

### 6. Fully Responsive Design
Mobile-first layout considerations ensure tables, modals, sidebars, and dashboards scale perfectly across desktops, tablets, and smartphones.

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js (v18+ recommended)
- Git
- MongoDB (Local standalone instance or a MongoDB Atlas Cloud URI)

### 1. Clone the Repository
```bash
git clone https://github.com/Ranjitx000/CRM.git
cd CRM
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and configure environment variables.

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/crm_db  # OR your MongoDB Atlas string
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, install dependencies, and start the Vite dev server.

```bash
cd Frontend
npm install
```

Create a `.env` file in the `Frontend` directory (if required by your setup) to point to the backend URL:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend application:
```bash
npm run dev
```

The application will be running at `http://localhost:5173`.

---

## 📂 Project Structure

```
CRM/
├── Backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── middlewares/      # JWT auth and Role guards
│   │   ├── models/           # Mongoose schemas (User, Customer, Product, Challan, etc.)
│   │   ├── routes/           # Express API endpoints
│   │   └── services/         # Business logic & database operations
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── api/              # Axios API clients & interceptors
│   │   ├── app/              # Protected routing & Main layout wrapper
│   │   ├── components/       # Shared UI elements & Shadcn primitives
│   │   ├── features/         # Domain-driven feature modules (Auth, Customers, etc.)
│   │   ├── hooks/            # React Query hooks for fetching/mutating data
│   │   ├── lib/              # Utility functions & Axios setup
│   │   └── types/            # TypeScript interfaces
│   └── package.json
│
└── .gitignore                # Root gitignore securing env and node_modules
```

---

## 🔒 Security Practices Implemented
- **Passwords**: Hashed securely via bcrypt before saving to the database.
- **API Protection**: Authorization headers required on endpoints; token expiration and refresh handling.
- **Environment Isolation**: Sensitive keys and URIs are completely removed from source control via `.gitignore`.
- **Hydration & Cross-Site Scripting (XSS)**: React handles DOM escaping naturally, protecting against injection attacks.

## 📄 License
This project is for educational and internal business purposes.
