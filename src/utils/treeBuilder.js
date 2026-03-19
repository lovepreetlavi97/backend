/**
 * Build a nested tree from flat nodes using parentId.
 *
 * - O(n) time, O(n) memory
 * - Does not mutate original array
 * - Supports missing/unknown parents (treats them as roots)
 *
 * @param {Array<object>} nodes
 * @param {object} opts
 * @param {string} opts.idKey
 * @param {string} opts.parentKey
 * @param {string} opts.childrenKey
 * @returns {Array<object>} tree roots
 */
function buildTree(nodes, opts = {}) {
  const idKey = opts.idKey || "_id";
  const parentKey = opts.parentKey || "parentId";
  const childrenKey = opts.childrenKey || "children";

  const byId = new Map();
  const roots = [];

  for (const n of nodes || []) {
    const node = { ...n, [childrenKey]: [] };
    byId.set(String(node[idKey]), node);
  }

  for (const node of byId.values()) {
    const parentVal = node[parentKey];
    const parentId = parentVal ? String(parentVal) : null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)[childrenKey].push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

module.exports = { buildTree };

