const mongoose = require('mongoose');
const { monitorQuery } = require('../utils/queryMonitor');

// ==========================================
// SERVICE MODEL (CareLink Clinic) — formerly Product
// ==========================================
const productSchema = new mongoose.Schema(
  {
    // Service name
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
      validate: {
        validator: function (v) {
          // Allow letters, numbers, spaces, and common punctuation
          return /^[a-zA-Z0-9\s\-_.,'&()]+$/.test(v);
        },
        message: 'Name contains invalid characters'
      }
    },

    // URL-friendly
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description too long']
    },

    // Clinic fee (NPR)
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      max: [10000000, 'Price exceeds maximum'],
      validate: {
        validator: function (v) {
          return Number.isFinite(v) && /^\d+(\.\d{1,2})?$/.test(v.toFixed(2));
        },
        message: 'Invalid price format (max 2 decimals)'
      }
    },

    // Department reference (Category)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Department is required'],
      index: true,
      validate: {
        validator: function (v) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Invalid department id'
      }
    },

    // Optional: typical appointment duration
    durationMinutes: {
      type: Number,
      default: 15,
      min: [5, 'Duration too short'],
      max: [240, 'Duration too long'],
      validate: {
        validator: Number.isInteger,
        message: 'Duration must be a whole number'
      }
    },

    // Optional: image/thumbnail (NOT required)
    images: {
      type: [String],
      default: [],
      validate: [
        {
          validator: function (v) {
            return Array.isArray(v) && v.length <= 10;
          },
          message: 'Max 10 images allowed'
        },
        {
          validator: function (v) {
            // allow empty OR safe urls/paths
            if (!Array.isArray(v)) return false;
            return v.every(
              (url) =>
                typeof url === 'string' &&
                url.length <= 500 &&
                (/^https?:\/\/.+/.test(url) || /^\/uploads\/.+/.test(url))
            );
          },
          message: 'Invalid image URL format'
        }
      ]
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    strict: 'throw', // SECURITY: reject unknown fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1, price: 1 });
productSchema.index({ createdAt: -1 });

// Slug generation
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!this.slug || this.slug.length < 2) {
      this.slug = `service-${Date.now()}`;
    }
  }

  // Round price to 2 decimals
  this.price = Math.round(this.price * 100) / 100;

  next();
});

// Prevent invalid updates
productSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  const $set = update?.$set || update;

  if ($set) {
    if ($set.price !== undefined) {
      const price = Number($set.price);
      if (!Number.isFinite(price) || price < 0 || price > 10000000) {
        return next(new Error('Invalid price value'));
      }
      $set.price = Math.round(price * 100) / 100;
    }

    if ($set.durationMinutes !== undefined) {
      const d = Number($set.durationMinutes);
      if (!Number.isInteger(d) || d < 5 || d > 240) {
        return next(new Error('Invalid durationMinutes value'));
      }
    }

    if ($set.category !== undefined) {
      if (!mongoose.Types.ObjectId.isValid($set.category)) {
        return next(new Error('Invalid department id'));
      }
    }
  }

  next();
});

// Query monitoring (keep)
productSchema.pre('find', function () {
  monitorQuery('Product', 'find', this.getQuery());
});
productSchema.pre('findOne', function () {
  monitorQuery('Product', 'findOne', this.getQuery());
});

module.exports = mongoose.model('Product', productSchema);
