const crypto = require('crypto');

function encrypt(payload, sk, iv) {
  const key = Buffer.from(sk, 'base64');
  const ivBuf = Buffer.from(iv, 'base64');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, ivBuf);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('base64');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { apiKey, sk, iv, amount, orderId } = req.body;
  if (!apiKey || !sk || !iv) return res.status(400).json({ error: 'Missing credentials' });

  try {
    const payload = { amount, currency: 'USD', order_id: orderId };
    const encrypted = encrypt(payload, sk, iv);

    const response = await fetch('https://api.baray.io/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ data: encrypted })
    });

    const json = await response.json();
    if (json._id) {
      res.json({ intentId: json._id });
    } else {
      res.status(400).json({ error: json });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
