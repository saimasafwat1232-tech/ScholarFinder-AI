(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ScholarFinderCSV = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  /**
   * RFC-4180 compliant CSV parser.
   * Handles BOM, quoted commas, escaped quotes (""), and multiline quoted cells.
   */
  function parseCSV(text) {
    if (typeof text !== 'string') {
      throw new Error('CSV input must be text.');
    }

    const cleanText = text.replace(/^\uFEFF/, '');
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const ch = cleanText[i];
      const next = cleanText[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          currentCell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          currentCell += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if (ch === '\r' && next === '\n') {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
          i++;
        } else if (ch === '\n' || ch === '\r') {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += ch;
        }
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }

    // Filter completely blank lines
    return rows.filter((row) => row.some((cell) => cell !== ''));
  }

  function normalizeHeaderKey(header) {
    return String(header || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  // Flexible alias table so varied Google Sheets / track3_scholarships CSV headers map automatically
  const FIELD_ALIASES = {
    id: ['id', 'scholarship_id', 'sl', 'serial', 'no', 'code'],
    name: [
      'scholarship_name',
      'name',
      'title',
      'scholarship',
      'scholarship_title',
      'program_name',
      'grant_name'
    ],
    provider: [
      'provider',
      'organization',
      'organisation',
      'sponsor',
      'donor',
      'institution',
      'offered_by',
      'university_organization',
      'funding_body',
      'source'
    ],
    amount: [
      'amount',
      'amount_bdt',
      'scholarship_amount',
      'award',
      'award_amount',
      'stipend',
      'funding',
      'value',
      'benefit',
      'financial_benefit',
      'grant_amount'
    ],
    minCgpa: [
      'required_cgpa',
      'min_cgpa',
      'minimum_cgpa',
      'cgpa',
      'gpa',
      'min_gpa',
      'required_gpa',
      'cgpa_requirement'
    ],
    departments: [
      'eligible_departments',
      'eligible_department',
      'departments',
      'department',
      'eligible_dept',
      'dept',
      'majors',
      'major',
      'field_of_study',
      'fields',
      'faculty',
      'discipline'
    ],
    openToAll: [
      'open_to_all',
      'open_to_all_departments',
      'all_departments',
      'is_open_to_all'
    ],
    financialRequirement: [
      'financial_need',
      'financial_requirement',
      'financial_support',
      'financial_eligibility',
      'need_based',
      'scholarship_type',
      'type',
      'category',
      'income_requirement'
    ],
    deadline: [
      'deadline',
      'application_deadline',
      'last_date',
      'due_date',
      'closing_date',
      'end_date'
    ],
    country: [
      'country',
      'eligible_country',
      'eligible_countries',
      'nationality',
      'region',
      'location'
    ],
    gender: [
      'gender',
      'eligible_gender',
      'sex'
    ],
    semesterRequirement: [
      'semester',
      'eligible_semester',
      'eligible_semesters',
      'year',
      'study_level',
      'academic_level',
      'level'
    ],
    link: [
      'application_link',
      'apply_link',
      'link',
      'url',
      'website',
      'apply_url',
      'application_url',
      'official_link',
      'official_portal',
      'portal_link',
      'portal'
    ],
    description: [
      'description',
      'details',
      'eligibility_criteria',
      'eligibility',
      'requirements',
      'summary',
      'notes',
      'remarks'
    ]
  };

  function detectColumnMap(headers) {
    const normalized = headers.map((h) => normalizeHeaderKey(h));
    const map = {};
    const usedIndexes = new Set();

    Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
      for (const alias of aliases) {
        const idx = normalized.findIndex((h, i) => !usedIndexes.has(i) && h === alias);
        if (idx !== -1) {
          map[field] = idx;
          usedIndexes.add(idx);
          return;
        }
      }
      // Second pass: substring match for descriptive headers like "Minimum CGPA Required (4.0)"
      for (const alias of aliases) {
        const idx = normalized.findIndex(
          (h, i) => !usedIndexes.has(i) && alias.length >= 4 && h.includes(alias)
        );
        if (idx !== -1) {
          map[field] = idx;
          usedIndexes.add(idx);
          return;
        }
      }
    });

    return { map, usedIndexes };
  }

  function isMissingValue(val) {
    if (val === null || val === undefined) return true;
    const s = String(val).trim().toLowerCase();
    return s === '' || s === 'n/a' || s === 'na' || s === 'none' || s === 'null' || s === '-' || s === 'unspecified' || s === 'not specified';
  }

  function parseMinCgpa(raw) {
    if (isMissingValue(raw)) return null;
    const str = String(raw).trim();
    if (/^(no\s*minimum|none|not\s*required|any)$/i.test(str)) return null;
    const match = str.match(/(\d+(?:\.\d+)?)/);
    if (!match) return null;
    const num = parseFloat(match[1]);
    if (Number.isNaN(num) || num < 0 || num > 5) return null;
    return Number(num.toFixed(2));
  }

  function parseDepartments(rawDept, rawOpenAll) {
    const openFlagText = String(rawOpenAll || '').trim().toLowerCase();
    const deptText = String(rawDept || '').trim();

    const openPatterns = /\b(all|any|every|open\s*to\s*all|all\s*departments|all\s*disciplines|all\s*majors|general|সকল)\b/i;

    if (openFlagText === 'yes' || openFlagText === 'true' || openFlagText === '1' || openPatterns.test(openFlagText)) {
      return { openToAllDepartments: true, departments: [] };
    }

    if (isMissingValue(deptText)) {
      return { openToAllDepartments: false, departments: [] };
    }

    if (openPatterns.test(deptText)) {
      return { openToAllDepartments: true, departments: [] };
    }

    const parts = deptText
      .split(/[,;/|&\n]+|\band\b/i)
      .map((p) => p.trim())
      .filter((p) => p && !isMissingValue(p));

    return {
      openToAllDepartments: false,
      departments: Array.from(new Set(parts))
    };
  }

  function parseAmountNumber(raw) {
    if (isMissingValue(raw)) return 0;
    const str = String(raw).replace(/,/g, '');
    if (/full\s*tuition|100%|fully\s*funded/i.test(str)) {
      return 1000000; // Sorts full-funded scholarships near top
    }
    const matches = str.match(/\d+(?:\.\d+)?/g);
    if (!matches || matches.length === 0) return 0;
    // Use largest number if a range is listed (e.g. "$1,000 - $5,000")
    return Math.max(...matches.map((m) => parseFloat(m)).filter((n) => !Number.isNaN(n)));
  }

  function parseDeadlineDate(raw, nowDate = new Date()) {
    if (isMissingValue(raw)) {
      return { deadlineDisplay: null, deadlineIso: null, timestamp: null, daysRemaining: null };
    }
    const str = String(raw).trim();

    // Try standard Date parsing first (ISO YYYY-MM-DD, Month DD YYYY, etc.)
    let parsed = null;
    const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (isoMatch) {
      parsed = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    } else {
      // Handle DD/MM/YYYY or DD-MM-YYYY
      const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (dmyMatch) {
        const first = Number(dmyMatch[1]);
        const second = Number(dmyMatch[2]);
        const year = Number(dmyMatch[3]);
        // If first > 12 it is definitely DD/MM/YYYY; otherwise assume DD/MM/YYYY for South Asia / standard CSV unless month > 12
        if (second <= 12) {
          parsed = new Date(year, second - 1, first);
        } else {
          parsed = new Date(year, first - 1, second);
        }
      } else {
        const ts = Date.parse(str);
        if (!Number.isNaN(ts)) {
          parsed = new Date(ts);
        }
      }
    }

    if (!parsed || Number.isNaN(parsed.getTime())) {
      return { deadlineDisplay: str, deadlineIso: null, timestamp: null, daysRemaining: null };
    }

    const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    const startOfDeadline = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const daysRemaining = Math.round((startOfDeadline - startOfToday) / (1000 * 60 * 60 * 24));
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');

    return {
      deadlineDisplay: str,
      deadlineIso: `${yyyy}-${mm}-${dd}`,
      timestamp: startOfDeadline.getTime(),
      daysRemaining
    };
  }

  function sanitizeLink(raw) {
    if (isMissingValue(raw)) return null;
    const trimmed = String(raw).trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
    return null;
  }

  function validateAndNormalizeDataset(csvText, sourceName = 'uploaded.csv') {
    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      throw new Error('CSV must contain a header row and at least one scholarship record.');
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const { map, usedIndexes } = detectColumnMap(headers);

    // Fallback: if name wasn't matched by header alias, pick first non-empty text column
    if (map.name === undefined) {
      if (headers.length > 0) {
        map.name = 0;
        usedIndexes.add(0);
      } else {
        throw new Error('Could not detect a Scholarship Name column in the CSV.');
      }
    }

    const scholarships = [];
    const warnings = [];
    let skippedRows = 0;

    dataRows.forEach((row, index) => {
      const getVal = (field) => {
        const idx = map[field];
        return idx !== undefined && idx < row.length ? row[idx] : '';
      };

      const rawName = getVal('name');
      if (isMissingValue(rawName)) {
        skippedRows++;
        warnings.push(`Row ${index + 2} skipped: missing scholarship name.`);
        return;
      }

      const rawId = getVal('id');
      const id = !isMissingValue(rawId)
        ? `sch_${String(rawId).replace(/[^a-zA-Z0-9_-]/g, '')}_${index + 1}`
        : `sch_${index + 1}_${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`;

      const rawProvider = getVal('provider');
      const rawAmount = getVal('amount');
      const rawCgpa = getVal('minCgpa');
      const rawDept = getVal('departments');
      const rawOpenAll = getVal('openToAll');
      const rawFinancial = getVal('financialRequirement');
      const rawDeadline = getVal('deadline');
      const rawCountry = getVal('country');
      const rawGender = getVal('gender');
      const rawSemester = getVal('semesterRequirement');
      const rawLink = getVal('link');
      const rawDesc = getVal('description');

      const amountHeader = map.amount !== undefined ? normalizeHeaderKey(headers[map.amount]) : '';
      let formattedAmount = isMissingValue(rawAmount) ? null : rawAmount.trim();
      if (formattedAmount && amountHeader.includes('bdt') && /^\d+(?:\.\d+)?$/.test(formattedAmount)) {
        formattedAmount = `BDT ${Number(formattedAmount).toLocaleString('en-US')}`;
      }

      const deptParsed = parseDepartments(rawDept, rawOpenAll);
      const deadlineParsed = parseDeadlineDate(rawDeadline);

      // Preserve any extra unmapped columns so no CSV data is ever hidden or lost
      const extraFields = {};
      headers.forEach((headerName, colIdx) => {
        if (!usedIndexes.has(colIdx) && row[colIdx] && !isMissingValue(row[colIdx])) {
          extraFields[headerName] = row[colIdx];
        }
      });

      scholarships.push({
        id,
        rowNumber: index + 2,
        name: rawName.trim(),
        provider: isMissingValue(rawProvider) ? null : rawProvider.trim(),
        amountDisplay: formattedAmount,
        amountNumeric: parseAmountNumber(rawAmount),
        minCgpa: parseMinCgpa(rawCgpa),
        minCgpaRaw: isMissingValue(rawCgpa) ? null : rawCgpa.trim(),
        openToAllDepartments: deptParsed.openToAllDepartments,
        departments: deptParsed.departments,
        departmentsRaw: isMissingValue(rawDept) ? null : rawDept.trim(),
        financialRequirement: isMissingValue(rawFinancial) ? null : rawFinancial.trim(),
        deadline: deadlineParsed.deadlineDisplay,
        deadlineIso: deadlineParsed.deadlineIso,
        deadlineTimestamp: deadlineParsed.timestamp,
        daysRemaining: deadlineParsed.daysRemaining,
        country: isMissingValue(rawCountry) ? null : rawCountry.trim(),
        gender: isMissingValue(rawGender) ? null : rawGender.trim(),
        semesterRequirement: isMissingValue(rawSemester) ? null : rawSemester.trim(),
        link: sanitizeLink(rawLink),
        description: isMissingValue(rawDesc) ? null : rawDesc.trim(),
        extraFields
      });
    });

    if (scholarships.length === 0) {
      throw new Error('No valid scholarship rows were found after validation.');
    }

    const detectedColumns = {};
    Object.entries(map).forEach(([field, idx]) => {
      detectedColumns[field] = headers[idx];
    });

    return {
      sourceName,
      loadedAt: new Date().toISOString(),
      totalRows: dataRows.length,
      validCount: scholarships.length,
      skippedRows,
      headers,
      detectedColumns,
      warnings: warnings.slice(0, 10),
      scholarships
    };
  }

  async function tryAutoLoadLocalCsv(backendBaseUrl = '') {
    // 1. Primary source: Backend-hosted CSV dataset (/api/scholarships)
    if (typeof fetch === 'function' && backendBaseUrl) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 3500) : null;
        const apiUrl = `${backendBaseUrl.replace(/\/+$/, '')}/api/scholarships`;
        const res = await fetch(apiUrl, {
          cache: 'no-store',
          signal: controller ? controller.signal : undefined
        });
        if (timer) clearTimeout(timer);
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.ok && data.csv) {
            return validateAndNormalizeDataset(data.csv, data.sourceName || 'track3_scholarships.csv (Backend)');
          }
        }
      } catch {
        // Backend offline or unreachable; fall through to local/bundled CSV
      }
    }

    // 2. Fallback: Local static CSV file when served over HTTP
    if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
      const candidates = [
        './data/track3_scholarships.csv',
        './data/track3_scholarships (1).csv'
      ];

      for (const path of candidates) {
        try {
          const res = await fetch(path, { cache: 'no-store' });
          if (!res.ok) continue;
          const text = await res.text();
          if (!text || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            continue;
          }
          return validateAndNormalizeDataset(text, path.replace('./data/', ''));
        } catch {
          // Ignore and try next candidate
        }
      }
    }

    // 3. Offline fallback: Bundled primary CSV (ensures all 136 records work even without backend or via file://)
    if (typeof window !== 'undefined' && window.SCHOLARFINDER_BUNDLED_CSV) {
      return validateAndNormalizeDataset(
        window.SCHOLARFINDER_BUNDLED_CSV,
        window.SCHOLARFINDER_BUNDLED_SOURCE || 'track3_scholarships.csv'
      );
    }

    return null;
  }

  async function fetchGoogleSheetCsv(sheetUrl, backendBaseUrl = '') {
    const cleanUrl = String(sheetUrl || '').trim();
    if (!cleanUrl) {
      throw new Error('Please enter a Google Sheets URL.');
    }

    // 1. Try backend proxy first if configured (avoids browser CORS issues)
    if (backendBaseUrl) {
      try {
        const apiUrl = `${backendBaseUrl.replace(/\/+$/, '')}/api/sheets/fetch?url=${encodeURIComponent(cleanUrl)}`;
        const resp = await fetch(apiUrl);
        const data = await resp.json().catch(() => null);
        if (resp.ok && data && data.ok && data.csv) {
          return validateAndNormalizeDataset(data.csv, 'Google Sheets (Live)');
        }
        if (data && data.code === 'SHEET_INACCESSIBLE') {
          throw new Error(data.error);
        }
      } catch (err) {
        if (err.message && err.message.includes('Google Sheet is private')) {
          throw err;
        }
        // If backend is offline, fall through to direct browser fetch attempt
      }
    }

    // 2. Direct browser fetch fallback for public sheets
    const match = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('Invalid Google Sheets URL format.');
    }
    const exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
    const res = await fetch(exportUrl);
    const body = await res.text();
    if (!res.ok || body.trim().startsWith('<!DOCTYPE') || body.trim().startsWith('<html')) {
      throw new Error(
        `Google Sheet returned HTTP ${res.status} (private or restricted). Open the sheet in Google Sheets, click File → Download → .csv, and upload it directly.`
      );
    }
    return validateAndNormalizeDataset(body, 'Google Sheets (CSV)');
  }

  function escapeCsvCell(val) {
    const s = String(val === null || val === undefined ? '' : val);
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function exportResultsToCsv(matchedItems, savedSet, progressMap) {
    const headers = [
      'Scholarship Name',
      'Provider',
      'Amount',
      'Required CGPA',
      'Eligible Departments',
      'Deadline',
      'Eligibility Status',
      'Missing Requirements',
      'Bookmarked',
      'Application Progress',
      'Application Link'
    ];

    const rows = matchedItems.map(({ scholarship, match }) => [
      scholarship.name,
      scholarship.provider || 'Not specified',
      scholarship.amountDisplay || 'Not specified',
      scholarship.minCgpa !== null ? scholarship.minCgpa.toFixed(2) : 'Not specified',
      scholarship.openToAllDepartments
        ? 'Open to All Departments'
        : scholarship.departments.length
          ? scholarship.departments.join('; ')
          : 'Not specified',
      scholarship.deadline || 'Not specified',
      match.status,
      match.missingRequirements.join(' | '),
      savedSet.has(scholarship.id) ? 'Yes' : 'No',
      progressMap[scholarship.id] || 'not_started',
      scholarship.link || ''
    ]);

    const csvContent =
      '\uFEFF' +
      [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');

    return csvContent;
  }

  return {
    parseCSV,
    normalizeHeaderKey,
    parseMinCgpa,
    parseDepartments,
    parseAmountNumber,
    parseDeadlineDate,
    validateAndNormalizeDataset,
    tryAutoLoadLocalCsv,
    fetchGoogleSheetCsv,
    exportResultsToCsv
  };
});
