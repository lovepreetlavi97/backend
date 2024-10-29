const bcrypt = require('bcrypt');

const create = async (model, data) => {
  console.log("create something")
  return model.create(data);
};

const findOne = async (model, query, projection = {}) => {
  return model.findOne(query, projection);
};

const findMany = async (model, query = {}, projection = {}, options = {}) => {
  return model.find(query, projection, options);
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
};
