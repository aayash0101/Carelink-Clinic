const mongoose = require('mongoose');
const { monitorQuery } = require('../utils/queryMonitor');
const orderSchema = new mongoose.Schema({
  orderNumber: { 
    type: String, 
    unique: true, 
    required: [true, 'Order number is required'],
    index: true,
    validate: {
      validator: function(v) {
        return /^LUX-\d{13}-\d{4}$/.test(v);
      },
      message: 'Invalid order number format'
    }
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User is required'],
    index: true 
  },
  items: {
    type: [{
      product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      name: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: [200, 'Product name too long']
      },
      price: { 
        type: Number, 
        required: true,
        min: [0, 'Price cannot be negative'],
        validate: {
          validator: function(v) {
            return Number.isFinite(v);
          },
          message: 'Invalid price'
        }
      },
      quantity: { 
        type: Number, 
        required: true,
        min: [1, 'Quantity must be at least 1'],
        max: [1000, 'Quantity too high'],
        validate: {
          validator: function(v) {
            return Number.isInteger(v);
          },
          message: 'Quantity must be a whole number'
        }
      },
      image: { 
        type: String,
        maxlength: [500, 'Image URL too long']
      },
      variant: {
        size: { type: String, maxlength: 50 },
        color: { type: String, maxlength: 50 }
      }
    }],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0 && v.length <= 100;
      },
      message: 'Order must have 1-100 items'
    }
  },
  shippingAddress: {
    fullName: { 
      type: String, 
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name too long']
    },
    phone: { 
      type: String, 
      required: [true, 'Phone is required'],
      trim: true,
      maxlength: [20, 'Phone too long'],
      validate: {
        validator: function(v) {
          return /^[\d+\-() ]{10,20}$/.test(v);
        },
        message: 'Invalid phone format'
      }
    },
    address: { 
      type: String, 
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [200, 'Address too long']
    },
    city: { 
      type: String, 
      required: [true, 'City is required'],
      trim: true,
      maxlength: [50, 'City name too long']
    },
    state: { type: String, maxlength: 50 },
    postalCode: { type: String, maxlength: 20 },
    country: { 
      type: String, 
      default: 'Nepal',
      maxlength: 50
    }
  },
  paymentMethod: { 
    type: String, 
    enum: ['esewa', 'cod', 'khalti', 'stripe'], 
    default: 'esewa', 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], 
    default: 'pending', 
    index: true 
  },
  paymentResult: {
    transactionId: { 
      type: String, 
      index: true,
      maxlength: 200
    },
    paymentId: { type: String, maxlength: 200 },
    status: { type: String, maxlength: 50 },
    amount: { 
      type: Number,
      min: 0,
      validate: {
        validator: function(v) {
          return !v || Number.isFinite(v);
        },
        message: 'Invalid payment amount'
      }
    },
    paidAt: { type: Date }
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  subtotal: { 
    type: Number, 
    required: true,
    min: [0, 'Subtotal cannot be negative'],
    max: [100000000, 'Subtotal too high'],
    validate: {
      validator: function(v) {
        return Number.isFinite(v);
      },
      message: 'Invalid subtotal'
    }
  },
  shippingCost: { 
    type: Number, 
    default: 0,
    min: [0, 'Shipping cost cannot be negative'],
    max: [100000, 'Shipping cost too high']
  },
  tax: { 
    type: Number, 
    default: 0,
    min: [0, 'Tax cannot be negative'],
    max: [100000000, 'Tax too high']
  },
  discount: { 
    type: Number, 
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  total: { 
    type: Number, 
    required: true,
    min: [0, 'Total cannot be negative'],
    max: [100000000, 'Total too high'],
    validate: {
      validator: function(v) {
        return Number.isFinite(v);
      },
      message: 'Invalid total'
    }
  },
  coupon: { 
    code: { 
      type: String, 
      uppercase: true,
      maxlength: 20
    },
    discountAmount: { 
      type: Number,
      min: 0
    }
  },
  notes: { 
    type: String,
    maxlength: [500, 'Notes too long']
  },
  trackingNumber: {
    type: String,
    maxlength: 100
  },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  cancelledReason: { 
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Compound indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, paymentStatus: 1 });
orderSchema.index({ 'paymentResult.transactionId': 1 });
orderSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 1800, 
  partialFilterExpression: { paymentStatus: 'pending' } 
});

// Validate total calculation before saving
orderSchema.pre('save', function(next) {
  const calculatedTotal = this.subtotal + this.shippingCost + this.tax - this.discount;
  
  if (Math.abs(calculatedTotal - this.total) > 0.02) {
    return next(new Error('Order total mismatch'));
  }
  
  // Round all monetary values
  this.subtotal = Math.round(this.subtotal * 100) / 100;
  this.shippingCost = Math.round(this.shippingCost * 100) / 100;
  this.tax = Math.round(this.tax * 100) / 100;
  this.discount = Math.round(this.discount * 100) / 100;
  this.total = Math.round(this.total * 100) / 100;
  
  next();
});

orderSchema.pre('find', function() {
  monitorQuery('Order', 'find', this.getQuery());
});

orderSchema.pre('findOne', function() {
  monitorQuery('Order', 'findOne', this.getQuery());
});

module.exports = mongoose.model('Order', orderSchema);

