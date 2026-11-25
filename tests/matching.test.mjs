import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CSV = require('../frontend/js/csvLoader.js');
const Matching = require('../frontend/js/matching.js');
const AI = require('../frontend/js/scholarship.js');

const baseStudent = {
  fullName: 'Ayesha Rahman',
  university: 'University of Dhaka',
  department: 'CSE',
  cgpa: 3.4,
  semester: '5',
  financialSupport: 'Full',
  country: 'Bangladesh',
  email: 'ayesha@example.edu'
};

test('marks student Eligible when all specified rules pass (including department synonym expansion)', () => {
  const scholarship = {
    id: 's1',
    name: 'Tech Leaders Scholarship',
    minCgpa: 3.25,
    openToAllDepartments: false,
    departments: ['Computer Science and Engineering', 'EEE'],
    financialRequirement: 'Need-based',
    country: 'Bangladesh',
    semesterRequirement: null
  };

  const res = Matching.evaluateScholarship(baseStudent, scholarship);
  assert.equal(res.status, 'eligible');
  assert.equal(res.missingRequirements.length, 0);
  assert.equal(res.cgpaGap, 0);
  assert.ok(res.unspecifiedRequirements.length >= 1);
});

test('marks student Almost Eligible with exact CGPA delta when missing CGPA is within margin', () => {
  const scholarship = {
    id: 's2',
    name: 'Dean Merit Scholarship',
    minCgpa: 3.5,
    openToAllDepartments: true,
    departments: [],
    financialRequirement: 'Merit and Need',
    country: 'All',
    semesterRequirement: null
  };

  const res = Matching.evaluateScholarship(baseStudent, scholarship);
  assert.equal(res.status, 'almost_eligible');
  assert.equal(res.cgpaGap, 0.1);
  assert.ok(res.missingRequirements[0].includes('Required CGPA: 3.50'));
  assert.ok(res.missingRequirements[0].includes('Your CGPA: 3.40'));
  assert.ok(res.missingRequirements[0].includes('Missing CGPA: 0.10'));
});

test('never falsely marks student Eligible when department does not match', () => {
  const scholarship = {
    id: 's3',
    name: 'Business Excellence Award',
    minCgpa: 3.0,
    openToAllDepartments: false,
    departments: ['BBA', 'Economics'],
    financialRequirement: 'Merit-based',
    country: 'Bangladesh',
    semesterRequirement: null
  };

  const res = Matching.evaluateScholarship(baseStudent, scholarship);
  assert.equal(res.status, 'not_eligible');
  assert.ok(res.missingRequirements.some((m) => m.includes('BBA')));
});

test('marks Not Eligible when CGPA gap exceeds almost-eligible threshold', () => {
  const scholarship = {
    id: 's4',
    name: 'Platinum Honors Grant',
    minCgpa: 3.9,
    openToAllDepartments: true,
    departments: [],
    financialRequirement: null,
    country: null,
    semesterRequirement: null
  };

  const res = Matching.evaluateScholarship(baseStudent, scholarship);
  assert.equal(res.status, 'not_eligible');
  assert.equal(res.cgpaGap, 0.5);
});

test('JavaScript fallback explanation supports both English and Bangla while keeping official name', () => {
  const scholarship = {
    id: 's2',
    name: 'Dean Merit Scholarship',
    minCgpa: 3.5,
    deadline: '2026-12-30'
  };
  const match = Matching.evaluateScholarship(baseStudent, {
    ...scholarship,
    openToAllDepartments: true,
    departments: []
  });

  const en = AI.buildFallbackExplanation(baseStudent, scholarship, match, 'en');
  assert.equal(en.source, 'fallback');
  assert.ok(en.structured.summary.includes('Dean Merit Scholarship'));
  assert.ok(en.structured.summary.includes('0.10'));

  const bn = AI.buildFallbackExplanation(baseStudent, scholarship, match, 'bn');
  assert.equal(bn.source, 'fallback');
  assert.ok(bn.structured.summary.includes('Dean Merit Scholarship'));
  assert.ok(bn.structured.summary.includes('সিজিপিএ'));
});

test('evaluates all 136 real scholarships accurately for gender and need_based=no', () => {
  const csvPath = path.join(process.cwd(), 'frontend', 'data', 'track3_scholarships.csv');
  const parsed = CSV.validateAndNormalizeDataset(fs.readFileSync(csvPath, 'utf8'), 'track3_scholarships.csv');

  const maleCseStudent = { ...baseStudent, gender: 'Male', cgpa: 3.4, department: 'CSE', financialSupport: 'Full' };
  const resultsMale = Matching.evaluateAllScholarships(maleCseStudent, parsed.scholarships);
  assert.equal(resultsMale.length, 136);

  // Row 5: Women in Tech Scholarship (gender=Female, dept=CSE;EEE, min_cgpa=3.0)
  const womenInTechMale = resultsMale.find((r) => r.scholarship.name === 'Women in Tech Scholarship');
  assert.equal(womenInTechMale.match.status, 'not_eligible');

  // Row 3: Coders of Tomorrow Grant (dept=CSE, min_cgpa=3.2, need_based=no, gender=All)
  const codersGrant = resultsMale.find((r) => r.scholarship.name === 'Coders of Tomorrow Grant');
  assert.equal(codersGrant.match.status, 'eligible');

  // Row 2: Future Engineer Scholarship (dept=CSE;EEE;CE, min_cgpa=3.5 -> missing 0.10)
  const futureEng = resultsMale.find((r) => r.scholarship.name === 'Future Engineer Scholarship');
  assert.equal(futureEng.match.status, 'almost_eligible');
  assert.equal(futureEng.match.cgpaGap, 0.1);

  const femaleCseStudent = { ...maleCseStudent, gender: 'Female' };
  const resultsFemale = Matching.evaluateAllScholarships(femaleCseStudent, parsed.scholarships);
  const womenInTechFemale = resultsFemale.find((r) => r.scholarship.name === 'Women in Tech Scholarship');
  assert.equal(womenInTechFemale.match.status, 'eligible');
});
