const { generateWithGemini } = require('./providers/geminiProvider');
const { generateWithOpenAICompat } = require('./providers/openaiCompatProvider');

/**
 * Modular AI Service for ScholarFinder AI.
 * Grounds every AI response in real student data, real CSV scholarship fields,
 * and deterministic JavaScript eligibility results.
 */

function getProviderConfig() {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );
  const compatConfigured = Boolean(
    process.env.AI_COMPAT_API_KEY && process.env.AI_COMPAT_API_KEY !== 'your_compat_api_key_here'
  );

  let configured = false;
  let activeModel = null;

  if (provider === 'gemini') {
    configured = geminiConfigured;
    activeModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  } else if (provider === 'openai-compat') {
    configured = compatConfigured;
    activeModel = process.env.AI_COMPAT_MODEL || 'llama-3.1-8b-instant';
  }

  return {
    provider,
    configured,
    activeModel
  };
}

function buildSystemInstruction(language) {
  const langRule =
    language === 'bn'
      ? 'Respond strictly in natural, clear, formal Bengali (বাংলা). Do NOT mix English words unnecessarily, EXCEPT always preserve official scholarship names, university/provider proper nouns if originally in English, and URLs verbatim.'
      : 'Respond strictly in clear, encouraging, professional English.';

  return [
    'You are ScholarFinder AI, an academic advisor and scholarship application coach.',
    langRule,
    'STRICT GROUNDING RULES:',
    '1. Use ONLY the provided student profile, scholarship dataset record, and deterministic eligibility evaluation.',
    '2. NEVER invent scholarship amounts, CGPA cutoffs, deadlines, department rules, or eligibility guarantees.',
    '3. If a field says "Unspecified" or null, explicitly note that the student must verify it from the official scholarship link.',
    '4. Respect the deterministic status ("eligible", "almost_eligible", or "not_eligible"). Never tell an almost-eligible or not-eligible student that they already qualify.',
    '5. Keep advice actionable, concise, and formatted in clean structured sections.'
  ].join('\n');
}

async function callConfiguredProvider({ prompt, systemInstruction, maxOutputTokens = 700 }) {
  const { provider } = getProviderConfig();

  if (provider === 'none') {
    const err = new Error('AI provider is disabled via AI_PROVIDER=none.');
    err.code = 'AI_DISABLED';
    throw err;
  }

  if (provider === 'openai-compat') {
    return generateWithOpenAICompat({
      prompt,
      systemInstruction,
      baseUrl: process.env.AI_COMPAT_BASE_URL,
      apiKey: process.env.AI_COMPAT_API_KEY,
      model: process.env.AI_COMPAT_MODEL || 'llama-3.1-8b-instant',
      maxOutputTokens
    });
  }

  return generateWithGemini({
    prompt,
    systemInstruction,
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    maxOutputTokens
  });
}

function formatScholarshipForPrompt(scholarship) {
  return {
    name: scholarship.name,
    provider: scholarship.provider || 'Unspecified',
    amount: scholarship.amountDisplay || 'Unspecified',
    requiredCgpa: scholarship.minCgpa !== null && scholarship.minCgpa !== undefined ? scholarship.minCgpa : 'Unspecified',
    eligibleDepartments:
      scholarship.openToAllDepartments
        ? 'Open to all departments'
        : scholarship.departments && scholarship.departments.length > 0
          ? scholarship.departments.join(', ')
          : 'Unspecified',
    financialRequirement: scholarship.financialRequirement || 'Unspecified',
    deadline: scholarship.deadline || 'Unspecified',
    country: scholarship.country || 'Unspecified',
    gender: scholarship.gender || 'All',
    semesterRequirement: scholarship.semesterRequirement || 'Unspecified',
    description: scholarship.description || 'None provided',
    applicationLink: scholarship.link || 'Not provided'
  };
}

/**
 * Generates personalized explanation, application advice, improvement steps, and short guide
 * for a single scholarship matched against a student.
 */
async function explainScholarship({ student, scholarship, matchResult, language = 'en' }) {
  const systemInstruction = buildSystemInstruction(language);
  const safeScholarship = formatScholarshipForPrompt(scholarship);

  const prompt = `
Analyze this specific scholarship for the student and return a JSON object with exactly these 4 string keys:
- "summary": 2-3 sentence personalized explanation of why the student is "${matchResult.status}" for "${safeScholarship.name}".
- "advice": 2-3 specific application tips tailored to the student's university (${student.university}), department (${student.department}), semester (${student.semester}), and financial status (${student.financialSupport}).
- "improvements": Specific actions the student should take (if Almost Eligible or Not Eligible, address the exact missing requirements: ${JSON.stringify(matchResult.missingRequirements)}; if Eligible, explain how to strengthen competitiveness and handle any unspecified criteria).
- "guide": A concise 4-step numbered application guide referencing the real deadline (${safeScholarship.deadline}) and link availability.

Output ONLY valid JSON (no markdown code fences around the JSON).

STUDENT PROFILE:
${JSON.stringify({
    name: student.fullName,
    university: student.university,
    department: student.department,
    cgpa: student.cgpa,
    semester: student.semester,
    financialSupportRequired: student.financialSupport,
    country: student.country
  })}

SCHOLARSHIP RECORD:
${JSON.stringify(safeScholarship)}

DETERMINISTIC MATCH EVALUATION:
${JSON.stringify({
    status: matchResult.status,
    passedCriteria: matchResult.passedCriteria,
    missingRequirements: matchResult.missingRequirements,
    unspecifiedRequirements: matchResult.unspecifiedRequirements,
    cgpaGap: matchResult.cgpaGap
  })}
`.trim();

  const result = await callConfiguredProvider({ prompt, systemInstruction, maxOutputTokens: 850 });
  const parsed = tryParseStructuredJson(result.text);

  return {
    source: 'ai',
    provider: result.provider,
    model: result.model,
    language,
    structured: parsed || {
      summary: result.text,
      advice: '',
      improvements: '',
      guide: ''
    }
  };
}

/**
 * Generates high-level personalized scholarship recommendations and roadmap
 * across the student's matched dataset.
 */
async function recommendScholarships({ student, summaryStats, topEligible = [], topAlmostEligible = [], language = 'en' }) {
  const systemInstruction = buildSystemInstruction(language);

  const prompt = `
Create a personalized scholarship strategy report for this student based ONLY on the real matched dataset counts and top candidates below.
Return ONLY valid JSON (no markdown fences) with these exact keys:
- "overview": 2-3 sentences summarizing their current standing (${summaryStats.eligibleCount} eligible, ${summaryStats.almostEligibleCount} almost eligible out of ${summaryStats.totalCount}).
- "topRecommendations": 2-4 sentences naming specific eligible or almost-eligible scholarships from the list below and why they fit.
- "improvementPlan": 2-4 sentences explaining concrete steps to unlock the Almost Eligible scholarships (using exact CGPA gaps or missing items shown below).
- "next7Days": 3 concise action items for this week (prioritizing earliest real deadlines).

STUDENT PROFILE:
${JSON.stringify({
    name: student.fullName,
    university: student.university,
    department: student.department,
    cgpa: student.cgpa,
    semester: student.semester,
    financialSupportRequired: student.financialSupport,
    country: student.country
  })}

TOP ELIGIBLE SCHOLARSHIPS:
${JSON.stringify(topEligible.slice(0, 5))}

TOP ALMOST ELIGIBLE SCHOLARSHIPS:
${JSON.stringify(topAlmostEligible.slice(0, 5))}
`.trim();

  const result = await callConfiguredProvider({ prompt, systemInstruction, maxOutputTokens: 900 });
  const parsed = tryParseStructuredJson(result.text);

  return {
    source: 'ai',
    provider: result.provider,
    model: result.model,
    language,
    structured: parsed || {
      overview: result.text,
      topRecommendations: '',
      improvementPlan: '',
      next7Days: ''
    }
  };
}

function tryParseStructuredJson(rawText) {
  if (!rawText) return null;
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const obj = JSON.parse(cleaned);
    if (obj && typeof obj === 'object') {
      return obj;
    }
    return null;
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

module.exports = {
  getProviderConfig,
  explainScholarship,
  recommendScholarships
};
