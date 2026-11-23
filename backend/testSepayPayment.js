const assert = require('assert');
const crypto = require('crypto');
const {
  buildSePayQrUrl,
  hasValidSePayWebhookAuth,
  readSePayTransfer,
} = require('./services/sepayPaymentService');

async function runTests() {
  process.env.SEPAY_PAYMENTS_ENABLED = 'false';
  assert.throws(
    () => buildSePayQrUrl({ amount: 125000, reference: 'CN0123456789AB' }),
    (error) => error.statusCode === 503
  );

  process.env.SEPAY_PAYMENTS_ENABLED = 'true';
  process.env.SEPAY_BANK_CODE = 'TESTBANK';
  process.env.SEPAY_ACCOUNT_NUMBER = '123456789';
  process.env.SEPAY_ACCOUNT_NAME = 'TEST USER';
  process.env.SEPAY_WEBHOOK_SECRET = 'test-secret';

  const qrUrl = new URL(buildSePayQrUrl({
    amount: 125000,
    reference: 'CN0123456789AB',
  }));
  assert.strictEqual(qrUrl.searchParams.get('amount'), '125000');
  assert.strictEqual(qrUrl.searchParams.get('des'), 'CN0123456789AB');
  assert.strictEqual(qrUrl.searchParams.get('bank'), 'TESTBANK');
  assert.strictEqual(qrUrl.searchParams.get('acc'), '123456789');

  const transfer = readSePayTransfer({
    id: 123,
    transferType: 'in',
    transferAmount: 125000,
    content: 'Thanh toan CN0123456789AB',
  });
  assert.deepStrictEqual(transfer, {
    transactionId: '123',
    reference: 'CN0123456789AB',
    transferType: 'IN',
    amount: 125000,
  });
  assert.strictEqual(
    readSePayTransfer({
      id: 124,
      transferType: 'out',
      transferAmount: 125000,
      content: 'CN0123456789AB',
    }).transferType,
    'OUT'
  );

  process.env.SEPAY_WEBHOOK_API_KEY = 'test-api-key';
  assert.strictEqual(
    hasValidSePayWebhookAuth({
      headers: { authorization: 'Apikey test-api-key' },
      rawBody: Buffer.from('{}'),
    }),
    true
  );
  assert.strictEqual(
    hasValidSePayWebhookAuth({
      headers: { authorization: 'Apikey incorrect' },
      rawBody: Buffer.from('{}'),
    }),
    false
  );
  delete process.env.SEPAY_WEBHOOK_API_KEY;
  const secret = 'test-secret';
  process.env.SEPAY_WEBHOOK_SECRET = secret;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const rawBody = Buffer.from('{"id":123}');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest('hex');
  assert.strictEqual(
    hasValidSePayWebhookAuth({
      headers: {
        'x-sepay-timestamp': timestamp,
        'x-sepay-signature': `sha256=${signature}`,
      },
      rawBody,
    }),
    true
  );
  assert.strictEqual(
    hasValidSePayWebhookAuth({
      headers: {
        'x-sepay-timestamp': timestamp,
        'x-sepay-signature': 'bad',
      },
      rawBody,
    }),
    false
  );

  delete process.env.SEPAY_BANK_CODE;
  delete process.env.SEPAY_ACCOUNT_NUMBER;
  delete process.env.SEPAY_ACCOUNT_NAME;
  delete process.env.SEPAY_PAYMENTS_ENABLED;
  delete process.env.SEPAY_WEBHOOK_API_KEY;
  delete process.env.SEPAY_WEBHOOK_SECRET;
  console.log('SePay payment helper tests passed.');
}

runTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
