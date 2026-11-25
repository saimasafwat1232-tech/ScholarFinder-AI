const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const aiRouter = require('./routes/ai');
const { getProviderConfig } = require('./services/aiService');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Configure CORS cleanly
const rawOrigins = (process.env.CORS_ORIGIN || '*').trim();
const corsOptions =
  rawOrigins === '*'
    ? { origin: '*' }
    : {
        origin: rawOrigins.split(',').map((o) => o.trim()).filter(Boolean)
      };

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Health & configuration status (never leaks API keys)
app.get('/api/health', (req, res) => {
  const aiConfig = getProviderConfig();
  res.json({
    ok: true,
    service: 'ScholarFinder AI Backend',
    timestamp: new Date().toISOString(),
    ai: {
      provider: aiConfig.provider,
      configured: aiConfig.configured,
      model: aiConfig.activeModel
    }
  });
});

// AI routes
app.use('/api/ai', aiRouter);

// Serve primary scholarship CSV dataset stored on the backend (zero user upload required)
app.get('/api/scholarships', (req, res) => {
  const candidates = [
    path.join(__dirname, 'data', 'track3_scholarships.csv'),
    path.join(__dirname, 'data', 'track3_scholarships (1).csv')
  ];

  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) {
    return res.status(404).json({
      ok: false,
      error: 'Primary dataset CSV not found in backend/data/.'
    });
  }

  try {
    const csv = fs.readFileSync(filePath, 'utf8');
    return res.json({
      ok: true,
      sourceName: `${path.basename(filePath)} (Backend)`,
      csv
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: `Failed to read backend CSV dataset: ${err.message}`
    });
  }
});

// Safe Google Sheets CSV export proxy (restricted strictly to docs.google.com/spreadsheets)
app.get('/api/sheets/fetch', async (req, res) => {
  const sheetUrl = (req.query.url || '').toString().trim();
  if (!sheetUrl) {
    return res.status(400).json({ ok: false, error: 'Missing url query parameter.' });
  }

  let parsed;
  try {
    parsed = new URL(sheetUrl);
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid Google Sheets URL.' });
  }

  if (parsed.protocol !== 'https:' || parsed.hostname !== 'docs.google.com' || !parsed.pathname.startsWith('/spreadsheets/')) {
    return res.status(400).json({
      ok: false,
      error: 'URL must be a valid https://docs.google.com/spreadsheets/... link.'
    });
  }

  // Normalize /edit or /view links to /export?format=csv
  const match = parsed.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    return res.status(400).json({ ok: false, error: 'Could not extract Google Sheet ID from URL.' });
  }

  const sheetId = match[1];
  const gid = parsed.searchParams.get('gid');
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${encodeURIComponent(gid)}` : ''}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(exportUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal
    });

    const bodyText = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok || contentType.includes('text/html') || bodyText.trim().startsWith('<!DOCTYPE') || bodyText.trim().startsWith('<html')) {
      return res.status(403).json({
        ok: false,
        code: 'SHEET_INACCESSIBLE',
        error: 'Google Sheet is private or returned an HTML login page (HTTP ' + response.status + '). Export the sheet as CSV manually (File -> Download -> .csv) and upload it in ScholarFinder AI.'
      });
    }

    return res.json({
      ok: true,
      csv: bodyText,
      sourceUrl: exportUrl
    });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      code: 'SHEET_FETCH_FAILED',
      error: `Failed to fetch Google Sheet: ${err.message}`
    });
  } finally {
    clearTimeout(timeout);
  }
});

// Optionally serve static frontend if SERVE_FRONTEND=true (handy for single-service free deployment like Render)
if (process.env.SERVE_FRONTEND === 'true') {
  const frontendDir = path.join(__dirname, '..', 'frontend');
  app.use(express.static(frontendDir));
}

app.use((err, req, res, _next) => {
  console.error('Unhandled backend error:', err);
  res.status(500).json({ ok: false, error: 'Internal server error.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    const aiConfig = getProviderConfig();
    console.log(`ScholarFinder AI backend listening on http://localhost:${PORT}`);
    console.log(`AI provider: ${aiConfig.provider} | configured: ${aiConfig.configured}`);
  });
}

module.exports = app;
