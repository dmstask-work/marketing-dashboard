import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let cachedPayload = null;
let lastFetchedTime = 0;

function firstNonEmptyEnv(...keys) {
  for (const k of keys) {
    const raw = process.env[k];
    if (raw && typeof raw === 'string') {
      const cleaned = raw.trim().replace(/^['"]|['"]$/g, '');
      if (cleaned) return cleaned;
    }
  }
  return '';
}

function parseServiceAccount() {
  const rawEnv = firstNonEmptyEnv(
    'SERVICE_ACCOUNT_JSON_B64',
    'SERVICE_ACCOUNT_JSON',
    'GOOGLE_SERVICE_ACCOUNT_JSON'
  );

  let jsonStr = '';
  if (rawEnv && !rawEnv.endsWith('...')) {
    if (rawEnv.trim().startsWith('{')) {
      jsonStr = rawEnv.trim();
    } else {
      // Remove any whitespace/newlines introduced when copying Base64
      const cleanB64 = rawEnv.replace(/[\s\r\n]+/g, '');
      jsonStr = Buffer.from(cleanB64, 'base64').toString('utf8');
    }
  } else {
    const saPath = firstNonEmptyEnv('SERVICE_ACCOUNT_JSON_PATH') || 'service_account.json';
    const fullPath = path.resolve(process.cwd(), saPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(
        'Environment Variable SERVICE_ACCOUNT_JSON_B64 belum diset di Vercel Project Settings.'
      );
    }
    jsonStr = fs.readFileSync(fullPath, 'utf8');
  }

  let sa;
  try {
    sa = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(`Format JSON Service Account tidak valid: ${err.message}`);
  }

  if (!sa.client_email || !sa.private_key) {
    throw new Error('client_email atau private_key tidak ditemukan di dalam Service Account JSON.');
  }

  // Ensure escaped \n in private_key are real newlines for crypto.createSign
  sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  return sa;
}

function createServiceAccountJWT(sa) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  ).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claim}`);
  const signature = sign.sign(sa.private_key, 'base64url');
  return `${header}.${claim}.${signature}`;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const spreadsheetId = firstNonEmptyEnv('SPREADSHEET_ID', 'GOOGLE_SPREADSHEET_ID');
    if (!spreadsheetId) {
      return res.status(400).json({
        mode: 'error',
        status: 'error',
        message: 'Environment Variable SPREADSHEET_ID belum diset di Vercel Project Settings.',
      });
    }

    const forceRefresh = req.query?.refresh === 'true';
    const now = Date.now();

    if (!forceRefresh && cachedPayload && now - lastFetchedTime < 3000) {
      return res.status(200).json(cachedPayload);
    }

    const sa = parseServiceAccount();
    const jwt = createServiceAccountJWT(sa);

    const tokenRes = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Gagal autentikasi OAuth2 Google (${tokenRes.status}): ${errText}`);
    }

    const { access_token: token } = await tokenRes.json();

    const financeSheet =
      firstNonEmptyEnv('FINANCE_SHEET', 'FINANCE_SHEET_NAME') || 'finance';
    const closingSheet =
      firstNonEmptyEnv('WORKSHEET_NAME', 'CLOSING_SHEET_NAME') || 'closing';
    const leadsSheet =
      firstNonEmptyEnv('LEADS_RAW_WORKSHEET', 'LEADS_SHEET_NAME') || 'leads';

    const ranges = [
      `${financeSheet}!A1:P50000`,
      `${closingSheet}!A1:T50000`,
      `${leadsSheet}!A1:M50000`,
    ]
      .map((r) => `ranges=${encodeURIComponent(r)}`)
      .join('&');

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges}`;
    const sheetRes = await fetch(batchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!sheetRes.ok) {
      const errText = await sheetRes.text();
      throw new Error(`Gagal membaca Google Sheets (${sheetRes.status}): ${errText}`);
    }

    const batchJson = await sheetRes.json();
    const valueRanges = batchJson.valueRanges || [];

    cachedPayload = {
      mode: 'google_sheets',
      status: 'ok',
      lastUpdated: new Date().toISOString(),
      sheets: {
        finance: valueRanges[0]?.values || [],
        closing: valueRanges[1]?.values || [],
        leads: valueRanges[2]?.values || [],
      },
    };
    lastFetchedTime = Date.now();

    return res.status(200).json(cachedPayload);
  } catch (err) {
    console.error('[/api/dashboard Error]:', err);
    return res.status(500).json({
      mode: 'error',
      status: 'error',
      message: err.message || 'Internal Server Error pada /api/dashboard',
    });
  }
}
