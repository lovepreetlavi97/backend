const ExcelJS = require('exceljs');
const { Product, Category, SubCategory } = require('../models');
const { errorResponse } = require('../utils/responseUtil');
const { isValidId } = require('../utils/idUtils');

const exportProductsToExcel = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.query;

    const where = {};
    if (categoryId && isValidId(categoryId)) {
      where.categoryId = categoryId;
    }
    if (subcategoryId && isValidId(subcategoryId)) {
      where.subcategoryId = subcategoryId;
    }

    const products = await Product.findAll({
      where,
      include: [
        { model: Category, attributes: ['name'] },
        { model: SubCategory, attributes: ['name'] }
      ]
    });

    if (products.length === 0) {
      return errorResponse(res, 404, 'No products found to export');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 24 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Slug', key: 'slug', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Subcategory', key: 'subcategory', width: 20 },
      { header: 'Actual Price', key: 'actualPrice', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 }
    ];

    worksheet.getRow(1).font = { bold: true };

    products.forEach(p => {
      worksheet.addRow({
        id: p.id.toString(),
        name: p.name || '',
        slug: p.slug || '',
        category: p.Category?.name || '',
        subcategory: p.SubCategory?.name || '',
        actualPrice: p.actualPrice ?? '',
        stock: p.stock ?? 0
      });
    });

    const filename = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return errorResponse(res, 500, 'Failed to export products', { error: error.message });
  }
};

module.exports = { exportProductsToExcel };
