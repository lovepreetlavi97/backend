const slugify = require("slugify");
const { CuratedCollection, Product } = require("../models");
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
      filters: JSON.parse(filters),
      position,
      isActive: isActive === "true" || isActive === true,
      createdBy: req.user._id
    };

    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      curatedData.image = await uploadToSpaces(buffer, originalname, mimetype);
    }
    
    if (req.body.productIds) {
      curatedData.productIds = JSON.parse(req.body.productIds);
    }

    const curated = await CuratedCollection.create(curatedData);

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
    const curated = await CuratedCollection.find({
      isDeleted: false
    }).sort({ position: 1 });

    return successResponse(res, 200, "Curated collections fetched", { curated });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * GET BY ID
 */
const getCuratedCollectionById = async (req, res) => {
  const curated = await CuratedCollection.findOne({
    _id: req.params.id,
    isDeleted: false
  });

  if (!curated) {
    return errorResponse(res, 404, "Curated collection not found");
  }

  return successResponse(res, 200, "Curated collection fetched", { curated });
};

/**
 * UPDATE
 */
const updateCuratedCollectionById = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.filters) {
      updateData.filters = JSON.parse(updateData.filters);
    }

    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      updateData.image = await uploadToSpaces(buffer, originalname, mimetype);
    }
    
    if (updateData.productIds) {
       updateData.productIds = JSON.parse(req.body.productIds);
    }

    updateData.updatedBy = req.user._id;

    const curated = await CuratedCollection.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
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
  await CuratedCollection.findByIdAndUpdate(req.params.id, {
    isDeleted: true
  });

  await cacheUtils.delPattern("curated_*");

  return successResponse(res, 200, "Curated collection deleted");
};

/**
 * TOGGLE STATUS
 */
const toggleCuratedCollectionStatus = async (req, res) => {
  const curated = await CuratedCollection.findById(req.params.id);

  if (!curated) {
    return errorResponse(res, 404, "Curated collection not found");
  }

  curated.isActive = !curated.isActive;
  await curated.save();

  await cacheUtils.delPattern("curated_*");

  return successResponse(
    res,
    200,
    `Curated collection ${curated.isActive ? "activated" : "deactivated"}`,
    { curated }
  );
};

/**
 * PUBLIC: GET ACTIVE COLLECTIONS (for navbar + product form dropdown)
 */
const getPublicCollections = async (req, res) => {
  try {
    const collections = await CuratedCollection.find({
      isActive: true,
      isDeleted: false
    })
      .select("_id name slug")
      .sort({ position: 1 });

    return successResponse(res, 200, "Collections fetched", { collections });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * USER: GET PRODUCTS BY CURATED COLLECTION
 */
const getCuratedCollectionProducts = async (req, res) => {
  const curated = await CuratedCollection.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false
  });

  if (!curated) {
    return errorResponse(res, 404, "Curated collection not found");
  }

  // Manual assignment from productIds array in collection model
  const explicitProducts = curated.productIds?.length
    ? await Product.find({ _id: { $in: curated.productIds }, isBlocked: false }).limit(40)
    : [];

  // Query by reverse collectionIds assignment (legacy)
  const reverseProducts = await Product.find({
    collectionIds: curated._id,
    isBlocked: false
  }).limit(40);

  // Also query by filters
  const f = curated.filters || {};
  const filterQuery = { isBlocked: false };
  if (f.categoryIds?.length) filterQuery.categoryId = { $in: f.categoryIds };
  if (f.subcategoryIds?.length) filterQuery.subcategoryId = { $in: f.subcategoryIds };
  if (f.relationIds?.length) filterQuery.relationIds = { $in: f.relationIds };
  if (f.festivalIds?.length) filterQuery.festivalIds = { $in: f.festivalIds };
  if (f.priceRange?.min || f.priceRange?.max) {
    filterQuery.discountedPrice = {};
    if (f.priceRange.min) filterQuery.discountedPrice.$gte = f.priceRange.min;
    if (f.priceRange.max) filterQuery.discountedPrice.$lte = f.priceRange.max;
  }

  const filteredProducts = Object.keys(filterQuery).length > 1
    ? await Product.find(filterQuery).limit(40)
    : [];

  // Merge and deduplicate
  const seen = new Set();
  const products = [...explicitProducts, ...reverseProducts, ...filteredProducts].filter(p => {
    const id = p._id.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return successResponse(res, 200, "Curated products fetched", {
    curated,
    products
  });
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
