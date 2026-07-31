const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const models = require('../../models');

const convertMongoQueryToSequelize = (query = {}, model = null) => {
  if (!query || typeof query !== 'object') return {};
  const where = {};

  for (let [key, val] of Object.entries(query)) {
    let targetKey = key;
    if (targetKey === '_id') targetKey = 'id';

    // If model attributes are present, strip keys that don't exist in the model schema (unless regex/Op operators)
    if (model && model.rawAttributes && !model.rawAttributes[targetKey] && !targetKey.startsWith('$')) {
      continue;
    }

    if (targetKey === '$or' && Array.isArray(val)) {
      where[Op.or] = val.map(item => convertMongoQueryToSequelize(item, model));
    } else if (targetKey === '$and' && Array.isArray(val)) {
      where[Op.and] = val.map(item => convertMongoQueryToSequelize(item, model));
    } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      const fieldCond = {};
      for (let [op, opVal] of Object.entries(val)) {
        if (op === '$in') fieldCond[Op.in] = opVal;
        else if (op === '$nin') fieldCond[Op.notIn] = opVal;
        else if (op === '$gte') fieldCond[Op.gte] = opVal;
        else if (op === '$lte') fieldCond[Op.lte] = opVal;
        else if (op === '$gt') fieldCond[Op.gt] = opVal;
        else if (op === '$lt') fieldCond[Op.lt] = opVal;
        else if (op === '$ne') fieldCond[Op.ne] = opVal;
        else if (op === '$regex') {
          const cleanPattern = String(opVal).replace(/^\^|\$$|\/|\/i/g, '');
          fieldCond[Op.like] = '%' + cleanPattern + '%';
        } else {
          fieldCond[op] = opVal;
        }
      }
      where[targetKey] = fieldCond;
    } else {
      where[targetKey] = val;
    }
  }
  return where;
};

const mapPopulateToInclude = (populate) => {
  if (!populate) return [];
  const popArray = Array.isArray(populate) ? populate : [populate];
  const includes = [];

  const modelMap = {
    userId: models.User,
    user: models.User,
    planId: models.KittyPlan,
    categoryId: models.Category,
    category: models.Category,
    subcategoryId: models.SubCategory,
    priceRuleId: models.PriceRule,
    productId: models.Product,
    orderId: models.Order
  };

  popArray.forEach((item) => {
    let field = typeof item === 'string' ? item : item.path;
    if (modelMap[field]) {
      includes.push({ model: modelMap[field], required: false });
    }
  });

  return includes;
};

const create = async (model, data, options = {}) => {
  if (!model) throw new Error('Model is required');
  // Handle case where data is passed as single object or array
  const itemData = Array.isArray(data) ? data[0] : data;
  return model.create(itemData, options);
};

const findOne = async (model, query = {}, projection = {}, options = {}) => {
  if (!model) return null;
  const where = convertMongoQueryToSequelize(query, model);
  const include = mapPopulateToInclude(options.populate);
  const order = options.sort
    ? Object.entries(options.sort)
        .map(([k, v]) => {
          let field = k === '_id' ? 'id' : k;
          if (field === 'position') field = 'order';
          if (model && model.rawAttributes && !model.rawAttributes[field]) return null;
          return [field, v === -1 ? 'DESC' : 'ASC'];
        })
        .filter(Boolean)
    : undefined;
  return model.findOne({ where, include, order: order && order.length ? order : undefined });
};

const findMany = async (model, query = {}, projection = {}, options = {}, populate = []) => {
  if (!model) return [];
  const where = convertMongoQueryToSequelize(query, model);
  const pop = options.populate || populate;
  const include = mapPopulateToInclude(pop);

  const limit = options.limit || options.perPage;
  const offset = options.skip || (options.page && limit ? (options.page - 1) * limit : undefined);
  const order = options.sort
    ? Object.entries(options.sort)
        .map(([k, v]) => {
          let field = k === '_id' ? 'id' : k;
          if (field === 'position') field = 'order';
          if (model && model.rawAttributes && !model.rawAttributes[field]) return null;
          return [field, v === -1 ? 'DESC' : 'ASC'];
        })
        .filter(Boolean)
    : undefined;

  return model.findAll({ where, include, limit, offset, order: order && order.length ? order : undefined });
};

const findAndUpdate = async (model, query = {}, data = {}, options = { new: true }) => {
  if (!model) return null;
  const where = convertMongoQueryToSequelize(query, model);
  const record = await model.findOne({ where });
  if (!record) return null;
  await record.update(data);
  return record;
};

const updateOne = async (model, query = {}, data = {}, options = {}) => {
  if (!model) return { modifiedCount: 0 };
  const where = convertMongoQueryToSequelize(query, model);
  const [affectedCount] = await model.update(data, { where });
  return { modifiedCount: affectedCount, nModified: affectedCount };
};

const deleteOne = async (model, query = {}) => {
  if (!model) return { deletedCount: 0 };
  const where = convertMongoQueryToSequelize(query, model);
  const deletedCount = await model.destroy({ where });
  return { deletedCount };
};

const softDelete = async (model, query = {}) => {
  if (!model) return null;
  const where = convertMongoQueryToSequelize(query, model);
  const record = await model.findOne({ where });
  if (!record) return null;
  if (model.rawAttributes && model.rawAttributes.isDeleted) {
    await record.update({ isDeleted: true });
  } else {
    await record.destroy();
  }
  return record;
};

const findByEmail = async (model, email) => {
  if (!model) return null;
  return model.findOne({ where: { email } });
};

const findByPhone = async (model, phoneNumber) => {
  if (!model) return null;
  return model.findOne({ where: { phoneNumber } });
};

const updatePassword = async (user, newPassword) => {
  user.password = await bcrypt.hash(newPassword, 10);
  return user.save();
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const countDocuments = async (model, query = {}) => {
  if (!model) return 0;
  const where = convertMongoQueryToSequelize(query, model);
  return model.count({ where });
};

module.exports = {
  create,
  findOne,
  findMany,
  findAndUpdate,
  updateOne,
  deleteOne,
  softDelete,
  findByEmail,
  findByPhone,
  updatePassword,
  verifyPassword,
  countDocuments,
  convertMongoQueryToSequelize,
  mapPopulateToInclude
};
