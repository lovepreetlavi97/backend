/**
 * @description - This function is find one query
 */
const findOneForAwait = async (model, condition,projection) => {
    //    console.log("model 123",model)
        const data = await model.findOne(condition,projection).lean();
        return data
}
/**
 * @description - This function is find many query
 */
const findManyForAwait = async (model, condition, projection) => {
      //  //console.log("model 123", model)
    const data = await model.find(condition, projection).lean();
    return data
}
/**
 * @description - This function is find one and update query
 */
const findOneAndUpdateForAwait = async (model, condition, feilds) => {
    console.log("model name",model)
     const updated= await model.findOneAndUpdate(condition,feilds);
     console.log(updated,"updated")
    return 
}

/**
 * @description - This function is find many and update query
 */
const findManyAndUpdateForAwait = async (model, condition, feilds) => {
    // console.log("model name", model)
    await model.updateMany(condition, feilds);
    return
}

/**
 * @description - This function is find one with sort query
 */
const findOneForAwaitWithSort = async (model, condition, projection,sort) => {
    const data = await model.findOne(condition, projection).sort(sort);
    return data
}
/**
 * @description - This function is used to insert new data 
 */
const createForAwait = async (data) => {
    await data.save();
    return
}

/**
 * @description - This function is find one with populate query
 */
const findOneForAwaitWithPopulate = async (model, condition, projection, populate) => {
    const data = await model.findOne(condition, projection).populate(populate).lean();
    return data
}

/**
 * @description - This function is find many with populate query
 */
const findManyForAwaitWithPopulate = async (model, condition, projection,populate) => {
      //  //console.log("model 123", model)
    const data = await model.find(condition, projection).populate(populate).lean();
    return data
}


const findManyForAwaitWithPopulateSelected = async (model, condition, projection, populate, selectFields) => {
      //  //console.log("model 123", model);
    const data = await model.find(condition, projection)
        .populate({ path: populate, select: selectFields })
        .lean();
    return data;
};

const findManyForAwaitWithPopulatemultiple = async (model, condition, projection, populateFields) => {
      //  //console.log("model 123", model);
    const populateQueries = populateFields.map(populate => ({
        path: populate.path,
        select: populate.select
    }));

    const data = await model.find(condition, projection)
        .populate(populateQueries)
        .lean();
    return data;
};

/**
 * @description - This function is for get aggregate data
 */
const getAggrgateDataForAwait = async (model, aggregate) => {
      //  //console.log("model 123", model)
    const data = await model.aggregate(aggregate);
    return data
}

/**
 * @description - This function is find many with sort skip and populate query
 */
const findManyForAwaitWithSortPopulate = async (model, condition, projection, sort,populate) => {
    // console.log("populate",condition,sort,populate);
    const data = await model.find(condition, projection).populate(populate).sort(sort);
    return data
}

/**
 * @description - This function is find many with sort skip limit and populate
 */
const findManyForAwaitWithSortSkipLimitPopulate = async (model, condition, projection, sort,skip,limit, populate) => {
    // console.log("populate", condition, sort, populate);
    const data = await model.find(condition, projection).populate(populate).sort(sort).skip(skip).limit(limit);
    return data
}

/**
 * @description - This function is find many with sort skip limit
 */
const findManyForAwaitWithSortSkipAndLimit = async (model, condition, projection, sort, skip, limit) => {
    // console.log("condition", condition, sort);
    const data = await model.find(condition, projection).sort(sort).skip(skip).limit(limit);
    return data
}

/**
 * @description - This function is used to count document
 */
const countingForAwait = async (model, condition) => {
    const data = await model.countDocuments(condition);
    return data
}

module.exports = {
    findOneForAwait,
    findManyForAwait,
    findOneAndUpdateForAwait,
    findManyAndUpdateForAwait,
    findOneForAwaitWithSort,
    createForAwait,
    findOneForAwaitWithPopulate,
    findManyForAwaitWithPopulate,
    getAggrgateDataForAwait,
    findManyForAwaitWithSortPopulate,
    countingForAwait,
    findManyForAwaitWithSortSkipLimitPopulate,
    findManyForAwaitWithSortSkipAndLimit,
    findManyForAwaitWithPopulatemultiple,
    findManyForAwaitWithPopulateSelected,
}