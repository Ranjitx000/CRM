# Mini ERP + CRM System

A full-stack, cloud-deployed Mini Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) system built on the MERN stack.

## 🚀 Project Overview

This project provides a comprehensive internal tool for managing customers, products, inventory (stock movements), and generating delivery challans. It implements strict Role-Based Access Control (RBAC) to ensure employees only have access to modules relevant to their departments.

**Live URL (Frontend):** https://crm-7c4p.vercel.app  
**Live URL (Backend):** https://crm-gamma-lyart-16.vercel.app

## 📋 Features & Modules

- **Authentication & RBAC**: Secure login with JWT. Four distinct roles: `ADMIN`, `SALES`, `WAREHOUSE`, and `ACCOUNTS`.
- **Customer Management (CRM)**: Manage customer profiles, contact info, and activity notes.
- **Product & Inventory Management**: Track products, SKUs, unit prices, warehouse locations, and low-stock alerts.
- **Stock Movements**: Record IN/OUT stock adjustments with reasons and remarks.
- **Delivery Challans**: Generate, draft, and confirm delivery challans linked to specific customers and products.

## 💻 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI, React Query (TanStack Query), React Hook Form, Zod.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JSON Web Tokens (JWT), bcrypt.
- **Deployment**: Vercel (Serverless Functions for Backend, Static Hosting for Frontend), MongoDB Atlas.

## 🏗️ Architecture
- **Client-Server Model**: Decoupled React frontend communicating with an Express REST API.
- **Stateless Authentication**: JWT tokens stored securely in HTTP-only cookies.
- **Serverless Deployment**: Backend APIs run as independent Vercel serverless functions via `api/index.js`.

For detailed architecture, see [Architecture Documentation](./docs/architecture.md).

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas cluster)

### 1. Clone the repository
```bash
git clone https://github.com/Ranjitx000/CRM.git
cd CRM
```

### 2. Backend Setup
```bash
cd Backend
npm install
```
Create a `.env` file in the `Backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crm_erp
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```
Run the server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd Frontend
npm install
```
Create a `.env` file in the `Frontend` directory:
```env
VITE_API_URL=http://localhost:5000
```
Run the client:
```bash
npm run dev
```

### 4. Seed the Database
To create the initial test users, run the seed script from the `Backend` directory:
```bash
node scripts/seed.js
```

## 🔑 Test Credentials

If you ran the seed script, you can log in with the following users (all passwords are `password123`):

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` |
| **Sales** | `sales@example.com` | `password123` |
| **Warehouse** | `warehouse@example.com` | `password123` |
| **Accounts** | `accounts@example.com` | `password123` |

*Note: You can also use `superadmin@example.com` / `admin123` if deployed to the live server.*

## 📚 Documentation

For deeper technical documentation, please refer to the `/docs` folder:
- [Architecture & Tech Stack](./docs/architecture.md)
- [Database Schema & ER Diagram](./docs/database.md)
- [API Documentation](./docs/api-documentation.md)
- [Business Workflows](./docs/business-flow.md)

## ⚠️ Known Limitations
- Real-time notifications via WebSockets are not yet implemented.
- PDF Generation for Challans relies on browser printing capabilities rather than server-side PDF compilation.
- Currently, single-currency support only.

---
*Created as a case study for Mini ERP + CRM implementation.*
