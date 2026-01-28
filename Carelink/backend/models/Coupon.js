const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: 100 }, // Total uses left
  oneTimeUse: { type: Boolean, default: false }, // Per customer
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 🛡️ NEW: Track every single use of this coupon
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    appliedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    usedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Virtual for remaining uses
couponSchema.virtual('remainingUses').get(function() {
  return this.usageLimit;
});

module.exports = mongoose.model('Coupon', couponSchema);