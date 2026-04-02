import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['personal', 'work', 'shopping', 'health', 'finance', 'other'],
    default: 'personal'
  },
  tags: [{ type: String, trim: true, lowercase: true }],
  dueDate: {
    type: Date,
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    canEdit: {
      type: Boolean,
      default: false
    }
  }],
  subtasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

export default mongoose.model('Todo', todoSchema);
