import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CSV = require('../frontend/js/csvLoader.js');

test('parseCSV handles BOM, quoted commas, escaped quotes, and CRLF', () => {
  const input =
    '\uFEFFScholarship Name,Provider,Amount,Required CGPA,Eligible Departments,Deadline\r\n' +
    '"Merit ""Gold"" Award","University Foundation, Dhaka","$2,500",3.50,"CSE, EEE",2026-12-15\r\n' +
    'Open Access Grant,Tech Trust,BDT 40000,N/A,Open to All,15/01/2027\r\n';

  const rows = CSV.parseCSV(input);
  assert.equal(rows.length, 3);
  assert.equal(rows[1][0], 'Merit "Gold" Award');
  assert.equal(rows[1][1], 'University Foundation, Dhaka');
  assert.equal(rows[1][2], '$2,500');
  assert.equal(rows[2][3], 'N/A');
});

test('validateAndNormalizeDataset maps varied headers, handles missing values, and preserves extra fields', () => {
  const csvText = [
    'Title,Sponsor,Funding Value,Min GPA,Field of Study,Need Based,Last Date,Official Portal,Special Note',
    'STEM Excellence Grant,National Foundation,"$3,000",3.60,"CSE; SWE; IT",No,2026-12-20,https://example.org/apply,Interview required',
    'Community Support Fund,Local Trust,BDT 25000,,All Departments,Yes,,www.example.org/fund,',
    ',Missing Name Corp,$500,3.0,CSE,No,2026-12-30,https://example.org,Should be skipped'
  ].join('\n');

  const result = CSV.validateAndNormalizeDataset(csvText, 'unit-test.csv');
  assert.equal(result.totalRows, 3);
  assert.equal(result.validCount, 2);
  assert.equal(result.skippedRows, 1);

  const first = result.scholarships[0];
  assert.equal(first.name, 'STEM Excellence Grant');
  assert.equal(first.minCgpa, 3.6);
  assert.equal(first.amountNumeric, 3000);
  assert.deepEqual(first.departments, ['CSE', 'SWE', 'IT']);
  assert.equal(first.openToAllDepartments, false);
  assert.equal(first.extraFields['Special Note'], 'Interview required');

  const second = result.scholarships[1];
  assert.equal(second.minCgpa, null);
  assert.equal(second.openToAllDepartments, true);
  assert.equal(second.deadline, null);
  assert.equal(second.link, 'https://www.example.org/fund');
});

test('exportResultsToCsv produces valid CSV output with BOM', () => {
  const matched = [
    {
      scholarship: {
        id: 'sch_1',
        name: 'STEM Grant',
        provider: 'Trust',
        amountDisplay: '$1,000',
        minCgpa: 3.5,
        openToAllDepartments: false,
        departments: ['CSE', 'EEE'],
        deadline: '2026-12-20',
        link: 'https://example.org'
      },
      match: {
        status: 'almost_eligible',
        missingRequirements: ['Required CGPA: 3.50 | Your CGPA: 3.40 | Missing CGPA: 0.10']
      }
    }
  ];

  const csvOut = CSV.exportResultsToCsv(matched, new Set(['sch_1']), { sch_1: 'preparing' });
  assert.ok(csvOut.startsWith('\uFEFFScholarship Name,'));
  assert.ok(csvOut.includes('almost_eligible'));
  assert.ok(csvOut.includes('preparing'));
});

test('loads and validates all 136 scholarships from frontend/data/track3_scholarships.csv', () => {
  const csvPath = path.join(process.cwd(), 'frontend', 'data', 'track3_scholarships.csv');
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const parsed = CSV.validateAndNormalizeDataset(rawCsv, 'track3_scholarships.csv');

  assert.equal(parsed.totalRows, 136);
  assert.equal(parsed.validCount, 136);
  assert.equal(parsed.skippedRows, 0);
  assert.equal(parsed.scholarships[0].name, 'Merit Excellence Award');
  assert.equal(parsed.scholarships[0].amountDisplay, 'BDT 30,000');
  assert.equal(parsed.scholarships[0].amountNumeric, 30000);
  assert.equal(parsed.scholarships[4].gender, 'Female');
  assert.equal(parsed.scholarships[135].name, 'Academic Excellence Award');
});

test('loads and validates all 136 scholarships from backend/data/track3_scholarships.csv', () => {
  const csvPath = path.join(process.cwd(), 'backend', 'data', 'track3_scholarships.csv');
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const parsed = CSV.validateAndNormalizeDataset(rawCsv, 'track3_scholarships.csv (Backend)');

  assert.equal(parsed.totalRows, 136);
  assert.equal(parsed.validCount, 136);
  assert.equal(parsed.skippedRows, 0);
});
