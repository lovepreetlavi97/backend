const slugify = require("slugify");
const { CuratedCollection, Product } = require("../models");
const { create, findOne, findMany, findAndUpdate, deleteOne } = require("../services/mysql/mysqlService");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const { cacheUtils } = require("../config/redis");
const { uploadToSpaces } = require("../middlewares/uploadMiddleware");

/**
 * CREATE
 */
const createCuratedCollection = async (req, res) => {
  try {
    const { name, filters, position = 0, isActive = true } = req.body;

    if (!name || !filters) {
      return errorResponse(res, 400, "Name and filters are required");
    }

    const curatedData = {
      name,
      slug: slugify(name, { lower: true, strict: true }),
      filters: typeof filters === 'string' ? JSON.parse(filters) : filters,
      position: Number(position),
      isActive: isActive === "true" || isActive === true,
      createdBy: req.user ? (req.user.id || req.user._id) : null
    };

    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      curatedData.image = await uploadToSpaces(buffer, originalname, mimetype);
    }
    
    if (req.body.productIds) {
      curatedData.productIds = typeof req.body.productIds === 'string' ? JSON.parse(req.body.productIds) : req.body.productIds;
    }

    const curated = await create(CuratedCollection, curatedData);

    await cacheUtils.delPattern("curated_*");

    return successResponse(res, 201, "Curated collection created", { curated });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * GET ALL
 */
const getAllCuratedCollections = async (req, res) => {
  try {
    const curated = await findMany(CuratedCollection, {
      isDeleted: false
    }, null, { sort: { position: 1 } });

    return successResponse(res, 200, "Curated collections fetched", { curated });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * GET BY ID
 */
const getCuratedCollectionById = async (req, res) => {
  try {
    const curated = await findOne(CuratedCollection, {
      id: req.params.id,
      isDeleted: false
    });

    if (!curated) {
      return errorResponse(res, 404, "Curated collection not found");
    }

    return successResponse(res, 200, "Curated collection fetched", { curated });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * UPDATE
 */
const updateCuratedCollectionById = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.filters && typeof updateData.filters === 'string') {
      updateData.filters = JSON.parse(updateData.filters);
    }

    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      updateData.image = await uploadToSpaces(buffer, originalname, mimetype);
    }
    
    if (updateData.productIds && typeof updateData.productIds === 'string') {
       updateData.productIds = JSON.parse(updateData.productIds);
    }

    if (req.user) {
      updateData.updatedBy = req.user.id || req.user._id;
    }

    const curated = await findAndUpdate(
      CuratedCollection,
      { id: req.params.id },
      updateData
    );

    if (!curated) {
      return errorResponse(res, 404, "Curated collection not found");
    }

    await cacheUtils.delPattern("curated_*");

    return successResponse(res, 200, "Curated collection updated", { curated });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * DELETE (SOFT)
 */
const deleteCuratedCollectionById = async (req, res) => {
  try {
    await findAndUpdate(CuratedCollection, { id: req.params.id }, {
      isDeleted: true
    });

    await cacheUtils.delPattern("curated_*");

    return successResponse(res, 200, "Curated collection deleted");
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * TOGGLE STATUS
 */
const toggleCuratedCollectionStatus = async (req, res) => {
  try {
    const curated = await findOne(CuratedCollection, { id: req.params.id });

    if (!curated) {
      return errorResponse(res, 404, "Curated collection not found");
    }

    const updated = await findAndUpdate(
      CuratedCollection, 
      { id: req.params.id }, 
      { isActive: !curated.isActive }
    );

    await cacheUtils.delPattern("curated_*");

    return successResponse(
      res,
      200,
      `Curated collection ${updated.isActive ? "activated" : "deactivated"}`,
      { curated: updated }
    );
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * PUBLIC: GET ACTIVE COLLECTIONS (for navbar + product form dropdown)
 */
const getPublicCollections = async (req, res) => {
  try {
    const collections = await findMany(CuratedCollection, {
      isActive: true,
      isDeleted: false
    }, null, { sort: { position: 1 } });

    return successResponse(res, 200, "Collections fetched", { collections });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * USER: GET PRODUCTS BY CURATED COLLECTION
 */
const getCuratedCollectionProducts = async (req, res) => {
  try {
    const curated = await findOne(CuratedCollection, {
      slug: req.params.slug,
      isActive: true,
      isDeleted: false
    });

    if (!curated) {
      return errorResponse(res, 404, "Curated collection not found");
    }

    // Explicit product ids if present
    const productIds = curated.productIds || [];
    const explicitProducts = productIds.length
      ? await findMany(Product, { id: { $in: productIds }, isBlocked: false }, null, { limit: 40 })
      : [];

    // Query by collectionId
    const reverseProducts = await findMany(Product, {
      collectionId: curated.id,
      isBlocked: false
    }, null, { limit: 40 });

    // Filter query
    const f = curated.filters || {};
    const filterQuery = { isBlocked: false, isDeleted: false };
    if (f.categoryIds?.length) filterQuery.categoryId = { $in: f.categoryIds };
    if (f.subcategoryIds?.length) filterQuery.subcategoryId = { $in: f.subcategoryIds };

    const filteredProducts = await findMany(Product, filterQuery, null, { limit: 40 });

    // Merge and deduplicate
    const seen = new Set();
    const products = [...explicitProducts, ...reverseProducts, ...filteredProducts].filter(p => {
      const id = (p.id || p._id).toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return successResponse(res, 200, "Curated products fetched", {
      curated,
      products
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  createCuratedCollection,
  getAllCuratedCollections,
  getCuratedCollectionById,
  updateCuratedCollectionById,
  deleteCuratedCollectionById,
  toggleCuratedCollectionStatus,
  getCuratedCollectionProducts,
  getPublicCollections
};
