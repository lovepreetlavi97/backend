const ExcelJS = require('exceljs');
const { Product, Category, SubCategory, Festival } = require('../models');
const { errorResponse } = require('../utils/responseUtil');
const mongoose = require('mongoose');

// Export products with filters similar to getAllProducts
const exportProductsToExcel = async (req, res) => {
  try {
    const {
      categoryId,
      subcategoryId,
      festivalId,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;

    const query = { isDeleted: false };

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId)) {
      query.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);
    }
    if (festivalId && mongoose.Types.ObjectId.isValid(festivalId)) {
      query.festivalIds = new mongoose.Types.ObjectId(festivalId);
    }
    if (minPrice !== undefined) {
      query.actualPrice = { ...query.actualPrice, $gte: parseFloat(minPrice) };
    }
    if (maxPrice !== undefined) {
      query.actualPrice = { ...query.actualPrice, $lte: parseFloat(maxPrice) };
    }
    if (inStock === 'true') {
      query.isInStock = true;
    }
    if (isFeatured === 'true') {
      query.isFeatured = true;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23,59,59,999);
        query.createdAt.$lte = endDateTime;
      }
    }

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const products = await Product.find(query)
      .populate({ path: 'categoryId', select: 'name' })
      .populate({ path: 'subcategoryId', select: 'name' })
      .populate({ path: 'festivalIds', select: 'name' })
      .sort(sortObj)
      .lean();

    if (products.length === 0) {
      return errorResponse(res, 404, 'No products found to export');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
      { header: 'ID', key: '_id', width: 24 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Slug', key: 'slug', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Subcategory', key: 'subcategory', width: 20 },
      { header: 'Festival Tags', key: 'festivals', width: 30 },
      { header: 'Actual Price', key: 'actualPrice', width: 15 },
      { header: 'Discounted Price', key: 'discountedPrice', width: 18 },
      { header: 'Discount %', key: 'discountPercentage', width: 12 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'In Stock', key: 'isInStock', width: 10 },
      { header: 'Featured', key: 'isFeatured', width: 10 },
      { header: 'Blocked', key: 'isBlocked', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

    products.forEach(p => {
      const discountPercentage = (p.actualPrice && p.discountedPrice)
        ? Math.round(((p.actualPrice - p.discountedPrice) / p.actualPrice) * 100)
        : 0;

      worksheet.addRow({
        _id: p._id.toString(),
        name: p.name || '',
        slug: p.slug || '',
        category: p.categoryId?.name || '',
        subcategory: p.subcategoryId?.name || '',
        festivals: Array.isArray(p.festivalIds) ? p.festivalIds.map(f => f.name).join(', ') : '',
        actualPrice: p.actualPrice ?? '',
        discountedPrice: p.discountedPrice ?? '',
        discountPercentage,
        stock: p.stock ?? 0,
        isInStock: p.isInStock ? 'Yes' : 'No',
        isFeatured: p.isFeatured ? 'Yes' : 'No',
        isBlocked: p.isBlocked ? 'Yes' : 'No',
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleString() : '',
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleString() : ''
      });
    });

    worksheet.autoFilter = { from: 'A1', to: 'O1' };

    const filename = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export products to Excel error:', error);
    return errorResponse(res, 500, 'Failed to export products', { error: error.message });
  }
};

module.exports = { exportProductsToExcel };
