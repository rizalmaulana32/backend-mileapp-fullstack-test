import mongoose, { Document, Schema } from 'mongoose'

export interface ITask extends Document {
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  createdAt: Date
  updatedAt: Date
}

const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

taskSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

const Task = mongoose.model<ITask>('Task', taskSchema)

export default Task
