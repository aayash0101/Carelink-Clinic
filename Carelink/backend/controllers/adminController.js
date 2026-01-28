const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');
const { logSecurityEvent } = require('../utils/logger');

// 🛡️ SECURITY HELPERS
const MAX_STRING_LENGTH = 200;
const MAX_COUPON_CODE = 20;

const sanitizeInput = (input, maxLength = MAX_STRING_LENGTH) => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '').substring(0, maxLength);
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateNumber = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = Number(value);
  return Number.isFinite(num) && num >= min && num <= max ? num : null;
};

// ==========================================
// DASHBOARD ANALYTICS
// ==========================================
exports.getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueData] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ paymentStatus: 'completed' }),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
      ])
    ]);

    const [recentOrders, topProducts] = await Promise.all([
      Order.find({ paymentStatus: 'completed' })
        .populate('user', 'name email')
        .sort('-createdAt')
        .limit(10)
        .select('orderNumber total orderStatus createdAt')
        .lean(),
      Product.find({ isActive: true })
        .sort('-stock')
        .limit(10)
        .select('name price stock category')
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: revenueData[0]?.totalRevenue || 0
        },
        recentOrders,
        topProducts
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
};

// ==========================================
// CATEGORY MANAGEMENT
// ==========================================
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort('-createdAt').lean();
    res.status(200).json({ success: true, data: { categories } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name required' });
    }

    const safeName = sanitizeInput(name, 100);
    if (safeName.length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }

    const existing = await Category.findOne({ name: safeName });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({
      name: safeName,
      isActive: isActive !== false
    });

    logSecurityEvent('CATEGORY_CREATED', { 
      adminId: req.user._id, 
      categoryId: category._id, 
      name: safeName 
    });

    res.status(201).json({ success: true, data: { category } });
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(400).json({ success: false, message: 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const { name, isActive } = req.body;
    const updateData = {};
    
    if (name) {
      const safeName = sanitizeInput(name, 100);
      if (safeName.length < 2) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
      }
      updateData.name = safeName;
    }
    
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    logSecurityEvent('CATEGORY_UPDATED', { 
      adminId: req.user._id, 
      categoryId: category._id 
    });

    res.status(200).json({ success: true, data: { category } });
  } catch (error) {
    console.error('Update Category Error:', error);
    res.status(400).json({ success: false, message: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Prevent deletion if products exist
    const productsCount = await Product.countDocuments({ category: category.name });
    if (productsCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category with ${productsCount} product(s). Remove products first.` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    logSecurityEvent('CATEGORY_DELETED', { 
      adminId: req.user._id, 
      categoryId: req.params.id,
      name: category.name
    });

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};

// ==========================================
// USER MANAGEMENT
// ==========================================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('name email role isActive isEmailVerified createdAt lastLogin')
      .sort('-createdAt')
      .lean();
    
    res.status(200).json({ success: true, count: users.length, data: { users } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const { role, isActive } = req.body;

    // Prevent self-modification
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot modify your own account' 
      });
    }

    const updateData = {};
    if (role && ['user', 'admin'].includes(role)) {
      updateData.role = role;
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password -passwordHistory');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    logSecurityEvent('USER_UPDATED_BY_ADMIN', { 
      adminId: req.user._id, 
      targetUserId: user._id,
      changes: updateData
    });

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(400).json({ success: false, message: 'Failed to update user' });
  }
};

// ==========================================
// ORDER MANAGEMENT
// ==========================================
exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status && ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      filter.orderStatus = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    res.status(200).json({ 
      success: true, 
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: { orders } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

exports.updateOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!isValidObjectId(req.params.id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const { orderStatus, trackingNumber } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(orderStatus)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Handle status changes
    if (orderStatus === 'delivered' && order.orderStatus !== 'delivered') {
      order.deliveredAt = new Date();
    }

    // Restore stock if cancelling
    if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
      if (order.paymentStatus === 'completed') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
      }
      order.cancelledAt = new Date();
      order.cancelledReason = 'Cancelled by admin';
    }

    order.orderStatus = orderStatus;
    if (trackingNumber) {
      order.trackingNumber = sanitizeInput(trackingNumber, 50);
    }

    await order.save({ session });
    await session.commitTransaction();

    logSecurityEvent('ORDER_STATUS_UPDATED', { 
      adminId: req.user._id, 
      orderId: order._id,
      newStatus: orderStatus
    });

    res.status(200).json({ success: true, data: { order } });

  } catch (error) {
    await session.abortTransaction();
    console.error('Update Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order' });
  } finally {
    session.endSession();
  }
};

// ==========================================
// COUPON MANAGEMENT
// ==========================================


exports.createCoupon = async (req, res) => {
  try {
    const { code, type, value, expiresAt, minOrderValue, usageLimit, oneTimeUse } = req.body;

    // Validation
    if (!code || !type || value === undefined || !expiresAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: code, type, value, expiresAt' 
      });
    }

    const cleanCode = sanitizeInput(code, MAX_COUPON_CODE).toUpperCase();
    if (cleanCode.length < 4 || !/^[A-Z0-9]+$/.test(cleanCode)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code must be 4-20 alphanumeric characters' 
      });
    }

    if (!['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type must be percentage or fixed' 
      });
    }

    const validValue = validateNumber(value, 0, type === 'percentage' ? 100 : 1000000);
    if (validValue === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid value' 
      });
    }

    const expiryDate = new Date(expiresAt);
    if (expiryDate <= new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Expiration date must be in the future' 
      });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      type,
      value: validValue,
      expiresAt: expiryDate,
      minOrderValue: validateNumber(minOrderValue, 0) || 0,
      usageLimit: validateNumber(usageLimit, 1, 100000) || 100,
      oneTimeUse: Boolean(oneTimeUse),
      createdBy: req.user._id
    });

    logSecurityEvent('COUPON_CREATED', { 
      adminId: req.user._id, 
      couponId: coupon._id, 
      code: coupon.code 
    });

    res.status(201).json({ success: true, data: { coupon } });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon code already exists' 
      });
    }
    console.error('Create Coupon Error:', error);
    res.status(400).json({ success: false, message: 'Failed to create coupon' });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    // 🛡️ Filter the body to only allowed fields
    const { code, type, value, minOrderValue, usageLimit, oneTimeUse, isActive, expiresAt } = req.body;

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { 
        $set: { 
          code: code?.toUpperCase(), 
          type, 
          value, 
          minOrderValue, 
          usageLimit, 
          oneTimeUse, 
          isActive, 
          expiresAt 
        } 
      },
      { new: true, runValidators: true }
    );

    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    res.status(200).json({ success: true, data: { coupon } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get Coupons with Usage Detail for Admin
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate('usedBy.user', 'name email') // Show who used it
      .populate('usedBy.appliedProducts', 'name') // Show on which products
      .sort('-createdAt');
      
    res.json({ success: true, data: { coupons } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
exports.deleteCoupon = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid coupon ID' });
    }

    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    logSecurityEvent('COUPON_DELETED', { 
      adminId: req.user._id, 
      couponId: req.params.id,
      code: coupon.code
    });

    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
};