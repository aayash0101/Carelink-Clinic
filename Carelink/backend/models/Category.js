const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a category name'],
    unique: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    // SECURITY: Allow only letters, numbers, spaces, and hyphens
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9\s-]+$/.test(v);
      },
      message: 'Category name contains invalid characters'
    }
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  strict: 'throw' // SECURITY: Reject unknown fields
});

// Slug Generation
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);

