const express = require('express');
const {
  getProviderConfig,
  explainScholarship,
  recommendScholarships
} = require('../services/aiService');

const router = express.Router();

router.get('/status', (req, res) => {
  const config = getProviderConfig();
  res.json({
    ok: true,
    aiAvailable: config.configured,
    provider: config.provider,
    model: config.activeModel,
    fallbackMode: !config.configured
  });
});

router.post('/explain', async (req, res) => {
  const { student, scholarship, matchResult, language = 'en' } = req.body || {};

  if (!student || !scholarship || !matchResult) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required fields: student, scholarship, and matchResult are required.'
    });
  }

  try {
    const data = await explainScholarship({ student, scholarship, matchResult, language });
    return res.json({ ok: true, ...data });
  } catch (err) {
    const statusCode = err.code === 'AI_NOT_CONFIGURED' || err.code === 'AI_DISABLED' ? 503 : err.status || 502;
    return res.status(statusCode).json({
      ok: false,
      fallbackRecommended: true,
      code: err.code || 'AI_ERROR',
      error: err.message
    });
  }
});

router.post('/recommend', async (req, res) => {
  const { student, summaryStats, topEligible, topAlmostEligible, language = 'en' } = req.body || {};

  if (!student || !summaryStats) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required fields: student and summaryStats are required.'
    });
  }

  try {
    const data = await recommendScholarships({
      student,
      summaryStats,
      topEligible,
      topAlmostEligible,
      language
    });
    return res.json({ ok: true, ...data });
  } catch (err) {
    const statusCode = err.code === 'AI_NOT_CONFIGURED' || err.code === 'AI_DISABLED' ? 503 : err.status || 502;
    return res.status(statusCode).json({
      ok: false,
      fallbackRecommended: true,
      code: err.code || 'AI_ERROR',
      error: err.message
    });
  }
});

module.exports = router;
