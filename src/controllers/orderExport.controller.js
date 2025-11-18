const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const { Order } = require('../models');
const { errorResponse } = require('../utils/responseUtil');

// Export orders to Excel (Admin) - filters like getAllOrders
const exportOrdersToExcel = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endDt = new Date(endDate);
        endDt.setHours(23,59,59,999);
        query.createdAt.$lte = endDt;
      }
    }

    if (search) {
      query.$or = [ { orderNumber: { $regex: search, $options: 'i' } } ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        query.$or.push({ userId: new mongoose.Types.ObjectId(search) });
      }
    }

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const orders = await Order.find(query)
      .populate({ path: 'userId', select: 'name email' })
      .sort(sortObj)
      .lean();

    if (!orders.length) {
      return errorResponse(res, 404, 'No orders found to export');
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Orders');

    sheet.columns = [
      { header: 'Order Number', key: 'orderNumber', width: 22 },
      { header: 'User Name', key: 'userName', width: 25 },
      { header: 'User Email', key: 'userEmail', width: 28 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Payment Status', key: 'paymentStatus', width: 16 },
      { header: 'Payment Method', key: 'paymentMethod', width: 16 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Tax Amount', key: 'taxAmount', width: 12 },
      { header: 'Discount', key: 'discountAmount', width: 12 },
      { header: 'Shipping', key: 'shippingCharge', width: 12 },
      { header: 'Final Amount', key: 'finalAmount', width: 14 },
      { header: 'Products Count', key: 'productsCount', width: 14 },
      { header: 'Promo Code', key: 'promoCode', width: 16 },
      { header: 'Estimated Delivery', key: 'estimatedDelivery', width: 22 },
      { header: 'Delivered At', key: 'deliveredAt', width: 22 },
      { header: 'Cancelled At', key: 'cancelledAt', width: 22 },
      { header: 'Created At', key: 'createdAt', width: 22 }
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2E2' } };

    orders.forEach(o => {
      sheet.addRow({
        orderNumber: o.orderNumber,
        userName: o.userId?.name || '',
        userEmail: o.userId?.email || '',
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        subtotal: o.subtotal,
        taxAmount: o.taxAmount,
        discountAmount: o.discountAmount,
        shippingCharge: o.shippingCharge,
        finalAmount: o.finalAmount,
        productsCount: Array.isArray(o.products) ? o.products.length : 0,
        promoCode: o.promoCodeDetails?.code || '',
        estimatedDelivery: o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleString() : '',
        deliveredAt: o.deliveredAt ? new Date(o.deliveredAt).toLocaleString() : '',
        cancelledAt: o.cancelDetails?.cancelledAt ? new Date(o.cancelDetails.cancelledAt).toLocaleString() : '',
        createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : ''
      });
    });

    sheet.autoFilter = { from: 'A1', to: 'Q1' };

    const filename = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export orders error:', err);
    return errorResponse(res, 500, 'Failed to export orders', { error: err.message });
  }
};

module.exports = { exportOrdersToExcel };
