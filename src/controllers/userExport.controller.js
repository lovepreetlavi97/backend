const ExcelJS = require('exceljs');
const { User } = require('../models');
const { errorResponse } = require('../utils/responseUtil');

/**
 * Export users to Excel
 * Supports same filters as getAllUsers: status, sortBy, sortOrder
 */
const exportUsersToExcel = async (req, res) => {
  try {
    const {
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      search
    } = req.query;

    // Build query (same as getAllUsers)
    const query = {};
    if (status) query.status = status;

    // Date filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateTime;
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch all matching users (no pagination for export)
    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const users = await User.find(query)
      .select('-password -token -otp -otpExpiry')
      .sort(sortObj)
      .lean();

    if (users.length === 0) {
      return errorResponse(res, 404, 'No users found to export');
    }

    // Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: '_id', width: 25 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone Number', key: 'phoneNumber', width: 15 },
      { header: 'Country Code', key: 'countryCode', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Email Verified', key: 'isEmailVerified', width: 15 },
      { header: 'Phone Verified', key: 'isPhoneVerified', width: 15 },
      { header: 'Login Provider', key: 'loginProvider', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Last Login', key: 'lastLoginAt', width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    users.forEach(user => {
      worksheet.addRow({
        _id: user._id.toString(),
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        countryCode: user.countryCode || '',
        status: user.status || 'active',
        role: user.role || 'user',
        isEmailVerified: user.isEmailVerified ? 'Yes' : 'No',
        isPhoneVerified: user.isPhoneVerified ? 'Yes' : 'No',
        loginProvider: user.loginProvider || 'email',
        createdAt: user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : ''
      });
    });

    // Auto-filter for all columns
    worksheet.autoFilter = {
      from: 'A1',
      to: 'L1'
    };

    // Set response headers for file download
    const filename = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response stream
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export users to Excel error:', error);
    return errorResponse(res, 500, 'Failed to export users', {
      error: error.message
    });
  }
};

module.exports = {
  exportUsersToExcel
};
