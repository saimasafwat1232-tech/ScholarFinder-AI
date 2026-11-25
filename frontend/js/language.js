(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ScholarFinderI18n = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const TRANSLATIONS = {
    en: {
      'nav.home': 'Home',
      'nav.dataset': 'Dataset',
      'nav.profile': 'Student Profile',
      'nav.howItWorks': 'How It Works',
      'nav.dashboard': 'Dashboard',
      'nav.openDashboard': 'Open Dashboard',

      'hero.badge': 'Track 3 • Personalized Learning & Productivity',
      'hero.title': 'Discover Scholarships You Truly Qualify For — With Exact Gap Insights',
      'hero.subtitle': 'ScholarFinder AI combines deterministic JavaScript eligibility verification with free-tier Gemini AI coaching so you never miss eligible funding or almost-eligible opportunities.',
      'hero.ctaPrimary': 'Start Profile Matching',
      'hero.ctaSecondary': 'Go to Dashboard',
      'hero.trust1': '100% Rule-Verified Eligibility',
      'hero.trust2': 'Almost-Eligible CGPA Gap Engine',
      'hero.trust3': 'Full English & বাংলা Support',
      'hero.previewTitle': 'Live System Readiness',
      'hero.datasetLabel': 'Scholarship CSV Dataset',
      'hero.datasetChecking': 'Checking local dataset...',
      'hero.profileLabel': 'Student Profile',
      'hero.profileNotSet': 'Not configured yet',
      'hero.aiLabel': 'AI Coach Engine',
      'hero.aiChecking': 'Checking backend connection...',
      'hero.tier1Desc': 'All specified criteria met',
      'hero.tier2Desc': 'Exact CGPA / rule gap shown',
      'hero.tier3Desc': 'Clear mismatch explanation',

      'dataset.eyebrow': 'Step 1 • Real Scholarship Data',
      'dataset.title': 'Load Your Scholarship Dataset',
      'dataset.subtitle': 'Upload track3_scholarships (1).csv directly or connect a public Google Sheets CSV link. No fake or invented scholarship records are ever used.',
      'dataset.uploadTitle': 'Upload CSV File',
      'dataset.uploadDesc': 'Supports track3_scholarships (1).csv or any exported Google Sheets CSV with automatic column detection and validation.',
      'dataset.dropTitle': 'Drag & drop your CSV file here, or click to browse',
      'dataset.dropHint': 'Recommended: track3_scholarships (1).csv',
      'dataset.sheetsTitle': 'Connect Google Sheets CSV',
      'dataset.sheetsDesc': 'Paste a public Google Sheet link. If the sheet requires login (401/403), export it as CSV from Google Sheets and upload it on the left.',
      'dataset.sheetsUrlLabel': 'Google Sheet URL',
      'dataset.sheetsLoadBtn': 'Fetch from Google Sheets',
      'dataset.exportHelpBtn': 'How to Export CSV?',
      'dataset.exportGuideTitle': 'How to export a private Google Sheet as CSV:',
      'dataset.exportStep1': 'Open the Google Sheet in your browser while signed in.',
      'dataset.exportStep2': 'Click File → Download → Comma Separated Values (.csv).',
      'dataset.exportStep3': 'Upload the downloaded .csv file using the uploader on the left.',

      'profile.eyebrow': 'Step 2 • Your Academic Profile',
      'profile.title': 'Enter Your Student Information',
      'profile.subtitle': 'Your details are stored locally in your browser and matched against real scholarship rules using transparent JavaScript logic.',

      'form.fullName': 'Full Name',
      'form.fullNamePh': 'e.g., Ayesha Rahman',
      'form.university': 'University',
      'form.universityPh': 'e.g., University of Dhaka / BUET / BRACU',
      'form.department': 'Department',
      'form.selectDept': 'Select department...',
      'form.otherDept': 'Other (Specify)',
      'form.departmentCustomPh': 'Enter your exact department name',
      'form.cgpa': 'CGPA (out of 4.00)',
      'form.semester': 'Current Semester',
      'form.selectSemester': 'Select semester...',
      'form.financialSupport': 'Financial Support Required',
      'form.selectFinancial': 'Select financial support need...',
      'form.finFull': 'Yes — Full Financial Support Required',
      'form.finPartial': 'Yes — Partial Financial Support Required',
      'form.finNo': 'No — Merit-Based / Not Required',
      'form.country': 'Country',
      'form.otherCountry': 'Other (Specify)',
      'form.countryCustomPh': 'Enter your country',
      'form.gender': 'Gender (for gender-specific scholarships)',
      'form.genderAny': 'Prefer not to say / Any',
      'form.genderFemale': 'Female',
      'form.genderMale': 'Male',
      'form.email': 'Email (Optional)',
      'form.submitBtn': 'Save Profile & Find Scholarships',
      'form.resetBtn': 'Reset Form',

      'err.required': 'This field is required.',
      'err.cgpaRange': 'Enter a valid CGPA between 0.00 and 4.00.',
      'err.emailInvalid': 'Please enter a valid email address.',

      'how.eyebrow': 'Architecture',
      'how.title': 'Why Students Trust ScholarFinder AI',
      'how.f1Title': 'Deterministic Matching Engine',
      'how.f1Desc': 'Pure JavaScript evaluates CGPA cutoffs, department eligibility, open-to-all flags, and financial need without AI hallucinations or false eligibility claims.',
      'how.f2Title': 'Almost-Eligible Gap Calculator',
      'how.f2Desc': 'Spot scholarships you are just 0.05–0.35 CGPA away from qualifying for, with exact missing requirement breakdowns so you can plan next semester.',
      'how.f3Title': 'Bilingual AI & Offline Fallback',
      'how.f3Desc': 'Powered by free-tier Gemini AI via a secure Node/Express backend, with an automatic JavaScript explanation fallback if the API quota is reached.',

      'footer.note': 'Built for University Hackathon Track 3 (Personalized Learning & Productivity). Student profiles stay in browser LocalStorage; AI API keys stay secured on the backend.',

      'dash.importCsv': 'Import CSV',
      'dash.editProfile': 'Edit Profile',
      'dash.studentSummary': 'Student Profile',
      'dash.datasetSummary': 'Active Dataset',
      'dash.noProfileYet': 'No student profile saved yet.',
      'dash.noDatasetYet': 'No CSV dataset loaded.',
      'dash.changeDataset': 'Load / Change CSV',
      'dash.viewUrgent': 'View Upcoming',
      'dash.searchPh': 'Search scholarship, provider, department...',
      'dash.allDepts': 'All Departments',
      'dash.exportCsv': 'Download CSV',
      'dash.printReport': 'Print Report',
      'dash.saveProfileBtn': 'Save & Recalculate Matches',

      'kpi.total': 'Total Scholarships',
      'kpi.eligible': 'Eligible Scholarships',
      'kpi.almost': 'Almost Eligible',
      'kpi.saved': 'Saved Scholarships',
      'kpi.deadlines': 'Upcoming Deadlines',

      'tabs.all': 'All',
      'tabs.eligible': 'Eligible',
      'tabs.almost': 'Almost Eligible',
      'tabs.notEligible': 'Not Eligible',
      'tabs.saved': 'Saved',

      'sort.bestMatch': 'Sort: Best Match',
      'sort.deadline': 'Sort: Earliest Deadline',
      'sort.amount': 'Sort: Highest Amount',
      'sort.cgpa': 'Sort: Required CGPA',

      'status.eligible': 'Eligible',
      'status.almost_eligible': 'Almost Eligible',
      'status.not_eligible': 'Not Eligible',

      'card.provider': 'Provider',
      'card.amount': 'Amount',
      'card.reqCgpa': 'Required CGPA',
      'card.departments': 'Eligible Departments',
      'card.deadline': 'Deadline',
      'card.openAll': 'Open to All Departments',
      'card.unspecified': 'Not specified',
      'card.applyNow': 'Apply Now',
      'card.noLink': 'No Link Provided',
      'card.viewDetails': 'View Details',
      'card.explainAi': 'AI Guide',
      'card.explaining': 'Generating...',
      'card.progress': 'Progress',
      'card.missingGap': 'Missing Requirements',
      'card.whyNot': 'Unmet Requirements',
      'card.daysLeft': '{days}d left',
      'card.expired': 'Deadline passed',
      'card.dueToday': 'Due today',

      'progress.not_started': 'Not Started',
      'progress.preparing': 'Preparing Docs',
      'progress.in_progress': 'In Progress',
      'progress.submitted': 'Submitted',
      'progress.awarded': 'Awarded',

      'ai.checkingBadge': 'AI Engine',
      'ai.geminiReady': 'Gemini AI Ready',
      'ai.fallbackReady': 'Offline JS Guide Mode',
      'ai.strategyTitle': 'Personalized AI Scholarship Strategy',
      'ai.strategySub': 'Get tailored scholarship recommendations, improvement advice, and a 7-day action plan based on your real CSV matches.',
      'ai.generateStrategy': 'Generate AI Recommendations',
      'ai.overview': 'Profile Overview',
      'ai.topPicks': 'Top Recommendations',
      'ai.improvement': 'How to Unlock More Scholarships',
      'ai.next7Days': '7-Day Action Plan',
      'ai.advice': 'Application Advice',
      'ai.guide': 'Short Application Guide',
      'ai.sourceAi': 'Generated by {provider}',
      'ai.sourceFallback': 'Smart JS Fallback (Offline / Quota Safe)',

      'empty.noDatasetTitle': 'No Scholarship Dataset Loaded Yet',
      'empty.noDatasetDesc': 'To preserve data integrity, ScholarFinder AI never uses fake records. Please upload track3_scholarships (1).csv or connect your Google Sheets CSV export to begin matching.',
      'empty.uploadBtn': 'Upload track3_scholarships (1).csv',
      'empty.sheetsBtn': 'Connect Google Sheets',
      'empty.noProfileTitle': 'Complete Your Student Profile',
      'empty.noProfileDesc': 'Your dataset is loaded! Enter your CGPA, department, semester, and financial support details to calculate Eligible and Almost Eligible scholarships.',
      'empty.createProfileBtn': 'Set Up Student Profile',
      'empty.noMatchTitle': 'No Scholarships Match These Filters',
      'empty.noMatchDesc': 'Try clearing your search query, switching tabs, or selecting All Departments.',
      'empty.clearFilters': 'Clear Filters',

      'modal.ruleAudit': 'Rule-by-Rule Eligibility Verification',
      'modal.criterion': 'Criterion',
      'modal.required': 'Scholarship Rule',
      'modal.yours': 'Your Profile',
      'modal.result': 'Status',
      'modal.pass': 'Passed',
      'modal.fail': 'Missing / Mismatch',
      'modal.unspec': 'Unspecified (Verify Manually)',
      'modal.checklist': 'Application Checklist',
      'modal.extraFields': 'Additional Dataset Fields',
      'modal.aiCoach': 'Personalized AI Explanation & Guide',
      'modal.regenerateAi': 'Regenerate AI Guide',

      'reminders.title': 'Deadline Reminders',
      'reminders.windowLabel': 'Alert me for deadlines within:',
      'reminders.none': 'No scholarships have deadlines within the selected window.',
      'reminders.banner': '{count} eligible or saved scholarship(s) have deadlines within {days} days!',

      'settings.title': 'Backend & AI Connection Settings',
      'settings.desc': 'Configure your Express backend URL (for example http://localhost:5000 locally or your free Render backend URL when deployed on GitHub Pages).',
      'settings.backendLabel': 'Backend API Base URL',
      'settings.saveBtn': 'Save & Test Connection',
      'settings.clearAllBtn': 'Clear Local Data',

      'common.cancel': 'Cancel',
      'toast.csvLoaded': 'Loaded {count} scholarship records from {name}.',
      'toast.csvError': 'Could not parse CSV: {msg}',
      'toast.profileSaved': 'Student profile saved and matches updated!',
      'toast.savedAdded': 'Added to Saved Scholarships.',
      'toast.savedRemoved': 'Removed from Saved Scholarships.',
      'toast.exportedCsv': 'Matched scholarship report exported as CSV.',
      'toast.backendOk': 'Backend connected! AI status: {status}',
      'toast.backendFail': 'Backend unreachable. Offline JS matching and fallback guides remain active.'
    },

    bn: {
      'nav.home': 'হোম',
      'nav.dataset': 'ডাটাসেট',
      'nav.profile': 'শিক্ষার্থীর প্রোফাইল',
      'nav.howItWorks': 'কার্যপ্রণালী',
      'nav.dashboard': 'ড্যাশবোর্ড',
      'nav.openDashboard': 'ড্যাশবোর্ড খুলুন',

      'hero.badge': 'ট্র্যাক ৩ • ব্যক্তিগতকৃত শিক্ষা ও উৎপাদনশীলতা',
      'hero.title': 'আপনার জন্য উপযুক্ত স্কলারশিপ খুঁজুন — সুনির্দিষ্ট ঘাটতি বিশ্লেষণসহ',
      'hero.subtitle': 'স্কলারফাইন্ডার এআই নির্ভুল জাভাস্ক্রিপ্ট যোগ্যতা যাচাইকরণ এবং ফ্রি জেমিনি এআই পরামর্শের সমন্বয়ে কাজ করে, যাতে আপনি যোগ্য ও প্রায়-যোগ্য কোনো সুযোগই মিস না করেন।',
      'hero.ctaPrimary': 'প্রোফাইল ম্যাচিং শুরু করুন',
      'hero.ctaSecondary': 'ড্যাশবোর্ডে যান',
      'hero.trust1': '১০০% নিয়মভিত্তিক যোগ্যতা যাচাই',
      'hero.trust2': 'প্রায়-যোগ্য সিজিপিএ ঘাটতি বিশ্লেষণ',
      'hero.trust3': 'সম্পূর্ণ বাংলা ও ইংরেজি সমর্থন',
      'hero.previewTitle': 'সিস্টেম প্রস্তুতির অবস্থা',
      'hero.datasetLabel': 'স্কলারশিপ সিএসভি ডাটাসেট',
      'hero.datasetChecking': 'স্থানীয় ডাটাসেট পরীক্ষা করা হচ্ছে...',
      'hero.profileLabel': 'শিক্ষার্থীর প্রোফাইল',
      'hero.profileNotSet': 'এখনো সেট করা হয়নি',
      'hero.aiLabel': 'এআই পরামর্শদাতা ইঞ্জিন',
      'hero.aiChecking': 'ব্যাকএন্ড সংযোগ পরীক্ষা করা হচ্ছে...',
      'hero.tier1Desc': 'সকল নির্ধারিত শর্ত পূরণ হয়েছে',
      'hero.tier2Desc': 'সঠিক সিজিপিএ বা শর্তের ঘাটতি দেখানো হয়েছে',
      'hero.tier3Desc': 'অমিলের স্পষ্ট ব্যাখ্যা',

      'dataset.eyebrow': 'ধাপ ১ • প্রকৃত স্কলারশিপ তথ্য',
      'dataset.title': 'স্কলারশিপ ডাটাসেট লোড করুন',
      'dataset.subtitle': 'সরাসরি track3_scholarships (1).csv আপলোড করুন অথবা পাবলিক গুগল শিট লিংক যুক্ত করুন। কখনোই কোনো কাল্পনিক বা ভুয়া স্কলারশিপ তথ্য ব্যবহার করা হয় না।',
      'dataset.uploadTitle': 'সিএসভি ফাইল আপলোড করুন',
      'dataset.uploadDesc': 'স্বয়ংক্রিয় কলাম শনাক্তকরণ ও যাচাইসহ track3_scholarships (1).csv বা যেকোনো গুগল শিট সিএসভি সমর্থন করে।',
      'dataset.dropTitle': 'আপনার সিএসভি ফাইল এখানে টেনে আনুন অথবা ক্লিক করে নির্বাচন করুন',
      'dataset.dropHint': 'প্রস্তাবিত ফাইল: track3_scholarships (1).csv',
      'dataset.sheetsTitle': 'গুগল শিট সিএসভি যুক্ত করুন',
      'dataset.sheetsDesc': 'পাবলিক গুগল শিটের লিংক দিন। শিটটি প্রাইভেট হলে (৪০১/৪০৩) গুগল শিট থেকে সিএসভি হিসেবে ডাউনলোড করে বাম পাশে আপলোড করুন।',
      'dataset.sheetsUrlLabel': 'গুগল শিট ইউআরএল',
      'dataset.sheetsLoadBtn': 'গুগল শিট থেকে লোড করুন',
      'dataset.exportHelpBtn': 'সিএসভি এক্সপোর্ট করার নিয়ম',
      'dataset.exportGuideTitle': 'প্রাইভেট গুগল শিট সিএসভি হিসেবে ডাউনলোড করার নিয়ম:',
      'dataset.exportStep1': 'আপনার ব্রাউজারে সাইন-ইন থাকা অবস্থায় গুগল শিটটি খুলুন।',
      'dataset.exportStep2': 'File → Download → Comma Separated Values (.csv) এ ক্লিক করুন।',
      'dataset.exportStep3': 'ডাউনলোড করা .csv ফাইলটি বাম পাশের আপলোডারে আপলোড করুন।',

      'profile.eyebrow': 'ধাপ ২ • আপনার একাডেমিক প্রোফাইল',
      'profile.title': 'শিক্ষার্থীর তথ্য প্রদান করুন',
      'profile.subtitle': 'আপনার তথ্য ব্রাউজারের লোকাল স্টোরেজে সংরক্ষিত থাকে এবং স্বচ্ছ জাভাস্ক্রিপ্ট নিয়মের মাধ্যমে প্রকৃত স্কলারশিপের সাথে মেলানো হয়।',

      'form.fullName': 'পূর্ণ নাম',
      'form.fullNamePh': 'যেমন: আয়েশা রহমান',
      'form.university': 'বিশ্ববিদ্যালয়',
      'form.universityPh': 'যেমন: ঢাকা বিশ্ববিদ্যালয় / বুয়েট / ব্র্যাক বিশ্ববিদ্যালয়',
      'form.department': 'বিভাগ',
      'form.selectDept': 'বিভাগ নির্বাচন করুন...',
      'form.otherDept': 'অন্যান্য (লিখুন)',
      'form.departmentCustomPh': 'আপনার সঠিক বিভাগের নাম লিখুন',
      'form.cgpa': 'সিজিপিএ (৪.০০ এর মধ্যে)',
      'form.semester': 'বর্তমান সেমিস্টার',
      'form.selectSemester': 'সেমিস্টার নির্বাচন করুন...',
      'form.financialSupport': 'আর্থিক সহায়তা প্রয়োজন?',
      'form.selectFinancial': 'আর্থিক সহায়তার চাহিদা নির্বাচন করুন...',
      'form.finFull': 'হ্যাঁ — সম্পূর্ণ আর্থিক সহায়তা প্রয়োজন',
      'form.finPartial': 'হ্যাঁ — আংশিক আর্থিক সহায়তা প্রয়োজন',
      'form.finNo': 'না — মেধাভিত্তিক / প্রয়োজন নেই',
      'form.country': 'দেশ',
      'form.otherCountry': 'অন্যান্য (লিখুন)',
      'form.countryCustomPh': 'আপনার দেশের নাম লিখুন',
      'form.gender': 'লিঙ্গ (লিঙ্গ-নির্দিষ্ট স্কলারশিপের জন্য)',
      'form.genderAny': 'উল্লেখ করতে চাই না / যেকোনো',
      'form.genderFemale': 'নারী (Female)',
      'form.genderMale': 'পুরুষ (Male)',
      'form.email': 'ইমেইল (ঐচ্ছিক)',
      'form.submitBtn': 'প্রোফাইল সংরক্ষণ ও স্কলারশিপ খুঁজুন',
      'form.resetBtn': 'ফর্ম রিসেট করুন',

      'err.required': 'এই ঘরটি পূরণ করা আবশ্যক।',
      'err.cgpaRange': '০.০০ থেকে ৪.০০ এর মধ্যে সঠিক সিজিপিএ দিন।',
      'err.emailInvalid': 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন।',

      'how.eyebrow': 'স্থাপত্য',
      'how.title': 'শিক্ষার্থীরা কেন স্কলারফাইন্ডার এআই-এ আস্থা রাখে',
      'how.f1Title': 'নির্ভুল নিয়মভিত্তিক ম্যাচিং ইঞ্জিন',
      'how.f1Desc': 'বিশুদ্ধ জাভাস্ক্রিপ্ট সিজিপিএ, বিভাগ, সবার জন্য উন্মুক্ত অবস্থা এবং আর্থিক চাহিদা যাচাই করে—কোনো অনুমান বা ভুল যোগ্যতা দেখায় না।',
      'how.f2Title': 'প্রায়-যোগ্য ঘাটতি বিশ্লেষক',
      'how.f2Desc': 'যে স্কলারশিপগুলোর জন্য আপনার মাত্র ০.০৫–০.৩৫ সিজিপিএ কম আছে, সেগুলো শনাক্ত করুন এবং পরবর্তী সেমিস্টারের লক্ষ্য ঠিক করুন।',
      'how.f3Title': 'বাংলা-ইংরেজি এআই ও অফলাইন ফলব্যাক',
      'how.f3Desc': 'সুরক্ষিত ব্যাকএন্ডের মাধ্যমে ফ্রি জেমিনি এআই চালিত, এবং এআই সীমা শেষ হলে স্বয়ংক্রিয় জাভাস্ক্রিপ্ট ব্যাখ্যা ব্যবস্থা সক্রিয় থাকে।',

      'footer.note': 'বিশ্ববিদ্যালয় হ্যাকাথন ট্র্যাক ৩-এর জন্য নির্মিত। শিক্ষার্থীর তথ্য ব্রাউজারেই থাকে এবং এআই এপিআই কী ব্যাকএন্ডে সুরক্ষিত থাকে।',

      'dash.importCsv': 'সিএসভি আমদানি',
      'dash.editProfile': 'প্রোফাইল সম্পাদনা',
      'dash.studentSummary': 'শিক্ষার্থীর প্রোফাইল',
      'dash.datasetSummary': 'সক্রিয় ডাটাসেট',
      'dash.noProfileYet': 'এখনো কোনো প্রোফাইল সংরক্ষিত হয়নি।',
      'dash.noDatasetYet': 'কোনো সিএসভি ডাটাসেট লোড করা হয়নি।',
      'dash.changeDataset': 'সিএসভি লোড / পরিবর্তন',
      'dash.viewUrgent': 'আসন্ন সময়সীমা দেখুন',
      'dash.searchPh': 'স্কলারশিপের নাম, দাতা বা বিভাগ খুঁজুন...',
      'dash.allDepts': 'সকল বিভাগ',
      'dash.exportCsv': 'সিএসভি ডাউনলোড',
      'dash.printReport': 'রিপোর্ট প্রিন্ট',
      'dash.saveProfileBtn': 'সংরক্ষণ ও পুনরায় যাচাই করুন',

      'kpi.total': 'মোট স্কলারশিপ',
      'kpi.eligible': 'যোগ্য স্কলারশিপ',
      'kpi.almost': 'প্রায় যোগ্য',
      'kpi.saved': 'সংরক্ষিত স্কলারশিপ',
      'kpi.deadlines': 'আসন্ন সময়সীমা',

      'tabs.all': 'সবগুলো',
      'tabs.eligible': 'যোগ্য',
      'tabs.almost': 'প্রায় যোগ্য',
      'tabs.notEligible': 'অযোগ্য',
      'tabs.saved': 'সংরক্ষিত',

      'sort.bestMatch': 'সাজান: সেরা মিল',
      'sort.deadline': 'সাজান: নিকটতম শেষ তারিখ',
      'sort.amount': 'সাজান: সর্বোচ্চ অর্থের পরিমাণ',
      'sort.cgpa': 'সাজান: প্রয়োজনীয় সিজিপিএ',

      'status.eligible': 'যোগ্য',
      'status.almost_eligible': 'প্রায় যোগ্য',
      'status.not_eligible': 'অযোগ্য',

      'card.provider': 'প্রদানকারী সংস্থা',
      'card.amount': 'অর্থের পরিমাণ',
      'card.reqCgpa': 'প্রয়োজনীয় সিজিপিএ',
      'card.departments': 'যোগ্য বিভাগসমূহ',
      'card.deadline': 'আবেদনের শেষ তারিখ',
      'card.openAll': 'সকল বিভাগের জন্য উন্মুক্ত',
      'card.unspecified': 'উল্লেখ নেই',
      'card.applyNow': 'আবেদন করুন',
      'card.noLink': 'লিংক দেওয়া নেই',
      'card.viewDetails': 'বিস্তারিত দেখুন',
      'card.explainAi': 'এআই গাইড',
      'card.explaining': 'তৈরি হচ্ছে...',
      'card.progress': 'অগ্রগতি',
      'card.missingGap': 'যা ঘাটতি রয়েছে',
      'card.whyNot': 'অপূরণীয় শর্তাবলি',
      'card.daysLeft': '{days} দিন বাকি',
      'card.expired': 'সময়সীমা শেষ',
      'card.dueToday': 'আজ শেষ দিন',

      'progress.not_started': 'শুরু হয়নি',
      'progress.preparing': 'কাগজপত্র প্রস্তুতি',
      'progress.in_progress': 'চলমান',
      'progress.submitted': 'জমা দেওয়া হয়েছে',
      'progress.awarded': 'প্রাপ্ত',

      'ai.checkingBadge': 'এআই ইঞ্জিন',
      'ai.geminiReady': 'জেমিনি এআই প্রস্তুত',
      'ai.fallbackReady': 'অফলাইন স্মার্ট গাইড মোড',
      'ai.strategyTitle': 'ব্যক্তিগতকৃত এআই স্কলারশিপ কৌশল',
      'ai.strategySub': 'আপনার প্রকৃত সিএসভি ম্যাচের ওপর ভিত্তি করে ব্যক্তিগত পরামর্শ, উন্নতির দিকনির্দেশনা এবং ৭ দিনের কর্মপরিকল্পনা পান।',
      'ai.generateStrategy': 'এআই সুপারিশ তৈরি করুন',
      'ai.overview': 'প্রোফাইল সারসংক্ষেপ',
      'ai.topPicks': 'শীর্ষ সুপারিশসমূহ',
      'ai.improvement': 'আরও স্কলারশিপ পেতে করণীয়',
      'ai.next7Days': '৭ দিনের কর্মপরিকল্পনা',
      'ai.advice': 'আবেদনের পরামর্শ',
      'ai.guide': 'সংক্ষিপ্ত আবেদন নির্দেশিকা',
      'ai.sourceAi': '{provider} দ্বারা তৈরি',
      'ai.sourceFallback': 'স্মার্ট অফলাইন গাইড (জাভাস্ক্রিপ্ট ফলব্যাক)',

      'empty.noDatasetTitle': 'এখনো কোনো স্কলারশিপ ডাটাসেট লোড হয়নি',
      'empty.noDatasetDesc': 'তথ্যের বিশুদ্ধতা রক্ষায় স্কলারফাইন্ডার এআই কখনোই কাল্পনিক তথ্য ব্যবহার করে না। ম্যাচিং শুরু করতে track3_scholarships (1).csv আপলোড করুন অথবা গুগল শিট যুক্ত করুন।',
      'empty.uploadBtn': 'track3_scholarships (1).csv আপলোড করুন',
      'empty.sheetsBtn': 'গুগল শিট যুক্ত করুন',
      'empty.noProfileTitle': 'আপনার শিক্ষার্থীর প্রোফাইল সম্পূর্ণ করুন',
      'empty.noProfileDesc': 'ডাটাসেট লোড হয়েছে! যোগ্য ও প্রায়-যোগ্য স্কলারশিপ দেখতে আপনার সিজিপিএ, বিভাগ, সেমিস্টার ও আর্থিক তথ্য দিন।',
      'empty.createProfileBtn': 'প্রোফাইল তৈরি করুন',
      'empty.noMatchTitle': 'এই ফিল্টারে কোনো স্কলারশিপ পাওয়া যায়নি',
      'empty.noMatchDesc': 'অনুসন্ধান বাক্স পরিষ্কার করুন অথবা অন্য ট্যাব বা সকল বিভাগ নির্বাচন করুন।',
      'empty.clearFilters': 'ফিল্টার মুছুন',

      'modal.ruleAudit': 'শর্তভিত্তিক যোগ্যতা যাচাইকরণ',
      'modal.criterion': 'শর্ত',
      'modal.required': 'স্কলারশিপের নিয়ম',
      'modal.yours': 'আপনার তথ্য',
      'modal.result': 'অবস্থা',
      'modal.pass': 'পূরণ হয়েছে',
      'modal.fail': 'ঘাটতি / অমিল',
      'modal.unspec': 'উল্লেখ নেই (সরাসরি যাচাই করুন)',
      'modal.checklist': 'আবেদন চেকলিস্ট',
      'modal.extraFields': 'ডাটাসেটের অতিরিক্ত তথ্য',
      'modal.aiCoach': 'ব্যক্তিগতকৃত এআই ব্যাখ্যা ও নির্দেশিকা',
      'modal.regenerateAi': 'পুনরায় এআই গাইড তৈরি করুন',

      'reminders.title': 'আবেদনের সময়সীমা রিমাইন্ডার',
      'reminders.windowLabel': 'কত দিনের মধ্যে শেষ তারিখ হলে সতর্ক করবে:',
      'reminders.none': 'নির্বাচিত সময়ের মধ্যে কোনো স্কলারশিপের শেষ তারিখ নেই।',
      'reminders.banner': '{days} দিনের মধ্যে {count}টি যোগ্য বা সংরক্ষিত স্কলারশিপের আবেদনের শেষ তারিখ রয়েছে!',

      'settings.title': 'ব্যাকএন্ড ও এআই সংযোগ সেটিংস',
      'settings.desc': 'আপনার এক্সপ্রেস ব্যাকএন্ডের ইউআরএল নির্ধারণ করুন (যেমন লোকাল অবস্থায় http://localhost:5000 অথবা ডিপ্লয় করা রেন্ডার ইউআরএল)।',
      'settings.backendLabel': 'ব্যাকএন্ড এপিআই বেস ইউআরএল',
      'settings.saveBtn': 'সংরক্ষণ ও সংযোগ পরীক্ষা করুন',
      'settings.clearAllBtn': 'লোকাল ডাটা মুছুন',

      'common.cancel': 'বাতিল',
      'toast.csvLoaded': '{name} থেকে {count}টি স্কলারশিপ তথ্য লোড হয়েছে।',
      'toast.csvError': 'সিএসভি পড়তে সমস্যা হয়েছে: {msg}',
      'toast.profileSaved': 'প্রোফাইল সংরক্ষিত হয়েছে এবং ফলাফল হালনাগাদ হয়েছে!',
      'toast.savedAdded': 'সংরক্ষিত তালিকায় যোগ করা হয়েছে।',
      'toast.savedRemoved': 'সংরক্ষিত তালিকা থেকে সরানো হয়েছে।',
      'toast.exportedCsv': 'স্কলারশিপ ফলাফল সিএসভি হিসেবে ডাউনলোড হয়েছে।',
      'toast.backendOk': 'ব্যাকএন্ড যুক্ত হয়েছে! এআই অবস্থা: {status}',
      'toast.backendFail': 'ব্যাকএন্ডে সংযোগ পাওয়া যায়নি। অফলাইন ম্যাচিং ও ফলব্যাক গাইড সক্রিয় আছে।'
    }
  };

  function getStoredLanguage() {
    if (typeof localStorage === 'undefined') return 'en';
    const lang = localStorage.getItem('sf_lang_v1');
    return lang === 'bn' ? 'bn' : 'en';
  }

  function setStoredLanguage(lang) {
    const safe = lang === 'bn' ? 'bn' : 'en';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sf_lang_v1', safe);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = safe;
    }
    return safe;
  }

  function t(key, params = {}, langOverride = null) {
    const lang = langOverride || getStoredLanguage();
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    let text = dict[key] || TRANSLATIONS.en[key] || key;
    Object.keys(params).forEach((k) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]));
    });
    return text;
  }

  function applyTranslations(rootElement) {
    if (typeof document === 'undefined') return;
    const root = rootElement || document;
    const lang = getStoredLanguage();
    document.documentElement.lang = lang;

    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key, {}, lang);
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key, {}, lang));
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  return {
    TRANSLATIONS,
    getStoredLanguage,
    setStoredLanguage,
    t,
    applyTranslations
  };
});
