/**
 * @description - This function finds one document based on a condition.
 */
const findOne = async (model, condition, projection) => {
    return await model.findOne(condition, projection).lean();
};

/**
 * @description - This function finds multiple documents based on a condition.
 */
const findMany = async (model, condition, projection) => {
    return await model.find(condition, projection).lean();
};

/**
 * @description - This function finds one document and updates it.
 */
const findOneAndUpdate = async (model, condition, fields) => {
    return await model.findOneAndUpdate(condition, fields, { new: true });
};

/**
 * @description - This function updates multiple documents based on a condition.
 */
const updateMany = async (model, condition, fields) => {
    return await model.updateMany(condition, fields);
};

/**
 * @description - This function finds one document with sorting.
 */
const findOneWithSort = async (model, condition, projection, sort) => {
    return await model.findOne(condition, projection).sort(sort).lean();
};

/**
 * @description - This function creates a new document.
 */
const create = async (data) => {
    return await data.save();
};

/**
 * @description - This function finds one document and populates referenced documents.
 */
const findOneWithPopulate = async (model, condition, projection, populate) => {
    return await model.findOne(condition, projection).populate(populate).lean();
};

/**
 * @description - This function finds multiple documents and populates referenced documents.
 */
const findManyWithPopulate = async (model, condition, projection, populate) => {
    return await model.find(condition, projection).populate(populate).lean();
};

/**
 * @description - This function finds multiple documents with selected fields in populated documents.
 */
const findManyWithPopulateSelected = async (model, condition, projection, populate, selectFields) => {
    return await model.find(condition, projection)
        .populate({ path: populate, select: selectFields })
        .lean();
};

/**
 * @description - This function finds multiple documents and populates multiple fields.
 */
const findManyWithPopulateMultiple = async (model, condition, projection, populateFields) => {
    const populateQueries = populateFields.map(({ path, select }) => ({ path, select }));
    return await model.find(condition, projection).populate(populateQueries).lean();
};

/**
 * @description - This function retrieves aggregated data.
 */
const aggregateData = async (model, aggregate) => {
    return await model.aggregate(aggregate);
};

/**
 * @description - This function finds multiple documents with sorting and population.
 */
const findManyWithSortAndPopulate = async (model, condition, projection, sort, populate) => {
    return await model.find(condition, projection).populate(populate).sort(sort).lean();
};

/**
 * @description - This function finds multiple documents with sorting, skipping, limiting, and population.
 */
const findManyWithSortSkipLimitAndPopulate = async (model, condition, projection, sort, skip, limit, populate) => {
    return await model.find(condition, projection).populate(populate).sort(sort).skip(skip).limit(limit).lean();
};

/**
 * @description - This function finds multiple documents with sorting, skipping, and limiting.
 */
const findManyWithSortSkipAndLimit = async (model, condition, projection, sort, skip, limit) => {
    return await model.find(condition, projection).sort(sort).skip(skip).limit(limit).lean();
};

/**
 * @description - This function counts documents based on a condition.
 */
const countDocuments = async (model, condition) => {
    return await model.countDocuments(condition);
};

module.exports = {
    findOne,
    findMany,
    findOneAndUpdate,
    updateMany,
    findOneWithSort,
    create,
    findOneWithPopulate,
    findManyWithPopulate,
    aggregateData,
    findManyWithSortAndPopulate,
    countDocuments,
    findManyWithSortSkipLimitAndPopulate,
    findManyWithSortSkipAndLimit,
    findManyWithPopulateMultiple,
    findManyWithPopulateSelected,
};
