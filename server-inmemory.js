import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { authenticateToken } from './middleware/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// In-memory storage
let tasks = []
let taskIdCounter = 1

// Demo credentials
const DEMO_USER = {
  username: 'admin',
  password: 'admin123'
}

// Helper function to generate ID
const generateId = () => {
  return (taskIdCounter++).toString()
}

// POST /login - Login endpoint
app.post('/login', (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

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

    // Filter tasks
    let filteredTasks = [...tasks]

    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status)
    }

    if (title) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(title.toLowerCase())
      )
    }

    // Sort tasks
    filteredTasks.sort((a, b) => {
      let comparison = 0
      if (sort === 'createdAt') {
        comparison = new Date(a.createdAt) - new Date(b.createdAt)
      } else if (sort === 'title') {
        comparison = a.title.localeCompare(b.title)
      }
      return order === 'asc' ? comparison : -comparison
    })

    // Paginate
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

    return res.status(200).json({
      data: paginatedTasks,
      meta: {
        total: filteredTasks.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filteredTasks.length / limitNum)
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

    const task = {
      _id: generateId(),
      title,
      description,
      status: status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    tasks.push(task)

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

    const taskIndex = tasks.findIndex(task => task._id === id)

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' })
    }

    const task = tasks[taskIndex]

    if (title) task.title = title
    if (description) task.description = description
    if (status) task.status = status
    task.updatedAt = new Date().toISOString()

    tasks[taskIndex] = task

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

    const taskIndex = tasks.findIndex(task => task._id === id)

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' })
    }

    tasks.splice(taskIndex, 1)

    return res.status(204).send()
  } catch (error) {
    console.error('Error deleting task:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', storage: 'in-memory' })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log('Using in-memory storage (data will be lost on restart)')
})
