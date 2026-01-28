// controllers/categoryController.js
const Category = require('../models/Category');

// ✅ Public: list active departments
exports.getPublicDepartments = async (req, res) => {
  try {
    const departments = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .select('_id name slug isActive createdAt updatedAt');

    return res.json({
      success: true,
      data: { departments }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Alias (optional) — if some parts of frontend call "categories"
exports.getPublicCategories = exports.getPublicDepartments;

// Your existing functions (keep as-is)
exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Department already exists' });
    }

    const dept = await Category.create({
      name: name.trim(),
    });

    return res.status(201).json({
      success: true,
      data: { department: dept }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const dept = await Category.findByIdAndUpdate(
      id,
      { name: name?.trim() },
      { new: true, runValidators: true }
    );

    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

    return res.json({ success: true, data: { department: dept } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const dept = await Category.findByIdAndDelete(id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

    return res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
