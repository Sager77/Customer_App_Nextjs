# Customer App (Next.js Version)

This is a full-stack Next.js conversion of the original MERN (MongoDB, Express, React, Node.js) Customer App. It retains the exact same functionality, styling, and MongoDB schemas, but is now unified into a single Next.js application using the App Router.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Database:** MongoDB (via Mongoose)
- **Styling:** Vanilla CSS

## Project Structure

```
next-app/
├── app/
│   ├── api/customers/      # Serverless API routes replacing Express backend
│   ├── globals.css         # Global styles (formerly style.css)
│   ├── layout.jsx          # Root layout
│   └── page.jsx            # Main Client Component for the UI
├── lib/
│   ├── customerApi.js      # Fetch wrapper for client-side API requests
│   ├── db.js               # MongoDB connection utility with connection caching
│   └── errorHandler.js     # Shared error handling for API routes
├── models/
│   └── Customer.js         # Mongoose Customer Schema
├── package.json
└── jsconfig.json           # Path alias configuration (@/*)
```

## Setup & Running Locally

1. **Install dependencies:**
   Make sure you are in the `next-app` directory and run:
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env.local` file in the root of `next-app` and add your MongoDB connection string:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/customer-app
   ```
   *(If you are using MongoDB Atlas, replace the URI with your cloud connection string).*

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Open the App:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser. You no longer need to run a separate frontend and backend server!

## API Routes

The Next.js app exposes the same REST API as the original Express app via serverless functions:

| Method | URL                          | Description                                  |
| ------ | ---------------------------- | -------------------------------------------- |
| GET    | `/api/customers`             | Get a paginated list of customers (supports search and filtering) |
| POST   | `/api/customers`             | Create a new customer                        |
| GET    | `/api/customers/:id`         | Get a specific customer by ID                |
| PUT    | `/api/customers/:id`         | Update a specific customer by ID             |
| DELETE | `/api/customers/:id`         | Delete a specific customer by ID             |

## Data Persistence

This application connects to the exact same database structure as the previous iteration. Transitioning to this version involves zero data loss, as it uses the same Mongoose Schema models and validation rules.
