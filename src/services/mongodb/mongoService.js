const bcrypt = require('bcrypt');

const create = async (model, data) => {
  console.log("create something",model, data)
  return model.create(data);
};

const findOne = async (model, query, projection = {}) => {
  return model.findOne(query, projection);
};

// const findMany = async (model, query = {}, projection = {}, options = {}, populate = '') => {
//   console.log(model, "model");
//   return model.find(query, projection, options).populate(populate);
// };
const findMany = async (model, query = {}, projection = {}, options = {}, populate = []) => {
  console.log("Finding multiple documents in:", model.modelName, "with query:", query);
  let queryExec = model.find(query, projection, options);

  if (Array.isArray(populate)) {
    populate.forEach((field) => {
      queryExec = queryExec.populate(field);
    });
  } else if (typeof populate === 'string' && populate) {
    queryExec = queryExec.populate(populate);
  }

  return queryExec;
};

const findAndUpdate = async (model, query, data, options = { new: true }) => {
  return model.findOneAndUpdate(query, data, options);
};

const deleteOne = async (model, query) => {
  return model.deleteOne(query);
};

const softDelete = async (model, query) => {
  return model.findOneAndUpdate(query, { isDeleted: true }, { new: true });
};

const findByEmail = async (model, email) => {
  return model.findOne({ email });
};
const findByPhone = async (model, phoneNumber) => {
  return model.findOne({ phoneNumber });
};
const updatePassword = async (admin, newPassword) => {
  admin.password = await bcrypt.hash(newPassword, 10);
  return admin.save();
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

// Export functions individually
module.exports = {
  create,
  findOne,
  findMany,
  findAndUpdate,
  deleteOne,
  softDelete,
  findByEmail,
  updatePassword,
  verifyPassword,
  findByPhone
};
