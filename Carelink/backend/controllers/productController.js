// backend/controllers/productController.js (CareLink Clinic)

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sanitize = (v, max = 2000) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

async function resolveCategory(input) {
  if (!input) return null;

  // id
  if (isValidObjectId(input)) {
    return await Category.findById(input).lean();
  }

  // slug or name
  const q = sanitize(String(input), 100);
  return await Category.findOne({
    $or: [{ slug: q.toLowerCase() }, { name: q }]
  }).lean();
}

/**
 * GET /api/products
 * Public: list services
 * Query: department (id/slug/name), search, page, limit
 */
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, department, search } = req.query;

    const query = { isActive: true };

    if (department) {
      const dept = await resolveCategory(department);
      if (dept) query.category = dept._id; // ObjectId reference
    }

    if (search) {
      const term = sanitize(search, 100);
      if (term.length >= 2) {
        query.$or = [
          { name: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } }
        ];
      }
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .populate('category', '_id name slug isActive')
      .select('-__v')
      .lean();

    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
          total
        }
      }
    });
  } catch (err) {
    console.error('❌ getProducts:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/products/:id
 * Public: single service
 */
exports.getProduct = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const product = await Product.findOne({ _id: req.params.id, isActive: true })
      .populate('category', '_id name slug isActive')
      .select('-__v')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    return res.status(200).json({ success: true, data: { product } });
  } catch (err) {
    console.error('❌ getProduct:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/products (Admin)
 * Create a service
 * Required: name, description, price, category (id/slug/name)
 * Optional: durationMinutes
 */
exports.createProduct = async (req, res) => {
  try {
    const name = sanitize(req.body.name, 200);
    const description = sanitize(req.body.description, 2000);
    const price = Number(req.body.price);
    const categoryInput = req.body.category;
    const durationMinutes =
      req.body.durationMinutes !== undefined ? Number(req.body.durationMinutes) : undefined;

    if (!name || !description || !Number.isFinite(price) || !categoryInput) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const dept = await resolveCategory(categoryInput);
    if (!dept || dept.isActive === false) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const service = await Product.create({
      name,
      description,
      price,
      category: dept._id,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : undefined,
      isActive: true
    });

    return res.status(201).json({ success: true, data: { product: service } });
  } catch (err) {
    console.error('❌ createProduct:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/products/:id (Admin)
 * Update service fields
 */
exports.updateProduct = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const update = {};

    if (req.body.name !== undefined) update.name = sanitize(req.body.name, 200);
    if (req.body.description !== undefined) update.description = sanitize(req.body.description, 2000);
    if (req.body.price !== undefined) {
      const p = Number(req.body.price);
      if (!Number.isFinite(p)) return res.status(400).json({ success: false, message: 'Invalid price' });
      update.price = p;
    }
    if (req.body.durationMinutes !== undefined) {
      const d = Number(req.body.durationMinutes);
      if (!Number.isFinite(d)) return res.status(400).json({ success: false, message: 'Invalid durationMinutes' });
      update.durationMinutes = d;
    }
    if (req.body.isActive !== undefined) update.isActive = req.body.isActive === true || req.body.isActive === 'true';

    if (req.body.category !== undefined) {
      const dept = await resolveCategory(req.body.category);
      if (!dept || dept.isActive === false) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }
      update.category = dept._id;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    })
      .populate('category', '_id name slug isActive')
      .select('-__v')
      .lean();

    if (!product) return res.status(404).json({ success: false, message: 'Service not found' });

    return res.status(200).json({ success: true, data: { product } });
  } catch (err) {
    console.error('❌ updateProduct:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/products/:id (Admin)
 */
exports.deleteProduct = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Service not found' });

    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('❌ deleteProduct:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Optional aliases if your frontend ever calls /api/services
exports.getServices = exports.getProducts;
exports.getService = exports.getProduct;
