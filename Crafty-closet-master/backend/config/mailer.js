// backend/config/mailer.js
const sgMail = require('@sendgrid/mail');

// Configure SendGrid API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅  SendGrid mailer ready');
} else {
  console.warn('⚠️   SENDGRID_API_KEY not set — emails will be skipped');
}

// ── Email sender helper ────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`📧  [MAIL SKIPPED — not configured] To: ${to} | Subject: ${subject}`);
    return;
  }

  // Strip HTML tags to create a plain-text fallback (improves spam score)
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const msg = {
    to,
    from: {
      email: process.env.MAIL_FROM || 'avu0000001@gmail.com',
      name: 'Crafty Closet',
    },
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<mailto:${process.env.MAIL_FROM || 'avu0000001@gmail.com'}?subject=unsubscribe>`,
    },
    mailSettings: {
      bypassListManagement: { enable: false },
    },
    trackingSettings: {
      clickTracking: { enable: false },     // SendGrid click tracking rewrites URLs — spam trigger
      openTracking: { enable: false },      // Tracking pixels can trigger spam filters
    },
  };
  return sgMail.send(msg);
};

// ── Email Templates ────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin:0; padding:0; font-family:'DM Sans',Arial,sans-serif; background:#fff8f5; color:#3d1a2e; }
    .wrap { max-width:560px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(214,84,122,0.12); }
    .header { background:linear-gradient(135deg,#f4a7b9,#d6547a); padding:32px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:24px; letter-spacing:-0.5px; }
    .header p  { margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:14px; }
    .body { padding:32px; }
    .body p { font-size:15px; line-height:1.7; color:#5a3a3a; margin:0 0 16px; }
    .btn { display:inline-block; background:linear-gradient(135deg,#f4a7b9,#d6547a); color:#fff !important; text-decoration:none; padding:14px 32px; border-radius:50px; font-weight:700; font-size:15px; margin:8px 0; }
    .footer { background:#fce4ec; padding:20px 32px; text-align:center; font-size:12px; color:#9a7070; }
    .divider { border:none; border-top:1px solid #fce4ec; margin:20px 0; }
    .order-table { width:100%; border-collapse:collapse; font-size:14px; }
    .order-table th { text-align:left; padding:8px 12px; background:#fce4ec; color:#d6547a; font-size:12px; text-transform:uppercase; letter-spacing:.05em; }
    .order-table td { padding:10px 12px; border-bottom:1px solid #fce4ec; }
    .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; background:#fce4ec; color:#d6547a; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>💎 Crafty Closet</h1>
      <p>Your style, your story</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      © 2025 Crafty Closet · Made with 💎 &amp; love<br/>
      <small>If you didn't request this email, you can safely ignore it.</small>
    </div>
  </div>
</body>
</html>`;

// Welcome email after registration
const sendWelcome = (to, name) =>
  sendMail({
    to,
    subject: '💎 Welcome to Crafty Closet!',
    html: baseTemplate(`
      <p>Hi <strong>${name}</strong>! 👋</p>
      <p>Welcome to <strong>Crafty Closet</strong> — your one-stop destination for gorgeous artificial jewellery & accessories.</p>
      <p>Start exploring our handpicked collection:</p>
      <p style="text-align:center"><a href="${process.env.CLIENT_URL}/shop" class="btn">Shop Now ✨</a></p>
      <hr class="divider"/>
      <p style="font-size:13px;color:#9a7070">You can manage your account, track orders, and build your wishlist from your profile.</p>
    `),
  });

// Email verification
const sendVerification = (to, name, token) =>
  sendMail({
    to,
    subject: '✅ Verify your Crafty Closet email',
    html: baseTemplate(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>Please verify your email address to complete your Crafty Closet account setup.</p>
      <p style="text-align:center">
        <a href="${process.env.CLIENT_URL}/verify-email?token=${token}" class="btn">Verify Email Address</a>
      </p>
      <p style="font-size:13px;color:#9a7070">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
    `),
  });

// Password reset
const sendPasswordReset = (to, name, token) =>
  sendMail({
    to,
    subject: '🔑 Reset your Crafty Closet password',
    html: baseTemplate(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <p style="text-align:center">
        <a href="${process.env.CLIENT_URL}/reset-password?token=${token}" class="btn">Reset Password</a>
      </p>
      <p style="font-size:13px;color:#9a7070">This link expires in <strong>1 hour</strong>. If you didn't request this, please ignore this email — your password will remain unchanged.</p>
    `),
  });

// Order confirmation
const sendOrderConfirmation = (to, name, order, items) => {
  const itemsHtml = items.map(i => `
    <tr>
      <td>${i.name}</td>
      <td style="text-align:center">${i.quantity}</td>
      <td style="text-align:right">₹${parseFloat(i.price).toLocaleString('en-IN')}</td>
      <td style="text-align:right"><strong>₹${(i.price * i.quantity).toLocaleString('en-IN')}</strong></td>
    </tr>`).join('');

  return sendMail({
    to,
    subject: `🎉 Order Confirmed — ${order.order_number}`,
    html: baseTemplate(`
      <p>Hi <strong>${name}</strong>! 🎉</p>
      <p>Your order has been placed successfully. We'll start processing it right away!</p>
      <div style="background:#fce4ec;border-radius:12px;padding:16px;margin:16px 0;text-align:center">
        <div style="font-size:12px;color:#9a7070;text-transform:uppercase;letter-spacing:.1em">Order Number</div>
        <div style="font-size:20px;font-weight:700;color:#d6547a;font-family:monospace">${order.order_number}</div>
      </div>
      <table class="order-table">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr><td colspan="3" style="text-align:right;font-weight:700;padding:12px">Grand Total</td>
              <td style="text-align:right;font-weight:700;color:#d6547a">₹${parseFloat(order.total_price).toLocaleString('en-IN')}</td></tr>
        </tfoot>
      </table>
      <hr class="divider"/>
      <p><strong>📍 Shipping to:</strong> ${order.shipping_name}, ${order.shipping_address}</p>
      <p><strong>💳 Payment:</strong> ${order.payment_method?.toUpperCase()}</p>
      <p style="text-align:center"><a href="${process.env.CLIENT_URL}/orders" class="btn">Track Order</a></p>
    `),
  });
};

// Order status update
const sendOrderStatusUpdate = (to, name, order) => {
  const statusMessages = {
    processing: { emoji: '🔄', msg: 'Your order is being processed and will be shipped soon.' },
    shipped:    { emoji: '🚚', msg: 'Great news! Your order is on its way to you.' },
    delivered:  { emoji: '✅', msg: 'Your order has been delivered. We hope you love it!' },
    cancelled:  { emoji: '❌', msg: 'Your order has been cancelled. Contact us if you have questions.' },
  };
  const info = statusMessages[order.status] || { emoji: '📦', msg: `Your order status has been updated to ${order.status}.` };

  return sendMail({
    to,
    subject: `${info.emoji} Order Update — ${order.order_number}`,
    html: baseTemplate(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>${info.msg}</p>
      <div style="text-align:center;margin:20px 0">
        <span class="badge">${info.emoji} ${order.status.toUpperCase()}</span>
      </div>
      <p><strong>Order:</strong> ${order.order_number}</p>
      <p style="text-align:center"><a href="${process.env.CLIENT_URL}/orders" class="btn">View Order</a></p>
    `),
  });
};

module.exports = {
  sendMail,
  sendWelcome,
  sendVerification,
  sendPasswordReset,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
};
