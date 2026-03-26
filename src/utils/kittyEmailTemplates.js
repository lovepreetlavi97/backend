const getKittyPaymentSuccessTemplate = (data) => {
  const { userName, planName, amount, installmentNo, date, nextDueDate, totalPaid, totalAmount } = data;

  const progressPercent = Math.round((totalPaid / totalAmount) * 100);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;700&display=swap');
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #fcfaf9; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; }
    .header { background: #1a1a1a; padding: 60px 40px; text-align: center; color: #ffffff; }
    .logo { font-family: 'Playfair Display', serif; font-size: 28px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 8px; color: #ffffff; }
    .logo-sub { font-size: 10px; letter-spacing: 5px; text-transform: uppercase; color: #c97f5e; font-weight: 700; }
    .content { padding: 50px 40px; }
    .greeting { font-family: 'Playfair Display', serif; font-size: 24px; margin-bottom: 24px; }
    .success-badge { display: inline-block; padding: 8px 16px; background: #f0fdf4; color: #166534; border-radius: 100px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px; border: 1px solid #dcfce7; }
    .amount-card { background: #fcfaf9; border-radius: 24px; padding: 30px; margin-bottom: 40px; text-align: center; border: 1px solid #f0f0f0; }
    .amount-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #a1a1a1; margin-bottom: 8px; }
    .amount-value { font-family: 'Playfair Display', serif; font-size: 36px; color: #1a1a1a; }
    .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 24px; margin-bottom: 40px; border-top: 1px solid #f0f0f0; padding-top: 40px; }
    .detail-item { }
    .detail-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #a1a1a1; margin-bottom: 4px; }
    .detail-value { font-size: 14px; font-weight: 700; color: #1a1a1a; }
    .progress-section { margin-bottom: 40px; }
    .progress-bar { height: 6px; background: #f0f0f0; border-radius: 100px; overflow: hidden; margin: 12px 0; }
    .progress-fill { height: 100%; background: #c97f5e; border-radius: 100px; width: ${progressPercent}%; }
    .progress-text { font-size: 11px; color: #a1a1a1; font-weight: 600; }
    .footer { padding: 40px; text-align: center; font-size: 12px; color: #a1a1a1; border-top: 1px solid #f0f0f0; }
    .cta { display: inline-block; padding: 16px 32px; background: #1a1a1a; color: #ffffff !important; text-decoration: none; border-radius: 16px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Guru</div>
      <div class="logo-sub">Jewellers</div>
    </div>
    <div class="content">
      <div class="success-badge">Payment Received</div>
      <div class="greeting">Hello, ${userName}</div>
      <p style="margin-bottom: 40px; color: #666;">Your installment for the <strong>${planName}</strong> has been successfully received. Thank you for your continued trust in Guru Jewellers.</p>
      
      <div class="amount-card">
        <div class="amount-label">Amount Paid</div>
        <div class="amount-value">₹${amount.toLocaleString()}</div>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Installment</div>
          <div class="detail-value">#${installmentNo}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Date</div>
          <div class="detail-value">${date}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Next Due Date</div>
          <div class="detail-value">${nextDueDate || 'Fully Paid'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Plan Name</div>
          <div class="detail-value">${planName}</div>
        </div>
      </div>

      <div class="progress-section">
        <div style="display: flex; justify-content: space-between;">
           <span class="detail-label">Savings Progress</span>
           <span class="progress-text">${progressPercent}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <p class="progress-text">₹${totalPaid.toLocaleString()} of ₹${totalAmount.toLocaleString()} accumulated</p>
      </div>

      <div style="text-align: center;">
        <a href="https://gurujewellers.in/account/my-kitty" class="cta">View My Passbook</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2026 Guru Jewellers. All rights reserved.</p>
      <p>Luxury defined by your dreams.</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { getKittyPaymentSuccessTemplate };
