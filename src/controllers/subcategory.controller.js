const { SubCategory, Category, Product } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { uploadToSpaces } = require("../middlewares/uploadMiddleware");
const { cacheUtils } = require("../config/redis");
const { isValidId } = require("../utils/idUtils");

const createSubcategory = async (req, res) => {
  try {
    const { name, category, categoryId, parentId, isFeatured, metalIds } = req.body;
    if (!name) {
      return errorResponse(res, 400, "Subcategory name is required");
    }

    const resolvedCategoryId = categoryId || category;

    if (resolvedCategoryId && !isValidId(resolvedCategoryId)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }

    if (resolvedCategoryId) {
      const categoryExists = await Category.findByPk(resolvedCategoryId);
      if (!categoryExists) {
        return errorResponse(res, 404, "Category not found");
      }
    }

    let imageKey = '';
    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      imageKey = await uploadToSpaces(buffer, originalname, mimetype);
    }

    const subcategoryData = {
      name,
      categoryId: resolvedCategoryId,
      parentId: parentId && isValidId(parentId) ? parentId : null,
      image: imageKey,
      isActive: true
    };

    const subcategory = await SubCategory.create(subcategoryData);
    await cacheUtils.clearPattern('category_menu_structure_*');
    await cacheUtils.clearPattern('categories_*');

    return successResponse(res, 201, messages.SUBCATEGORY_CREATED, { subcategory });
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

const getAllSubcategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, categoryId, category } = req.query;
    const resolvedCategoryId = categoryId || category;

    const where = {};
    if (resolvedCategoryId && isValidId(resolvedCategoryId)) {
      where.categoryId = resolvedCategoryId;
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: subcategories } = await SubCategory.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name'] }],
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    return successResponse(res, 200, messages.SUBCATEGORIES_RETRIEVED, {
      subcategories,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(count / parsedLimit)
      }
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid subcategory ID format");
    }

    const subcategory = await SubCategory.findByPk(id, {
      include: [{ model: Category, attributes: ['id', 'name'] }]
    });

    if (!subcategory) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

    return successResponse(res, 200, messages.SUBCATEGORY_RETRIEVED, { subcategory });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const updateSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, categoryId } = req.body;

    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid subcategory ID format");
    }

    const subcategory = await SubCategory.findByPk(id);
    if (!subcategory) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

    const updateData = {};
    if (name) updateData.name = name;

    const resolvedCategoryId = categoryId || category;
    if (resolvedCategoryId && isValidId(resolvedCategoryId)) {
      updateData.categoryId = resolvedCategoryId;
    }

    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      updateData.image = await uploadToSpaces(buffer, originalname, mimetype);
    }

    await subcategory.update(updateData);
    await cacheUtils.clearPattern('category_menu_structure_*');
    await cacheUtils.clearPattern('categories_*');

    return successResponse(res, 200, messages.SUBCATEGORY_UPDATED, { subcategory });
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

const toggleSubcategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid subcategory ID format");
    }

    const subcategory = await SubCategory.findByPk(id);
    if (!subcategory) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

    subcategory.isActive = !subcategory.isActive;
    await subcategory.save();

    return successResponse(res, 200, "Status updated successfully", { subcategory });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const deleteSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid subcategory ID format");
    }

    const subcategory = await SubCategory.findByPk(id);
    if (!subcategory) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

    const productsCount = await Product.count({ where: { subcategoryId: id } });
    if (productsCount > 0) {
      return errorResponse(res, 400, `Cannot delete subcategory. ${productsCount} active products are associated with it.`);
    }

    await subcategory.destroy();
    return successResponse(res, 200, messages.SUBCATEGORY_DELETED);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  createSubcategory,
  getAllSubcategories,
  getSubcategoryById,
  updateSubcategoryById,
  toggleSubcategoryStatus,
  deleteSubcategoryById
};