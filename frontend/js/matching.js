(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ScholarFinderMatching = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  // Common university department synonyms for accurate non-fuzzy matching
  const DEPT_ALIASES = {
    cse: ['cse', 'computer science', 'computer science and engineering', 'computer science & engineering', 'cs'],
    eee: ['eee', 'electrical', 'electrical and electronic engineering', 'electrical & electronic engineering', 'ee'],
    swe: ['swe', 'software engineering', 'software'],
    it: ['it', 'information technology', 'ict'],
    ce: ['ce', 'civil engineering', 'civil'],
    me: ['me', 'mechanical engineering', 'mechanical'],
    bba: ['bba', 'business administration', 'business', 'finance', 'accounting', 'marketing', 'management'],
    economics: ['economics', 'econ'],
    english: ['english', 'english literature'],
    pharmacy: ['pharmacy', 'pharmaceutical'],
    architecture: ['architecture', 'arch'],
    mathematics: ['mathematics', 'math', 'applied mathematics'],
    physics: ['physics', 'applied physics'],
    stem: ['stem', 'engineering', 'science', 'technology']
  };

  function normalizeText(val) {
    return String(val || '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function expandDepartmentGroup(deptText) {
    const norm = normalizeText(deptText);
    const groups = new Set([norm]);
    const words = new Set(norm.split(' ').filter(Boolean));

    Object.entries(DEPT_ALIASES).forEach(([key, aliases]) => {
      const matched = aliases.some((alias) => {
        if (norm === alias) return true;
        if (alias.includes(' ')) {
          // Multi-word phrase: check word-bounded phrase match
          const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`\\b${escaped}\\b`, 'i').test(norm);
        }
        // Single-word or abbreviation (e.g. "cs", "it", "ce", "me"): must match whole word token
        return words.has(alias);
      });
      if (matched) {
        groups.add(key);
        aliases.forEach((a) => groups.add(a));
      }
    });
    return groups;
  }

  function isDepartmentMatch(studentDept, scholarship) {
    if (scholarship.openToAllDepartments) {
      return { state: 'pass', reason: 'open_to_all' };
    }
    if (!scholarship.departments || scholarship.departments.length === 0) {
      return { state: 'unspecified', reason: 'no_dept_specified' };
    }

    const studentNorm = normalizeText(studentDept);
    const studentGroups = expandDepartmentGroup(studentDept);

    for (const allowedDept of scholarship.departments) {
      const allowedNorm = normalizeText(allowedDept);
      if (!allowedNorm) continue;

      if (allowedNorm === studentNorm) {
        return { state: 'pass', matched: allowedDept };
      }

      // Check STEM / Engineering umbrella categories if explicitly listed
      if (allowedNorm === 'stem' || allowedNorm === 'engineering' || allowedNorm === 'science') {
        const stemDepts = ['cse', 'eee', 'swe', 'it', 'ce', 'me', 'architecture', 'mathematics', 'physics', 'pharmacy'];
        if (stemDepts.some((s) => studentGroups.has(s))) {
          return { state: 'pass', matched: allowedDept };
        }
      }

      const allowedGroups = expandDepartmentGroup(allowedDept);
      for (const token of studentGroups) {
        if (token.length >= 2 && allowedGroups.has(token)) {
          return { state: 'pass', matched: allowedDept };
        }
      }
    }

    return { state: 'fail', matched: null };
  }

  function evaluateFinancialEligibility(studentFinancial, scholarshipFinancial) {
    if (!scholarshipFinancial) {
      return { state: 'unspecified', rule: 'Unspecified' };
    }

    const rule = normalizeText(scholarshipFinancial);
    const studentNeedsAid = studentFinancial === 'Full' || studentFinancial === 'Partial';

    const explicitlyNeedBased =
      /\b(need\s*based|financial\s*need|low\s*income|economically|poor|underprivileged|yes|required)\b/i.test(rule) &&
      !/\b(not\s*required|merit\s*and\s*need|both|merit\s*only)\b/i.test(rule);

    const meritAndNeed = /\b(both|merit\s*and\s*need|need\s*and\s*merit|merit\s*or\s*need)\b/i.test(rule);
    const meritOnly = /\b(merit\s*based|merit\s*only|academic\s*merit|no|false|not\s*required)\b/i.test(rule) && !meritAndNeed;

    if (explicitlyNeedBased) {
      if (studentNeedsAid) {
        return { state: 'pass', rule: scholarshipFinancial };
      }
      return { state: 'fail', rule: scholarshipFinancial, reason: 'requires_financial_need' };
    }

    if (meritOnly || meritAndNeed) {
      return { state: 'pass', rule: scholarshipFinancial };
    }

    // If text is ambiguous (not clearly restricting), keep transparent
    return { state: 'unspecified', rule: scholarshipFinancial };
  }

  function evaluateCountry(studentCountry, scholarshipCountry) {
    if (!scholarshipCountry) {
      return { state: 'unspecified' };
    }
    const normSch = normalizeText(scholarshipCountry);
    if (/\b(all|any|international|global|worldwide|every)\b/.test(normSch)) {
      return { state: 'pass' };
    }
    const normStudent = normalizeText(studentCountry);
    if (!normStudent) {
      return { state: 'unspecified' };
    }
    const countryAliases = {
      bangladesh: ['bangladesh', 'bd', 'bangladeshi'],
      'united states': ['united states', 'usa', 'us', 'u s a'],
      'united kingdom': ['united kingdom', 'uk', 'britain', 'great britain']
    };
    const expandCountry = (c) => {
      const n = normalizeText(c);
      const set = new Set([n]);
      Object.values(countryAliases).forEach((arr) => {
        if (arr.includes(n)) arr.forEach((x) => set.add(x));
      });
      return set;
    };

    const studentSet = expandCountry(normStudent);
    const parts = scholarshipCountry.split(/[,;/|]+/).map((p) => normalizeText(p)).filter(Boolean);
    if (parts.some((p) => {
      const partSet = expandCountry(p);
      for (const s of studentSet) {
        if (partSet.has(s)) return true;
      }
      return false;
    })) {
      return { state: 'pass' };
    }
    return { state: 'fail' };
  }

  function evaluateGender(studentGender, scholarshipGender) {
    if (!scholarshipGender) {
      return { state: 'unspecified' };
    }
    const normSch = normalizeText(scholarshipGender);
    if (/\b(all|any|everyone|both)\b/.test(normSch)) {
      return { state: 'pass' };
    }
    const normStudent = normalizeText(studentGender);
    if (!normStudent || normStudent === 'unspecified' || normStudent === 'any') {
      return { state: 'unspecified' };
    }
    if (normSch === normStudent || (normSch.includes('female') && normStudent === 'female') || (normSch.includes('male') && !normSch.includes('female') && normStudent === 'male')) {
      return { state: 'pass' };
    }
    return { state: 'fail' };
  }

  function evaluateSemester(studentSemester, scholarshipSemester) {
    if (!scholarshipSemester) {
      return { state: 'unspecified', gap: 0 };
    }

    const normSch = normalizeText(scholarshipSemester);
    if (/\b(all|any|undergraduate|all semesters)\b/.test(normSch) && studentSemester !== 'Graduate') {
      return { state: 'pass', gap: 0 };
    }

    if (/\b(graduate|masters|phd|postgraduate)\b/.test(normSch) && !/\b(undergraduate)\b/.test(normSch)) {
      if (studentSemester === 'Graduate') {
        return { state: 'pass', gap: 0 };
      }
      return { state: 'fail', gap: null, reason: 'graduate_only' };
    }

    const studentSemNum = Number(studentSemester);
    if (Number.isNaN(studentSemNum)) {
      return { state: 'unspecified', gap: 0 };
    }

    // Extract minimum semester number if pattern like "3rd semester+", "semester 4-8", "min 3"
    const nums = (normSch.match(/\d+/g) || []).map(Number);
    if (nums.length === 1 && /\b(min|above|onward|plus|\+|at least|from)\b/.test(scholarshipSemester.toLowerCase())) {
      const minSem = nums[0];
      if (studentSemNum >= minSem) return { state: 'pass', gap: 0 };
      return { state: 'fail', gap: minSem - studentSemNum, requiredMin: minSem };
    }
    if (nums.length >= 2 && /[-–to]/.test(scholarshipSemester)) {
      const minSem = Math.min(...nums);
      const maxSem = Math.max(...nums);
      if (studentSemNum >= minSem && studentSemNum <= maxSem) return { state: 'pass', gap: 0 };
      if (studentSemNum < minSem) return { state: 'fail', gap: minSem - studentSemNum, requiredMin: minSem };
      return { state: 'fail', gap: studentSemNum - maxSem, requiredMax: maxSem };
    }

    return { state: 'unspecified', gap: 0 };
  }

  /**
   * Pure deterministic eligibility evaluation.
   * Never invents rules; never marks a student Eligible if any specified rule fails.
   */
  function evaluateScholarship(student, scholarship, options = {}) {
    const almostCgpaMargin = typeof options.almostCgpaMargin === 'number' ? options.almostCgpaMargin : 0.35;
    const studentCgpa = Number(student.cgpa);

    const checks = [];
    const passedCriteria = [];
    const missingRequirements = [];
    const unspecifiedRequirements = [];
    let cgpaGap = 0;

    // 1. CGPA Check
    if (scholarship.minCgpa === null || scholarship.minCgpa === undefined) {
      unspecifiedRequirements.push('Required CGPA is not specified in dataset');
      checks.push({
        key: 'cgpa',
        labelEn: 'Minimum CGPA',
        labelBn: 'ন্যূনতম সিজিপিএ',
        requiredDisplay: 'Not specified',
        studentDisplay: studentCgpa.toFixed(2),
        state: 'unspecified'
      });
    } else if (studentCgpa >= scholarship.minCgpa) {
      passedCriteria.push(`CGPA ${studentCgpa.toFixed(2)} meets minimum ${scholarship.minCgpa.toFixed(2)}`);
      checks.push({
        key: 'cgpa',
        labelEn: 'Minimum CGPA',
        labelBn: 'ন্যূনতম সিজিপিএ',
        requiredDisplay: scholarship.minCgpa.toFixed(2),
        studentDisplay: studentCgpa.toFixed(2),
        state: 'pass'
      });
    } else {
      cgpaGap = Number((scholarship.minCgpa - studentCgpa).toFixed(2));
      missingRequirements.push(
        `Required CGPA: ${scholarship.minCgpa.toFixed(2)} | Your CGPA: ${studentCgpa.toFixed(2)} | Missing CGPA: ${cgpaGap.toFixed(2)}`
      );
      checks.push({
        key: 'cgpa',
        labelEn: 'Minimum CGPA',
        labelBn: 'ন্যূনতম সিজিপিএ',
        requiredDisplay: scholarship.minCgpa.toFixed(2),
        studentDisplay: studentCgpa.toFixed(2),
        state: 'fail',
        gap: cgpaGap
      });
    }

    // 2. Department Check
    const deptEval = isDepartmentMatch(student.department, scholarship);
    const deptReqDisplay = scholarship.openToAllDepartments
      ? 'Open to All Departments'
      : scholarship.departments.length
        ? scholarship.departments.join(', ')
        : 'Not specified';

    if (deptEval.state === 'pass') {
      passedCriteria.push(
        scholarship.openToAllDepartments
          ? 'Open to all departments'
          : `Department (${student.department}) is eligible`
      );
    } else if (deptEval.state === 'unspecified') {
      unspecifiedRequirements.push('Eligible departments are not specified in dataset');
    } else {
      missingRequirements.push(
        `Eligible department(s): ${deptReqDisplay} | Your department: ${student.department}`
      );
    }
    checks.push({
      key: 'department',
      labelEn: 'Department',
      labelBn: 'বিভাগ',
      requiredDisplay: deptReqDisplay,
      studentDisplay: student.department,
      state: deptEval.state
    });

    // 3. Financial Eligibility Check
    const finEval = evaluateFinancialEligibility(student.financialSupport, scholarship.financialRequirement);
    if (finEval.state === 'pass') {
      passedCriteria.push(`Financial criteria matched (${scholarship.financialRequirement})`);
    } else if (finEval.state === 'unspecified') {
      unspecifiedRequirements.push('Financial eligibility rule is not explicitly specified');
    } else {
      missingRequirements.push(
        `Financial rule: ${scholarship.financialRequirement} | Your selection: ${student.financialSupport}`
      );
    }
    checks.push({
      key: 'financial',
      labelEn: 'Financial Support',
      labelBn: 'আর্থিক যোগ্যতা',
      requiredDisplay: scholarship.financialRequirement || 'Not specified',
      studentDisplay: student.financialSupport,
      state: finEval.state
    });

    // 4. Country Check
    const countryEval = evaluateCountry(student.country, scholarship.country);
    if (countryEval.state === 'pass') {
      passedCriteria.push(`Country eligible (${scholarship.country})`);
    } else if (countryEval.state === 'unspecified') {
      unspecifiedRequirements.push('Country eligibility is not specified');
    } else {
      missingRequirements.push(
        `Eligible country: ${scholarship.country} | Your country: ${student.country}`
      );
    }
    checks.push({
      key: 'country',
      labelEn: 'Country / Region',
      labelBn: 'দেশ / অঞ্চল',
      requiredDisplay: scholarship.country || 'Not specified',
      studentDisplay: student.country,
      state: countryEval.state
    });

    // 5. Semester Check
    const semEval = evaluateSemester(student.semester, scholarship.semesterRequirement);
    if (semEval.state === 'pass') {
      passedCriteria.push(`Semester eligible (${scholarship.semesterRequirement})`);
    } else if (semEval.state === 'unspecified') {
      unspecifiedRequirements.push('Semester requirement is not specified');
    } else {
      missingRequirements.push(
        `Eligible semester: ${scholarship.semesterRequirement} | Your semester: ${student.semester}`
      );
    }
    checks.push({
      key: 'semester',
      labelEn: 'Semester / Level',
      labelBn: 'সেমিস্টার / স্তর',
      requiredDisplay: scholarship.semesterRequirement || 'Not specified',
      studentDisplay: String(student.semester),
      state: semEval.state,
      gap: semEval.gap
    });

    // 6. Gender Check (if specified in dataset)
    const genderEval = evaluateGender(student.gender, scholarship.gender);
    if (scholarship.gender) {
      if (genderEval.state === 'pass') {
        passedCriteria.push(`Gender eligible (${scholarship.gender})`);
      } else if (genderEval.state === 'unspecified') {
        unspecifiedRequirements.push(`Scholarship requires gender: ${scholarship.gender} (your gender not specified)`);
      } else {
        missingRequirements.push(`Eligible gender: ${scholarship.gender} | Your gender: ${student.gender}`);
      }
      checks.push({
        key: 'gender',
        labelEn: 'Gender',
        labelBn: 'লিঙ্গ',
        requiredDisplay: scholarship.gender,
        studentDisplay: student.gender || 'Not specified',
        state: genderEval.state
      });
    }

    // Determine Final Category
    const failedChecks = checks.filter((c) => c.state === 'fail');
    let status = 'not_eligible';

    if (failedChecks.length === 0) {
      status = 'eligible';
    } else {
      const onlyCgpaFailed = failedChecks.length === 1 && failedChecks[0].key === 'cgpa';
      const onlySemesterNear =
        failedChecks.length === 1 &&
        failedChecks[0].key === 'semester' &&
        typeof semEval.gap === 'number' &&
        semEval.gap > 0 &&
        semEval.gap <= 2;
      const onlyFinancialFailed = failedChecks.length === 1 && failedChecks[0].key === 'financial';

      if (onlyCgpaFailed && cgpaGap > 0 && cgpaGap <= almostCgpaMargin) {
        status = 'almost_eligible';
      } else if (onlySemesterNear) {
        status = 'almost_eligible';
      } else if (onlyFinancialFailed) {
        status = 'almost_eligible';
      } else {
        status = 'not_eligible';
      }
    }

    // Score for "Best Match" sorting
    let matchScore = 0;
    if (status === 'eligible') matchScore = 1000 - unspecifiedRequirements.length * 10;
    else if (status === 'almost_eligible') matchScore = 500 - Math.round(cgpaGap * 100);
    else matchScore = 100 - failedChecks.length * 25 - Math.round(cgpaGap * 10);

    return {
      status,
      passedCriteria,
      missingRequirements,
      unspecifiedRequirements,
      checks,
      cgpaGap,
      matchScore
    };
  }

  function evaluateAllScholarships(student, scholarships, options = {}) {
    return scholarships.map((scholarship) => ({
      scholarship,
      match: evaluateScholarship(student, scholarship, options)
    }));
  }

  return {
    evaluateScholarship,
    evaluateAllScholarships,
    isDepartmentMatch,
    evaluateFinancialEligibility
  };
});
