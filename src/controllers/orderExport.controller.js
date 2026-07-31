const ExcelJS = require('exceljs');
const { Order, User } = require('../models');
const { errorResponse } = require('../utils/responseUtil');

const exportOrdersToExcel = async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;

    const where = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const orders = await Order.findAll({
      where,
      include: [{ model: User, attributes: ['name', 'email'] }]
    });

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
      { header: 'Final Amount', key: 'finalAmount', width: 14 },
      { header: 'Created At', key: 'createdAt', width: 22 }
    ];

    sheet.getRow(1).font = { bold: true };

    orders.forEach(o => {
      sheet.addRow({
        orderNumber: o.orderNumber,
        userName: o.User?.name || '',
        userEmail: o.User?.email || '',
        status: o.status,
        paymentStatus: o.paymentStatus,
        finalAmount: o.finalAmount,
        createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : ''
      });
    });

    const filename = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    return errorResponse(res, 500, 'Failed to export orders', { error: err.message });
  }
};

module.exports = { exportOrdersToExcel };
