const crypto = require('crypto');

function buildSePayQrUrl({ amount, reference }) {
  if (process.env.SEPAY_PAYMENTS_ENABLED !== 'true') {
    const error = new Error(
      'Thanh toán SePay đang bị tắt cho đến khi webhook được cấu hình.'
    );
    error.statusCode = 503;
    throw error;
  }

  const bank = process.env.SEPAY_BANK_CODE;
  const account = process.env.SEPAY_ACCOUNT_NUMBER;
  const holder = process.env.SEPAY_ACCOUNT_NAME;
  if (
    !process.env.SEPAY_WEBHOOK_API_KEY &&
    !process.env.SEPAY_WEBHOOK_SECRET
  ) {
    const error = new Error(
      'Cần cấu hình xác thực webhook SePay trước khi nhận thanh toán.'
    );
    error.statusCode = 503;
    throw error;
  }

  if (!bank || !account) {
    const error = new Error(
      'Thiếu SEPAY_BANK_CODE hoặc SEPAY_ACCOUNT_NUMBER trong backend/.env.'
    );
    error.statusCode = 503;
    throw error;
  }

  const url = new URL('https://vietqr.app/img');
  url.searchParams.set('acc', account);
  url.searchParams.set('bank', bank);
  url.searchParams.set('amount', String(amount));
  url.searchParams.set('des', reference);
  url.searchParams.set('template', 'compact');
  url.searchParams.set('showinfo', 'true');
  if (holder) {
    url.searchParams.set('holder', holder);
  }

  return url.toString();
}

function hasValidSePayWebhookAuth({ headers, rawBody, now = Date.now() }) {
  const apiKey = process.env.SEPAY_WEBHOOK_API_KEY;
  if (apiKey) {
    const authorization = String(headers.authorization || '');
    const provided = authorization.replace(/^(ApiKey|Bearer)\s+/i, '');
    return constantTimeEqual(provided, apiKey);
  }

  const secret = process.env.SEPAY_WEBHOOK_SECRET;
  const timestamp = String(headers['x-sepay-timestamp'] || '');
  const signature = String(headers['x-sepay-signature'] || '');
  const timestampNumber = Number(timestamp);
  const timestampMs =
    timestampNumber > 1e12 ? timestampNumber : timestampNumber * 1000;

  if (
    !secret ||
    !Buffer.isBuffer(rawBody) ||
    !Number.isFinite(timestampMs) ||
    Math.abs(now - timestampMs) > 5 * 60 * 1000
  ) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest('hex');
  const normalizedSignature = signature.replace(/^sha256=/i, '');

  return constantTimeEqual(normalizedSignature, expected);
}

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function readSePayTransfer(payload) {
  const transactionId = payload?.id ?? payload?.transactionId;
  const referenceText = [
    payload?.content,
    payload?.code,
    payload?.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();
  const reference = referenceText.match(/\bCN[A-F0-9]{12}\b/)?.[0] || null;
  const transferType = String(payload?.transferType || '').toUpperCase();
  const amount = Number(payload?.transferAmount);

  if (
    transactionId === undefined ||
    transactionId === null ||
    !Number.isSafeInteger(amount) ||
    amount < 0
  ) {
    return null;
  }

  return {
    transactionId: String(transactionId),
    reference,
    transferType,
    amount,
  };
}

module.exports = {
  buildSePayQrUrl,
  hasValidSePayWebhookAuth,
  readSePayTransfer,
};
