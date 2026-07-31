const isValidId = (id) => {
  if (id === null || id === undefined || id === '' || id === 'null' || id === 'undefined') return false;
  if (typeof id === 'number') return id > 0;
  if (typeof id === 'string') {
    const num = Number(id);
    if (!isNaN(num) && num > 0) return true;
    if (id.length === 24) return true; // legacy Mongo hex string compatibility
  }
  return false;
};

module.exports = { isValidId };
