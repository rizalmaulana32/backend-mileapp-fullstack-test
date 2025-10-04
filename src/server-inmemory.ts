import express, { Request, Response } from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { authenticateToken, AuthRequest } from './middleware/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

interface Task {
  _id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  createdAt: string
  updatedAt: string
}

let tasks: Task[] = []
let taskIdCounter = 1

const DEMO_USER = {
  username: 'admin',
  password: 'admin123'
}

const generateId = (): string => {
  return (taskIdCounter++).toString()
}

app.post('/login', (req: Request, res: Response): void => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' })
      return
    }

    if (username === DEMO_USER.username && password === DEMO_USER.password) {
      const token = jwt.sign(
        { username },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
      )

      res.status(200).json({
        message: 'Login successful',
        token
      })
      return
    }

    res.status(401).json({ message: 'Invalid username or password' })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/tasks', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const {
      status,
      title,
      sort = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '10'
    } = req.query

    let filteredTasks = [...tasks]

    if (status && typeof status === 'string') {
      filteredTasks = filteredTasks.filter(task => task.status === status)
    }

    if (title && typeof title === 'string') {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(title.toLowerCase())
      )
    }

    filteredTasks.sort((a, b) => {
      let comparison = 0
      if (sort === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sort === 'title') {
        comparison = a.title.localeCompare(b.title)
      }
      return order === 'asc' ? comparison : -comparison
    })

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

    res.status(200).json({
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
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/tasks', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { title, description, status } = req.body

    if (!title || !description) {
      res.status(400).json({ message: 'Title and description are required' })
      return
    }

    const task: Task = {
      _id: generateId(),
      title,
      description,
      status: status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    tasks.push(task)

    res.status(201).json({
      message: 'Task created successfully',
      data: task
    })
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.put('/tasks/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params
    const { title, description, status } = req.body

    const taskIndex = tasks.findIndex(task => task._id === id)

    if (taskIndex === -1) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    const task = tasks[taskIndex]

    if (title) task.title = title
    if (description) task.description = description
    if (status) task.status = status
    task.updatedAt = new Date().toISOString()

    tasks[taskIndex] = task

    res.status(200).json({
      message: 'Task updated successfully',
      data: task
    })
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.delete('/tasks/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params

    const taskIndex = tasks.findIndex(task => task._id === id)

    if (taskIndex === -1) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    tasks.splice(taskIndex, 1)

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({ status: 'OK', storage: 'in-memory' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log('Using in-memory storage (data will be lost on restart)')
})
