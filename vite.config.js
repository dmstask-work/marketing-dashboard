import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Simple .env parser for Vite server middleware
function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const vars = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        vars[key] = val;
      }
    });
  }
  return vars;
}

let cachedResponse = null;
let lastFetchedTime = 0;

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

async function fetchGoogleSheetsData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedResponse && now - lastFetchedTime < 3000) {
    return cachedResponse;
  }

  const envVars = loadDotEnv();
  const spreadsheetId = process.env.SPREADSHEET_ID || envVars.SPREADSHEET_ID;
  const closingSheet = process.env.WORKSHEET_NAME || envVars.WORKSHEET_NAME || 'closing';
  const leadsSheet = process.env.LEADS_RAW_WORKSHEET || envVars.LEADS_RAW_WORKSHEET || 'leads';
  const financeSheet = process.env.FINANCE_SHEET || envVars.FINANCE_SHEET || 'finance';
  const saPath = process.env.SERVICE_ACCOUNT_JSON_PATH || envVars.SERVICE_ACCOUNT_JSON_PATH || 'service_account.json';
  const saB64 = process.env.SERVICE_ACCOUNT_JSON_B64 || envVars.SERVICE_ACCOUNT_JSON_B64;

  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID tidak ditemukan di .env');
  }

  let sa;
  if (saB64 && !saB64.endsWith('...')) {
    sa = JSON.parse(Buffer.from(saB64, 'base64').toString('utf8'));
  } else {
    const fullSaPath = path.resolve(process.cwd(), saPath);
    sa = JSON.parse(fs.readFileSync(fullSaPath, 'utf8'));
  }

  const jwt = createServiceAccountJWT(sa);
  const tokenRes = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Gagal autentikasi Service Account: ${errText}`);
  }

  const { access_token: token } = await tokenRes.json();

  // BatchGet all 3 sheets in a single Google Sheets API request for maximum speed
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
    throw new Error(`Gagal mengambil data Google Sheets: ${errText}`);
  }

  const batchJson = await sheetRes.json();
  const valueRanges = batchJson.valueRanges || [];

  cachedResponse = {
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
  return cachedResponse;
}

function googleSheetsApiPlugin() {
  return {
    name: 'google-sheets-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/dashboard', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        );
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const force = urlObj.searchParams.get('refresh') === 'true';
          const payload = await fetchGoogleSheetsData(force);
          res.statusCode = 200;
          res.end(JSON.stringify(payload));
        } catch (err) {
          console.error('[Google Sheets API Middleware Error]:', err);
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              mode: 'error',
              status: 'error',
              message: err.message,
            })
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), googleSheetsApiPlugin()],
  server: {
    port: 5173,
  },
});
