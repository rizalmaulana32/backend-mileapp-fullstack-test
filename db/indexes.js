// MongoDB Index Script
// Run this script using mongosh or MongoDB Compass to create indexes for the tasks collection

// Connect to your database first, then run these commands:

// 1. Text index on title field - for full-text search on task titles
db.tasks.createIndex({ title: "text" })

// 2. Single field index on status - for filtering tasks by status (pending, in-progress, completed)
db.tasks.createIndex({ status: 1 })

// 3. Single field index on createdAt - for sorting tasks by creation date (most recent first)
db.tasks.createIndex({ createdAt: -1 })

// Optional: Compound index for combined queries
// If you frequently filter by status AND sort by createdAt, this compound index is beneficial
db.tasks.createIndex({ status: 1, createdAt: -1 })
