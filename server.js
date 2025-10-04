import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Task from './models/Task.js'
import { authenticateToken } from './middleware/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Demo credentials (in production, use proper user management)
const DEMO_USER = {
  username: 'admin',
  password: 'admin123'
}

// POST /login - Login endpoint
app.post('/login', (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

    // Validate credentials
    if (username === DEMO_USER.username && password === DEMO_USER.password) {
      const token = jwt.sign(
        { username: username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      )

      return res.status(200).json({
        message: 'Login successful',
        token: token
      })
    } else {
      return res.status(401).json({ message: 'Invalid username or password' })
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /tasks - Get all tasks with filtering, sorting, and pagination
app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      title,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query

    // Build filter query
    const filter = {}
    if (status) {
      filter.status = status
    }
    if (title) {
      filter.$text = { $search: title }
    }

    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1
    const sortObj = { [sort]: sortOrder }

    // Calculate pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Execute query
    const tasks = await Task.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)

    const total = await Task.countDocuments(filter)

    return res.status(200).json({
      data: tasks,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /tasks - Create a new task
app.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, status } = req.body

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' })
    }

    const task = new Task({
      title,
      description,
      status: status || 'pending'
    })

    await task.save()

    return res.status(201).json({
      message: 'Task created successfully',
      data: task
    })
  } catch (error) {
    console.error('Error creating task:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// PUT /tasks/:id - Update a task
app.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, status } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID' })
    }

    const task = await Task.findById(id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    if (title) task.title = title
    if (description) task.description = description
    if (status) task.status = status
    task.updatedAt = Date.now()

    await task.save()

    return res.status(200).json({
      message: 'Task updated successfully',
      data: task
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID' })
    }

    const task = await Task.findByIdAndDelete(id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    return res.status(204).send()
  } catch (error) {
    console.error('Error deleting task:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
