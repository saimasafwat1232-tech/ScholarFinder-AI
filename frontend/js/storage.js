(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ScholarFinderStorage = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const KEYS = {
    PROFILE: 'sf_profile_v1',
    DATASET: 'sf_dataset_v1',
    SAVED: 'sf_saved_v1',
    PROGRESS: 'sf_progress_v1',
    CHECKLISTS: 'sf_checklists_v1',
    SETTINGS: 'sf_settings_v1',
    AI_CACHE: 'sf_ai_cache_v1'
  };

  const DEFAULT_CHECKLIST_ITEMS = [
    { id: 'transcript', en: 'Official Academic Transcript / Grade Sheet', bn: 'অফিশিয়াল একাডেমিক ট্রান্সক্রিপ্ট / নম্বরপত্র' },
    { id: 'recommendation', en: 'Recommendation Letter(s) from Faculty', bn: 'শিক্ষকের সুপারিশপত্র (Recommendation Letter)' },
    { id: 'sop', en: 'Statement of Purpose / Personal Essay', bn: 'উদ্দেশ্য বিবরণী / ব্যক্তিগত প্রবন্ধ (SOP)' },
    { id: 'financial_doc', en: 'Financial Need / Income Certificate (if required)', bn: 'আর্থিক অবস্থা / আয়ের সনদপত্র (প্রযোজ্য হলে)' },
    { id: 'cv', en: 'Updated Academic CV / Resume', bn: 'হালনাগাদ একাডেমিক সিভি / জীবনবৃত্তান্ত' },
    { id: 'submitted', en: 'Completed & Submitted Online Application', bn: 'অনলাইন আবেদন ফরম সম্পূর্ণ ও জমা দেওয়া হয়েছে' }
  ];

  function readJson(key, fallback) {
    if (typeof localStorage === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    if (typeof localStorage === 'undefined') return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function getProfile() {
    return readJson(KEYS.PROFILE, null);
  }

  function saveProfile(profile) {
    return writeJson(KEYS.PROFILE, profile);
  }

  function getDataset() {
    return readJson(KEYS.DATASET, null);
  }

  function saveDataset(datasetObj) {
    return writeJson(KEYS.DATASET, datasetObj);
  }

  function getSavedIds() {
    const arr = readJson(KEYS.SAVED, []);
    return Array.isArray(arr) ? arr : [];
  }

  function toggleSavedId(id) {
    const set = new Set(getSavedIds());
    let saved = false;
    if (set.has(id)) {
      set.delete(id);
      saved = false;
    } else {
      set.add(id);
      saved = true;
    }
    writeJson(KEYS.SAVED, Array.from(set));
    return { saved, ids: Array.from(set) };
  }

  function getProgressMap() {
    return readJson(KEYS.PROGRESS, {});
  }

  function setScholarshipProgress(id, status) {
    const map = getProgressMap();
    map[id] = status;
    writeJson(KEYS.PROGRESS, map);
    return map;
  }

  function getChecklistState(id) {
    const all = readJson(KEYS.CHECKLISTS, {});
    return all[id] || {};
  }

  function toggleChecklistItem(scholarshipId, itemId) {
    const all = readJson(KEYS.CHECKLISTS, {});
    const current = all[scholarshipId] || {};
    current[itemId] = !current[itemId];
    all[scholarshipId] = current;
    writeJson(KEYS.CHECKLISTS, all);
    return current;
  }

  function getSettings() {
    const defaults = {
      backendUrl: 'http://localhost:5000',
      reminderDays: 30
    };
    return { ...defaults, ...readJson(KEYS.SETTINGS, {}) };
  }

  function saveSettings(partial) {
    const next = { ...getSettings(), ...partial };
    writeJson(KEYS.SETTINGS, next);
    return next;
  }

  function getAiCache(cacheKey) {
    const cache = readJson(KEYS.AI_CACHE, {});
    return cache[cacheKey] || null;
  }

  function setAiCache(cacheKey, value) {
    const cache = readJson(KEYS.AI_CACHE, {});
    // Keep cache bounded to 40 entries
    const keys = Object.keys(cache);
    if (keys.length >= 40) {
      delete cache[keys[0]];
    }
    cache[cacheKey] = value;
    writeJson(KEYS.AI_CACHE, cache);
  }

  function clearAllData() {
    if (typeof localStorage === 'undefined') return;
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  }

  return {
    KEYS,
    DEFAULT_CHECKLIST_ITEMS,
    getProfile,
    saveProfile,
    getDataset,
    saveDataset,
    getSavedIds,
    toggleSavedId,
    getProgressMap,
    setScholarshipProgress,
    getChecklistState,
    toggleChecklistItem,
    getSettings,
    saveSettings,
    getAiCache,
    setAiCache,
    clearAllData
  };
});
