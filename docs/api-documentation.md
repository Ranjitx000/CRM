# API Documentation

The backend exposes a RESTful API. All protected routes require a valid JWT stored in an `httpOnly` cookie.

## Authentication (`/auth`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate user, returns user profile and sets JWT cookie | Public |
| `POST` | `/auth/logout` | Clears the JWT cookie | Public |
| `GET` | `/auth/me` | Validates JWT and returns current user session data | Any |

## Customers (`/customers`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/customers` | List all customers (supports search) | `ADMIN`, `SALES`, `ACCOUNTS` |
| `GET` | `/customers/:id` | Get specific customer details | `ADMIN`, `SALES`, `ACCOUNTS` |
| `POST` | `/customers` | Create a new customer | `ADMIN`, `SALES` |
| `PUT` | `/customers/:id` | Update customer details | `ADMIN`, `SALES` |
| `POST` | `/customers/:id/notes` | Append a CRM activity note to a customer | `ADMIN`, `SALES` |

## Products (`/products`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | List all products with current stock levels | Any |
| `POST` | `/products` | Add a new product to the catalog | `ADMIN`, `WAREHOUSE` |
| `PUT` | `/products/:id` | Update product metadata (name, price, etc.) | `ADMIN`, `WAREHOUSE` |

## Stock Movements (`/stock-movements`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/stock-movements` | View inventory ledger/history | `ADMIN`, `WAREHOUSE` |
| `POST` | `/stock-movements` | Register IN/OUT stock, updates product `currentStock` | `ADMIN`, `WAREHOUSE` |

## Delivery Challans (`/challans`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/challans` | List all delivery challans | Any |
| `POST` | `/challans` | Draft a new challan | `ADMIN`, `SALES`, `WAREHOUSE` |
| `PUT` | `/challans/:id` | Update a challan (e.g., Change status to `CONFIRMED`) | `ADMIN`, `SALES`, `WAREHOUSE` |

---
*Note: A Postman collection is available at `/postman/Mini-ERP-API.json` for easy API testing.*
