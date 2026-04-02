import Todo from '../models/Todo.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const getTodos = asyncHandler(async (req, res) => {
  const { completed, priority, category, search } = req.query;

  const filter = {
    $or: [
      { user: req.user._id },
      { 'sharedWith.user': req.user._id }
    ]
  };

  if (completed !== undefined) {
    filter.completed = completed === 'true';
  }

  if (priority) {
    filter.priority = priority;
  }

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const todos = await Todo.find(filter)
    .populate('user', 'username avatar')
    .populate('sharedWith.user', 'username avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { todos }
  });
});

export const createTodo = asyncHandler(async (req, res) => {
  const { title, description, priority, category, tags, dueDate } = req.body;

  if (!title || title.trim() === '') {
    res.status(400);
    throw new Error('Todo title is required');
  }

  const todo = await Todo.create({
    title: title.trim(),
    description: description?.trim() || '',
    priority: priority || 'medium',
    category: category || 'personal',
    tags: tags || [],
    dueDate: dueDate || null,
    user: req.user._id
  });

  await todo.populate('user', 'username avatar');

  res.status(201).json({
    success: true,
    message: 'Todo created successfully',
    data: { todo }
  });
});

export const updateTodo = asyncHandler(async (req, res) => {
  let todo = await Todo.findById(req.params.id);

  if (!todo) {
    res.status(404);
    throw new Error('Todo not found');
  }

  const isOwner = todo.user.toString() === req.user._id.toString();
  if (!isOwner) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const { title, description, completed, priority, category, tags, dueDate } = req.body;

  if (title !== undefined) todo.title = title.trim();
  if (description !== undefined) todo.description = description.trim();
  if (completed !== undefined) todo.completed = completed;
  if (priority !== undefined) todo.priority = priority;
  if (category !== undefined) todo.category = category;
  if (tags !== undefined) todo.tags = tags;
  if (dueDate !== undefined) todo.dueDate = dueDate;

  await todo.save();

  res.status(200).json({
    success: true,
    message: 'Todo updated successfully',
    data: { todo }
  });
});

export const deleteTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findById(req.params.id);

  if (!todo) {
    res.status(404);
    throw new Error('Todo not found');
  }

  if (todo.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  await todo.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Todo deleted successfully'
  });
});

export const toggleTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findById(req.params.id);

  if (!todo) {
    res.status(404);
    throw new Error('Todo not found');
  }

  todo.completed = !todo.completed;
  await todo.save();

  res.status(200).json({
    success: true,
    data: { todo }
  });
});

export const getTodoStats = asyncHandler(async (req, res) => {
  const todos = await Todo.find({ user: req.user._id });

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    pending: todos.filter(t => !t.completed).length,
    overdue: todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length
  };

  res.status(200).json({
    success: true,
    data: { overview: stats }
  });
});

export default { getTodos, createTodo, updateTodo, deleteTodo, toggleTodo, getTodoStats };
