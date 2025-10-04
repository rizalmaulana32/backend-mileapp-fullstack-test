# Task Management API

Express.js REST API with JWT authentication, built with TypeScript.

## Quick Start

```bash
npm install
npm run build     # Build TypeScript to JavaScript
npm start         # Runs in-memory version (no DB needed)
npm run start:mongo  # Runs with MongoDB
```

Or run in development mode (TypeScript directly):
```bash
npm run dev       # In-memory version
npm run dev:mongo # MongoDB version
```

Login: `admin` / `admin123`

## API Endpoints

All `/tasks` routes require JWT token in header: `Authorization: Bearer <token>`

**POST /login**
```json
{ "username": "admin", "password": "admin123" }
→ { "token": "..." }
```

**GET /tasks**
- Query params: `status`, `title`, `sort`, `order`, `page`, `limit`
- Returns paginated tasks with meta info

**POST /tasks**
```json
{ "title": "...", "description": "...", "status": "pending" }
```

**PUT /tasks/:id**
- Update task fields

**DELETE /tasks/:id**
- Delete a task (returns 204)

## Why These Choices?

I built this with TypeScript for type safety and better developer experience. JWT authentication is stateless - no session management needed, which makes scaling easier. The in-memory version (`src/server-inmemory.ts`) lets you test immediately without MongoDB.

For the API design, I stuck to REST principles with proper status codes. The filtering and pagination support comes from real-world needs - you rarely want to load all tasks at once.

## MongoDB Indexes

If you use the MongoDB version, run these indexes (they're in `db/indexes.js`):

```javascript
db.tasks.createIndex({ title: "text" })      // For text search
db.tasks.createIndex({ status: 1 })          // Filter by status
db.tasks.createIndex({ createdAt: -1 })      // Sort by date
```

**Why these indexes?**

The title text index makes search fast. Status index is crucial since most queries filter by status (show me pending tasks, etc). The createdAt index helps with sorting - users usually want to see newest tasks first.

I added a compound index too (`status + createdAt`) for queries that do both - like "show pending tasks, newest first". This is probably the most common query pattern.
