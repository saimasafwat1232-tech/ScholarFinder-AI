(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ScholarFinderAI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  /**
   * Builds a deterministic, grounded, bilingual explanation when the backend AI
   * is offline, unconfigured, or rate-limited.
   */
  function buildFallbackExplanation(student, scholarship, matchResult, language = 'en') {
    const cgpaStr = Number(student.cgpa).toFixed(2);
    const reqCgpaStr = scholarship.minCgpa !== null ? scholarship.minCgpa.toFixed(2) : null;
    const deadlineStr = scholarship.deadline || (language === 'bn' ? 'উল্লেখ নেই' : 'Not specified');

    if (language === 'bn') {
      let summary = '';
      if (matchResult.status === 'eligible') {
        summary = `${student.fullName}, আপনার সিজিপিএ (${cgpaStr}) এবং বিভাগ (${student.department}) অনুযায়ী "${scholarship.name}" স্কলারশিপের সকল নির্ধারিত শর্ত পূরণ হয়েছে।`;
      } else if (matchResult.status === 'almost_eligible') {
        summary = `আপনি "${scholarship.name}" স্কলারশিপটির খুব কাছাকাছি অবস্থানে রয়েছেন। ${
          matchResult.cgpaGap > 0
            ? `প্রয়োজনীয় সিজিপিএ ${reqCgpaStr}, আপনার বর্তমান সিজিপিএ ${cgpaStr} — মাত্র ${matchResult.cgpaGap.toFixed(2)} সিজিপিএ ঘাটতি রয়েছে।`
            : 'একটি শর্ত সামান্য ঘাটতি রয়েছে।'
        }`;
      } else {
        summary = `বর্তমান তথ্য অনুযায়ী "${scholarship.name}" স্কলারশিপের নির্ধারিত শর্তের সাথে (${matchResult.missingRequirements.join('; ')}) আপনার প্রোফাইল মিলছে না।`;
      }

      const advice =
        student.financialSupport !== 'No'
          ? `${student.university}-এর একাডেমিক ট্রান্সক্রিপ্টের পাশাপাশি একটি নির্ভুল আর্থিক সহায়তার বিবরণী ও শিক্ষকের সুপারিশপত্র আগে থেকেই প্রস্তুত রাখুন।`
          : `আপনার একাডেমিক ফলাফল, প্রজেক্ট এবং সহশিক্ষা কার্যক্রম আবেদনের বিবরণীতে স্পষ্টভাবে তুলে ধরুন।`;

      let improvements = '';
      if (matchResult.status === 'almost_eligible' && matchResult.cgpaGap > 0) {
        improvements = `আগামী সেমিস্টারে আপনার সিজিপিএ কমপক্ষে ${matchResult.cgpaGap.toFixed(2)} পয়েন্ট বৃদ্ধি করে ${reqCgpaStr} এ উন্নীত করার লক্ষ্য নিন।`;
      } else if (matchResult.missingRequirements.length > 0) {
        improvements = `ঘাটতি থাকা শর্তসমূহ: ${matchResult.missingRequirements.join(' • ')}। এগুলো পূরণযোগ্য হলে পরবর্তী চক্রের জন্য প্রস্তুতি নিন।`;
      } else if (matchResult.unspecifiedRequirements.length > 0) {
        improvements = `ডাটাসেটে কিছু শর্ত উল্লেখ নেই (${matchResult.unspecifiedRequirements.length}টি)। আবেদন করার আগে অফিশিয়াল লিংকে সকল বিস্তারিত যাচাই করে নিন।`;
      } else {
        improvements = `সকল নির্ধারিত শর্ত পূরণ হয়েছে—শক্তিশালী SOP ও সুপারিশপত্র যুক্ত করে আবেদনের মান বাড়ান।`;
      }

      const guide = [
        `১. অফিশিয়াল লিংক থেকে "${scholarship.name}"-এর সম্পূর্ণ নির্দেশিকা যাচাই করুন।`,
        `২. একাডেমিক ট্রান্সক্রিপ্ট, সিভি এবং সুপারিশপত্র পিডিএফ আকারে প্রস্তুত করুন।`,
        `৩. শেষ তারিখ (${deadlineStr}) এর অন্তত ৩–৫ দিন আগে আবেদনপত্র জমা দিন।`,
        `৪. ড্যাশবোর্ডের চেকলিস্ট ব্যবহার করে প্রতিটি ধাপের অগ্রগতি ট্র্যাক করুন।`
      ].join('\n');

      return {
        source: 'fallback',
        provider: 'javascript-fallback',
        model: 'deterministic-v1',
        language: 'bn',
        structured: { summary, advice, improvements, guide }
      };
    }

    // English deterministic fallback
    let summary = '';
    if (matchResult.status === 'eligible') {
      summary = `${student.fullName}, you meet all specified requirements for "${scholarship.name}" with your ${cgpaStr} CGPA in ${student.department}.`;
    } else if (matchResult.status === 'almost_eligible') {
      summary = `You are very close to qualifying for "${scholarship.name}". ${
        matchResult.cgpaGap > 0
          ? `Required CGPA is ${reqCgpaStr} and yours is ${cgpaStr} (missing ${matchResult.cgpaGap.toFixed(2)}).`
          : `Only a minor requirement gap separates you (${matchResult.missingRequirements.join('; ')}).`
      }`;
    } else {
      summary = `Based on the dataset rules, your profile does not currently qualify for "${scholarship.name}" due to: ${matchResult.missingRequirements.join('; ')}.`;
    }

    const advice =
      student.financialSupport !== 'No'
        ? `Highlight both your academic standing at ${student.university} and your financial support need (${student.financialSupport}) with supporting documentation.`
        : `Emphasize your academic achievements in ${student.department} (${student.university}), coursework, and faculty references.`;

    let improvements = '';
    if (matchResult.status === 'almost_eligible' && matchResult.cgpaGap > 0) {
      improvements = `Raise your CGPA by ${matchResult.cgpaGap.toFixed(2)} points (from ${cgpaStr} to ${reqCgpaStr}) in upcoming semesters to unlock this scholarship.`;
    } else if (matchResult.missingRequirements.length > 0) {
      improvements = `Unmet criteria: ${matchResult.missingRequirements.join(' | ')}. Focus on eligible alternatives first.`;
    } else if (matchResult.unspecifiedRequirements.length > 0) {
      improvements = `Note that ${matchResult.unspecifiedRequirements.length} field(s) were unspecified in the CSV. Double-check the official portal before submitting.`;
    } else {
      improvements = `All listed criteria are met. Strengthen your application with a tailored Statement of Purpose and early faculty recommendations.`;
    }

    const guide = [
      `1. Review official guidelines for "${scholarship.name}" via the application link.`,
      `2. Gather your ${student.university} transcript, CV, and recommendation letters.`,
      `3. Submit your application at least 3–5 days before the deadline (${deadlineStr}).`,
      `4. Track your documents using the interactive checklist in View Details.`
    ].join('\n');

    return {
      source: 'fallback',
      provider: 'javascript-fallback',
      model: 'deterministic-v1',
      language: 'en',
      structured: { summary, advice, improvements, guide }
    };
  }

  function buildFallbackStrategy(student, summaryStats, topEligible, topAlmostEligible, language = 'en') {
    const firstEligible = topEligible[0];
    const firstAlmost = topAlmostEligible[0];

    if (language === 'bn') {
      return {
        source: 'fallback',
        provider: 'javascript-fallback',
        language: 'bn',
        structured: {
          overview: `মোট ${summaryStats.totalCount}টি স্কলারশিপের মধ্যে আপনার প্রোফাইল (সিজিপিএ ${Number(student.cgpa).toFixed(2)}, ${student.department}) অনুযায়ী ${summaryStats.eligibleCount}টি যোগ্য এবং ${summaryStats.almostEligibleCount}টি প্রায়-যোগ্য হিসেবে চিহ্নিত হয়েছে।`,
          topRecommendations: firstEligible
            ? `সর্বোচ্চ অগ্রাধিকার হিসেবে "${firstEligible.name}" (${firstEligible.amount || 'উল্লেখ নেই'}) এবং অন্যান্য যোগ্য স্কলারশিপে দ্রুত আবেদন শুরু করুন।`
            : `এই মুহূর্তে সরাসরি যোগ্য স্কলারশিপ না থাকলে প্রায়-যোগ্য তালিকার সুযোগগুলো লক্ষ্য করে প্রস্তুতি নিন।`,
          improvementPlan: firstAlmost
            ? `"${firstAlmost.name}"-এর মতো প্রায়-যোগ্য স্কলারশিপ পেতে ঘাটতি পূরণ করুন (${firstAlmost.missing || 'সিজিপিএ উন্নতি'})।`
            : `আপনার সিজিপিএ ও ডকুমেন্ট শক্তিশালী রাখলে আরও মেধাভিত্তিক সুযোগ উন্মুক্ত হবে।`,
          next7Days: `১. ড্যাশবোর্ডে আসন্ন সময়সীমা অনুযায়ী স্কলারশিপ সাজান। ২. ট্রান্সক্রিপ্ট ও সিভি আপডেট করুন। ৩. অগ্রাধিকারপ্রাপ্ত স্কলারশিপগুলো বুকমার্ক করে চেকলিস্ট সম্পূর্ণ করুন।`
        }
      };
    }

    return {
      source: 'fallback',
      provider: 'javascript-fallback',
      language: 'en',
      structured: {
        overview: `Out of ${summaryStats.totalCount} scholarships evaluated for ${student.fullName} (CGPA ${Number(student.cgpa).toFixed(2)}, ${student.department}), you qualify for ${summaryStats.eligibleCount} eligible and ${summaryStats.almostEligibleCount} almost-eligible scholarships.`,
        topRecommendations: firstEligible
          ? `Prioritize "${firstEligible.name}" (${firstEligible.amount || 'Amount unspecified'}, Deadline: ${firstEligible.deadline || 'Unspecified'}) along with your other Eligible matches.`
          : `No direct Eligible matches were found in this dataset; review Almost Eligible items and check department filters.`,
        improvementPlan: firstAlmost
          ? `Target Almost Eligible opportunities like "${firstAlmost.name}" by addressing: ${firstAlmost.missing || 'its minor requirement gap'}.`
          : `Maintain strong semester grades and prepare standardized application materials in advance.`,
        next7Days: `1. Sort by Earliest Deadline and bookmark top matches. 2. Request updated transcripts from ${student.university}. 3. Complete your document checklist for urgent applications.`
      }
    };
  }

  async function checkBackendStatus(backendUrl) {
    if (!backendUrl) return { reachable: false, aiAvailable: false };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(`${backendUrl.replace(/\/+$/, '')}/api/ai/status`, {
        signal: controller.signal
      });
      if (!res.ok) return { reachable: false, aiAvailable: false };
      const data = await res.json();
      return {
        reachable: true,
        aiAvailable: Boolean(data.aiAvailable),
        provider: data.provider,
        model: data.model
      };
    } catch {
      return { reachable: false, aiAvailable: false };
    } finally {
      clearTimeout(timer);
    }
  }

  async function requestScholarshipExplanation({ backendUrl, student, scholarship, matchResult, language }) {
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl.replace(/\/+$/, '')}/api/ai/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student, scholarship, matchResult, language })
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data && data.ok && data.structured) {
          return data;
        }
      } catch {
        // Fall back seamlessly to deterministic JS engine
      }
    }
    return buildFallbackExplanation(student, scholarship, matchResult, language);
  }

  async function requestStrategyRecommendation({
    backendUrl,
    student,
    summaryStats,
    topEligible,
    topAlmostEligible,
    language
  }) {
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl.replace(/\/+$/, '')}/api/ai/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student,
            summaryStats,
            topEligible,
            topAlmostEligible,
            language
          })
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data && data.ok && data.structured) {
          return data;
        }
      } catch {
        // Fall back seamlessly
      }
    }
    return buildFallbackStrategy(student, summaryStats, topEligible, topAlmostEligible, language);
  }

  return {
    buildFallbackExplanation,
    buildFallbackStrategy,
    checkBackendStatus,
    requestScholarshipExplanation,
    requestStrategyRecommendation
  };
});
