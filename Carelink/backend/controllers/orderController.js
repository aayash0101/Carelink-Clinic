// const Order = require('../models/Order');
// const Cart = require('../models/Cart');
// const Product = require('../models/Product');
// const Coupon = require('../models/Coupon');
// const mongoose = require('mongoose');
// const { logSecurityEvent } = require('../utils/logger');

// // Security Sanitizer
// const sanitizeInput = (str, limit) => str ? str.toString().replace(/[<>]/g, '').substring(0, limit) : '';

// // @desc    Step 1: Create PENDING order (Verification Only)
// exports.prepareOrder = async (req, res) => {
//   try {
//     const { shippingAddress, paymentMethod, couponCode, notes } = req.body;
//     const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({ success: false, message: 'Cart is empty' });
//     }

//     let subtotal = 0;
//     const orderItems = [];

//     // Verify stock and re-calculate price from DB (Hack-proof)
//     for (const item of cart.items) {
//       const product = await Product.findOne({ _id: item.product._id, isActive: true });
//       if (!product || product.stock < item.quantity) {
//         return res.status(400).json({ success: false, message: `Insufficient stock for ${item.product.name}` });
//       }
//       subtotal += product.price * item.quantity;
//       orderItems.push({
//         product: product._id,
//         name: product.name,
//         price: product.price,
//         quantity: item.quantity,
//         image: product.images[0] || '',
//         variant: item.variant || {}
//       });
//     }

//     const shippingCost = subtotal > 5000 ? 0 : 150;
//     const tax = Math.round(subtotal * 0.13);
//     let discount = 0;
//     let couponData = null;

//     // Secure Coupon Check
//     if (couponCode) {
//       const coupon = await Coupon.findOne({
//         code: couponCode.toUpperCase(),
//         isActive: true,
//         expiresAt: { $gt: new Date() },
//         usageLimit: { $gt: 0 }
//       });
//       if (coupon) {
//         // Check one-time use
//         const alreadyUsed = await Order.findOne({ user: req.user._id, 'coupon.code': coupon.code, paymentStatus: 'completed' });
//         if (!coupon.oneTimeUse || !alreadyUsed) {
//           discount = coupon.type === 'percentage' ? (subtotal * coupon.value / 100) : coupon.value;
//           couponData = { code: coupon.code, discountAmount: Math.round(discount) };
//         }
//       }
//     }

//     const total = (subtotal + shippingCost + tax) - discount;

//     const order = await Order.create({
//       orderNumber: `LUX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
//       user: req.user._id,
//       items: orderItems,
//       shippingAddress,
//       paymentMethod: paymentMethod || 'esewa',
//       subtotal, shippingCost, tax, discount, total,
//       coupon: couponData,
//       notes: sanitizeInput(notes, 500),
//       paymentStatus: 'pending'
//     });

//     res.status(201).json({ success: true, data: order });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Preparation failed' });
//   }
// };

// // @desc    Step 2: Confirm Order (Deducts Stock & Coupons)
// // @note    This is called by your Payment Success Callback (eSewa Success)
// exports.confirmOrderInternal = async (orderId, paymentDetails, session) => {
//   const order = await Order.findById(orderId).session(session);
//   if (!order || order.paymentStatus === 'completed') return order;

//   // 1. ATOMIC Stock reduction logic... (Keep your existing stock logic)
//   for (const item of order.items) {
//     const updatedProduct = await Product.findOneAndUpdate(
//       { _id: item.product, stock: { $gte: item.quantity } },
//       { $inc: { stock: -item.quantity } },
//       { session, new: true }
//     );
//     if (!updatedProduct) throw new Error(`Stock ran out for ${item.name}`);
//   }

//   // 🛡️ 2. UPDATED COUPON LOGIC
//   if (order.coupon && order.coupon.code) {
//     const coupon = await Coupon.findOne({ code: order.coupon.code }).session(session);
    
//     if (coupon) {
//       // Final security check: Is there still room in the limit?
//       if (coupon.usageLimit <= 0) {
//         throw new Error("Coupon usage limit reached during processing.");
//       }

//       // Record the usage details
//       await Coupon.findByIdAndUpdate(coupon._id, {
//         $inc: { usageLimit: -1 }, // Decrease available uses
//         $push: { 
//           usedBy: { 
//             user: order.user, 
//             orderId: order._id,
//             appliedProducts: order.items.map(i => i.product) // Tracking which products got the discount
//           } 
//         }
//       }, { session });
//     }
//   }

//   // 3. Update Order Status
//   order.paymentStatus = 'completed';
//   order.orderStatus = 'confirmed';
//   order.paymentResult = { transactionId: paymentDetails.transactionId, paidAt: new Date() };
  
//   await order.save({ session });
//   await Cart.findOneAndUpdate({ user: order.user }, { $set: { items: [] } }, { session });

//   return order;
// };

// exports.getMyOrders = async (req, res) => {
//   try {
//     // 🛡️ SECURITY: Hide unpaid/ghost orders from history
//     const orders = await Order.find({ 
//       user: req.user._id, 
//       paymentStatus: { $ne: 'pending' } 
//     }).sort('-createdAt');
//     res.status(200).json({ success: true, data: { orders } });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };

// exports.getOrder = async (req, res) => {
//   try {
//     const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('items.product');
//     if (!order) return res.status(404).json({ success: false, message: 'Not found' });
//     res.status(200).json({ success: true, data: order });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };

// exports.cancelOrder = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).session(session);
//     if (!order || ['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
//       throw new Error('Cannot cancel this order');
//     }
//     // Restore stock if it was previously deducted
//     if (order.paymentStatus === 'completed') {
//       for (const item of order.items) {
//         await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, { session });
//       }
//     }
//     order.orderStatus = 'cancelled';
//     order.cancelledAt = new Date();
//     await order.save({ session });
//     await session.commitTransaction();
//     res.json({ success: true, message: 'Order cancelled' });
//   } catch (err) {
//     await session.abortTransaction();
//     res.status(400).json({ success: false, message: err.message });
//   } finally { session.endSession(); }
// };

// // exports.verifyCoupon = async (req, res) => {
// //   try {
// //     const { couponCode, cartTotal } = req.body;
// //     const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() }, usageLimit: { $gt: 0 } });
// //     if (!coupon) return res.status(400).json({ success: false, message: 'Invalid or expired' });
// //     if (cartTotal < coupon.minOrderValue) return res.status(400).json({ success: false, message: `Min Rs. ${coupon.minOrderValue} required` });
    
// //     let discount = coupon.type === 'percentage' ? (cartTotal * coupon.value / 100) : coupon.value;
// //     res.json({ success: true, data: { code: coupon.code, discount, newTotal: cartTotal - discount } });
// //   } catch (e) { res.status(500).json({ success: false }); }
// // };




// // Replace verifyCoupon in orderController.js

// exports.verifyCoupon = async (req, res) => {
//   try {
//     const { couponCode, cartTotal } = req.body;
    
//     if (!couponCode || !cartTotal) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Coupon code and cart total required' 
//       });
//     }

//     // 1. Find coupon (no user population needed)
//     const coupon = await Coupon.findOne({
//       code: couponCode.toUpperCase(),
//       isActive: true,
//       expiresAt: { $gt: new Date() },
//       usageLimit: { $gt: 0 }
//     }).lean(); // ✅ Use .lean() to get plain object

//     if (!coupon) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid or expired coupon' 
//       });
//     }

//     // 2. Check minimum order value
//     if (cartTotal < coupon.minOrderValue) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Minimum order value of Rs. ${coupon.minOrderValue} required` 
//       });
//     }

//     // 3. Check if user already used (one-time coupons only)
//     if (coupon.oneTimeUse) {
//       // ✅ FIX: Don't populate user, just check existence
//       const alreadyUsed = await Order.exists({ 
//         user: req.user._id, 
//         'coupon.code': coupon.code, 
//         paymentStatus: 'completed' 
//       });

//       if (alreadyUsed) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'You have already used this coupon' 
//         });
//       }
//     }

//     // 4. Calculate discount
//     let discount = coupon.type === 'percentage' 
//       ? (cartTotal * coupon.value / 100) 
//       : coupon.value;

//     // 5. Apply max discount cap (if set)
//     if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
//       discount = coupon.maxDiscount;
//     }

//     // 6. Ensure discount doesn't exceed cart total
//     if (discount > cartTotal) {
//       discount = cartTotal;
//     }

//     const newTotal = Math.max(0, cartTotal - discount);

//     res.json({ 
//       success: true, 
//       data: { 
//         code: coupon.code, 
//         discount: Math.round(discount), 
//         newTotal: Math.round(newTotal) 
//       } 
//     });

//   } catch (error) {
//     console.error('Coupon verification error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to verify coupon' 
//     });
//   }
// };
















































const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');
const { logSecurityEvent } = require('../utils/logger');

// Security Sanitizer
const sanitizeInput = (str, limit) => str ? str.toString().replace(/[<>]/g, '').substring(0, limit) : '';

// @desc    Step 1: Create PENDING order (Verification Only)
exports.prepareOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, couponCode, notes } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    let subtotal = 0;
    const orderItems = [];

    // Verify stock and re-calculate price from DB (Hack-proof)
    for (const item of cart.items) {
      const product = await Product.findOne({ _id: item.product._id, isActive: true });
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.product.name}` });
      }
      subtotal += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || '',
        variant: item.variant || {}
      });
    }

    const shippingCost = subtotal > 5000 ? 0 : 150;
    const tax = Math.round(subtotal * 0.13);
    let discount = 0;
    let couponData = null;

    // Secure Coupon Check
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiresAt: { $gt: new Date() },
        usageLimit: { $gt: 0 }
      });
      if (coupon) {
        // Check one-time use
        const alreadyUsed = await Order.findOne({ user: req.user._id, 'coupon.code': coupon.code, paymentStatus: 'completed' });
        if (!coupon.oneTimeUse || !alreadyUsed) {
          discount = coupon.type === 'percentage' ? (subtotal * coupon.value / 100) : coupon.value;
          couponData = { code: coupon.code, discountAmount: Math.round(discount) };
        }
      }
    }

    const total = (subtotal + shippingCost + tax) - discount;

    const order = await Order.create({
      orderNumber: `LUX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'esewa',
      subtotal, shippingCost, tax, discount, total,
      coupon: couponData,
      notes: sanitizeInput(notes, 500),
      paymentStatus: 'pending'
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Preparation failed' });
  }
};

// @desc    Step 2: Confirm Order (Deducts Stock & Coupons)
// @note    This is called by your Payment Success Callback (eSewa Success)
exports.confirmOrderInternal = async (orderId, paymentDetails, session) => {
  const order = await Order.findById(orderId).session(session);
  if (!order || order.paymentStatus === 'completed') return order;

  // 1. ATOMIC Stock reduction logic... (Keep your existing stock logic)
  for (const item of order.items) {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { session, new: true }
    );
    if (!updatedProduct) throw new Error(`Stock ran out for ${item.name}`);
  }

 if (order.coupon && order.coupon.code) {
    const couponUpdate = await Coupon.findOneAndUpdate(
      { 
        code: order.coupon.code,
        usageLimit: { $gt: 0 }, // ✅ Ensure limit still available
        isActive: true
      },
      { 
        $inc: { usageLimit: -1 },
        $push: { 
          usedBy: { 
            user: order.user, 
            orderId: order._id,
            appliedProducts: order.items.map(i => i.product),
            usedAt: new Date()
          } 
        }
      },
      { session, new: true }
    );

    // ✅ If coupon ran out during processing, abort
    if (!couponUpdate) {
      throw new Error("Coupon usage limit reached during processing.");
    }
  }


  // 3. Update Order Status
  order.paymentStatus = 'completed';
  order.orderStatus = 'confirmed';
  order.paymentResult = { transactionId: paymentDetails.transactionId, paidAt: new Date() };
  
  await order.save({ session });
  await Cart.findOneAndUpdate({ user: order.user }, { $set: { items: [] } }, { session });

  return order;
};

exports.getMyOrders = async (req, res) => {
  try {
    // 🛡️ SECURITY: Hide unpaid/ghost orders from history
    const orders = await Order.find({ 
      user: req.user._id, 
      paymentStatus: { $ne: 'pending' } 
    }).sort('-createdAt');
    res.status(200).json({ success: true, data: { orders } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// controllers/orderController.js - Line 180
exports.getOrder = async (req, res) => {
  try {
    // ✅ ENHANCED: Verify ownership + valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user._id, // ✅ Prevents IDOR
      paymentStatus: { $ne: 'pending' }
    }).populate('items.product');
    
    if (!order) {
      logSecurityEvent('IDOR_ATTEMPT', { 
        userId: req.user._id, 
        orderId: req.params.id,
        ip: req.ip
      });
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).session(session);
    if (!order || ['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      throw new Error('Cannot cancel this order');
    }
    // Restore stock if it was previously deducted
    if (order.paymentStatus === 'completed') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, { session });
      }
    }
    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    await order.save({ session });
    await session.commitTransaction();
    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally { session.endSession(); }
};


exports.verifyCoupon = async (req, res) => {
  try {
    const { couponCode, cartTotal } = req.body;
    
    if (!couponCode || !cartTotal) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon code and cart total required' 
      });
    }

    // 1. Find coupon (no user population needed)
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
      usageLimit: { $gt: 0 }
    }).lean(); // ✅ Use .lean() to get plain object

    if (!coupon) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired coupon' 
      });
    }

    // 2. Check minimum order value
    if (cartTotal < coupon.minOrderValue) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum order value of Rs. ${coupon.minOrderValue} required` 
      });
    }

    // 3. Check if user already used (one-time coupons only)
    if (coupon.oneTimeUse) {
      // ✅ FIX: Don't populate user, just check existence
      const alreadyUsed = await Order.exists({ 
        user: req.user._id, 
        'coupon.code': coupon.code, 
        paymentStatus: 'completed' 
      });

      if (alreadyUsed) {
        return res.status(400).json({ 
          success: false, 
          message: 'You have already used this coupon' 
        });
      }
    }

    // 4. Calculate discount
    let discount = coupon.type === 'percentage' 
      ? (cartTotal * coupon.value / 100) 
      : coupon.value;

    // 5. Apply max discount cap (if set)
    if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    // 6. Ensure discount doesn't exceed cart total
    if (discount > cartTotal) {
      discount = cartTotal;
    }

    const newTotal = Math.max(0, cartTotal - discount);

    res.json({ 
      success: true, 
      data: { 
        code: coupon.code, 
        discount: Math.round(discount), 
        newTotal: Math.round(newTotal) 
      } 
    });

  } catch (error) {
    console.error('Coupon verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify coupon' 
    });
  }
};