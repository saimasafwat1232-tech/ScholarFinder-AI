(function () {
  const I18n = window.ScholarFinderI18n;
  const Storage = window.ScholarFinderStorage;
  const CSV = window.ScholarFinderCSV;
  const AI = window.ScholarFinderAI;

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4200);
  }

  function setupMobileNav() {
    const btn = document.getElementById('mobileMenuBtn');
    const drawer = document.getElementById('mobileDrawer');
    if (!btn || !drawer) return;

    btn.addEventListener('click', () => {
      const isHidden = drawer.hasAttribute('hidden');
      if (isHidden) {
        drawer.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        drawer.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        drawer.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function setupLanguageSwitcher() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        I18n.setStoredLanguage(lang);
        I18n.applyTranslations();
        refreshReadinessPanel();
      });
    });
  }

  function refreshReadinessPanel() {
    const dataset = Storage.getDataset();
    const profile = Storage.getProfile();
    const lang = I18n.getStoredLanguage();

    const dsMeta = document.getElementById('landingDatasetMeta');
    const dsBadge = document.getElementById('landingDatasetBadge');
    const dsSummaryBox = document.getElementById('datasetSummaryBox');
    const dsName = document.getElementById('datasetLoadedName');
    const dsCount = document.getElementById('datasetRowCount');
    const dsColInfo = document.getElementById('datasetColumnInfo');

    if (dataset && dataset.scholarships && dataset.scholarships.length > 0) {
      if (dsMeta) dsMeta.textContent = `${dataset.sourceName} (${dataset.validCount})`;
      if (dsBadge) {
        dsBadge.textContent = lang === 'bn' ? 'প্রস্তুত' : 'Loaded';
        dsBadge.className = 'badge badge-eligible';
      }
      if (dsSummaryBox) {
        dsSummaryBox.hidden = false;
        dsName.textContent = dataset.sourceName;
        dsCount.textContent = `${dataset.validCount} ${lang === 'bn' ? 'টি স্কলারশিপ' : 'scholarships'}`;
        const cols = Object.values(dataset.detectedColumns || {}).join(', ');
        dsColInfo.textContent = `${lang === 'bn' ? 'শনাক্তকৃত কলাম' : 'Detected columns'}: ${cols}`;
      }
    } else {
      if (dsMeta) dsMeta.textContent = lang === 'bn' ? 'এখনো কোনো সিএসভি লোড হয়নি' : 'Waiting for CSV upload';
      if (dsBadge) {
        dsBadge.textContent = lang === 'bn' ? 'প্রয়োজন' : 'Required';
        dsBadge.className = 'badge badge-almost';
      }
    }

    const profMeta = document.getElementById('landingProfileMeta');
    const profBadge = document.getElementById('landingProfileBadge');
    if (profile) {
      if (profMeta) profMeta.textContent = `${profile.fullName} • ${profile.department} • CGPA ${Number(profile.cgpa).toFixed(2)}`;
      if (profBadge) {
        profBadge.textContent = lang === 'bn' ? 'সংরক্ষিত' : 'Saved';
        profBadge.className = 'badge badge-eligible';
      }
    } else {
      if (profMeta) profMeta.textContent = I18n.t('hero.profileNotSet');
      if (profBadge) {
        profBadge.textContent = lang === 'bn' ? 'অসম্পূর্ণ' : 'Pending';
        profBadge.className = 'badge badge-neutral';
      }
    }
  }

  async function checkAiConnection() {
    const settings = Storage.getSettings();
    const status = await AI.checkBackendStatus(settings.backendUrl);
    const aiMeta = document.getElementById('landingAiMeta');
    const aiBadge = document.getElementById('landingAiBadge');
    const lang = I18n.getStoredLanguage();

    if (status.reachable && status.aiAvailable) {
      if (aiMeta) aiMeta.textContent = `${status.provider} (${status.model})`;
      if (aiBadge) {
        aiBadge.textContent = lang === 'bn' ? 'সক্রিয়' : 'Live AI';
        aiBadge.className = 'badge badge-eligible';
      }
    } else if (status.reachable) {
      if (aiMeta) aiMeta.textContent = lang === 'bn' ? 'ব্যাকএন্ড যুক্ত • ফলব্যাক গাইড সক্রিয়' : 'Backend live • JS fallback active';
      if (aiBadge) {
        aiBadge.textContent = lang === 'bn' ? 'ফলব্যাক' : 'Fallback';
        aiBadge.className = 'badge badge-almost';
      }
    } else {
      if (aiMeta) aiMeta.textContent = lang === 'bn' ? 'অফলাইন স্মার্ট গাইড সক্রিয়' : 'Offline JS fallback ready';
      if (aiBadge) {
        aiBadge.textContent = lang === 'bn' ? 'অফলাইন' : 'Offline OK';
        aiBadge.className = 'badge badge-neutral';
      }
    }
  }

  function handleCsvTextLoad(csvText, fileName) {
    try {
      const parsed = CSV.validateAndNormalizeDataset(csvText, fileName);
      Storage.saveDataset(parsed);
      refreshReadinessPanel();
      showToast(I18n.t('toast.csvLoaded', { count: parsed.validCount, name: fileName }), 'success');
    } catch (err) {
      showToast(I18n.t('toast.csvError', { msg: err.message }), 'error');
    }
  }

  function setupDatasetHandlers() {
    const dropzone = document.getElementById('csvDropzone');
    const fileInput = document.getElementById('csvFileInput');
    const sheetBtn = document.getElementById('loadGoogleSheetBtn');
    const sheetInput = document.getElementById('googleSheetUrlInput');
    const toggleHelpBtn = document.getElementById('toggleExportHelpBtn');
    const helpBox = document.getElementById('exportHelpBox');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => handleCsvTextLoad(String(reader.result || ''), file.name);
        reader.readAsText(file);
      });
    }

    if (dropzone) {
      ['dragenter', 'dragover'].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropzone.classList.add('drag-over');
        });
      });
      ['dragleave', 'drop'].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropzone.classList.remove('drag-over');
        });
      });
      dropzone.addEventListener('drop', (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => handleCsvTextLoad(String(reader.result || ''), file.name);
        reader.readAsText(file);
      });
    }

    if (toggleHelpBtn && helpBox) {
      toggleHelpBtn.addEventListener('click', () => {
        helpBox.hidden = !helpBox.hidden;
      });
    }

    if (sheetBtn && sheetInput) {
      sheetBtn.addEventListener('click', async () => {
        sheetBtn.disabled = true;
        try {
          const settings = Storage.getSettings();
          const parsed = await CSV.fetchGoogleSheetCsv(sheetInput.value, settings.backendUrl);
          Storage.saveDataset(parsed);
          refreshReadinessPanel();
          showToast(I18n.t('toast.csvLoaded', { count: parsed.validCount, name: parsed.sourceName }), 'success');
        } catch (err) {
          showToast(err.message, 'warning');
          if (helpBox) helpBox.hidden = false;
        } finally {
          sheetBtn.disabled = false;
        }
      });
    }
  }

  function setupProfileForm() {
    const form = document.getElementById('studentProfileForm');
    if (!form) return;

    const deptSelect = document.getElementById('departmentSelect');
    const deptCustom = document.getElementById('departmentCustom');
    const countrySelect = document.getElementById('countrySelect');
    const countryCustom = document.getElementById('countryCustom');
    const resetBtn = document.getElementById('resetProfileBtn');

    deptSelect.addEventListener('change', () => {
      deptCustom.hidden = deptSelect.value !== 'Other';
    });

    countrySelect.addEventListener('change', () => {
      countryCustom.hidden = countrySelect.value !== 'Other';
    });

    // Hydrate existing saved profile
    const saved = Storage.getProfile();
    if (saved) {
      document.getElementById('fullName').value = saved.fullName || '';
      document.getElementById('university').value = saved.university || '';
      document.getElementById('cgpa').value = saved.cgpa ?? '';
      document.getElementById('semester').value = saved.semester || '';
      document.getElementById('financialSupport').value = saved.financialSupport || '';
      document.getElementById('gender').value = saved.gender || 'Unspecified';
      document.getElementById('email').value = saved.email || '';

      const hasDeptOption = Array.from(deptSelect.options).some((o) => o.value === saved.department);
      if (hasDeptOption) {
        deptSelect.value = saved.department;
        deptCustom.hidden = true;
      } else if (saved.department) {
        deptSelect.value = 'Other';
        deptCustom.hidden = false;
        deptCustom.value = saved.department;
      }

      const hasCountryOption = Array.from(countrySelect.options).some((o) => o.value === saved.country);
      if (hasCountryOption) {
        countrySelect.value = saved.country;
        countryCustom.hidden = true;
      } else if (saved.country) {
        countrySelect.value = 'Other';
        countryCustom.hidden = false;
        countryCustom.value = saved.country;
      }
    }

    resetBtn.addEventListener('click', () => {
      form.reset();
      deptCustom.hidden = true;
      countryCustom.hidden = true;
      form.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
      form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
      form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));

      const fullName = document.getElementById('fullName').value.trim();
      const university = document.getElementById('university').value.trim();
      const department = deptSelect.value === 'Other' ? deptCustom.value.trim() : deptSelect.value;
      const cgpaRaw = document.getElementById('cgpa').value.trim();
      const cgpaNum = Number(cgpaRaw);
      const semester = document.getElementById('semester').value;
      const financialSupport = document.getElementById('financialSupport').value;
      const country = countrySelect.value === 'Other' ? countryCustom.value.trim() : countrySelect.value;
      const gender = document.getElementById('gender').value || 'Unspecified';
      const email = document.getElementById('email').value.trim();

      let valid = true;
      const markError = (errId, inputEl, msg) => {
        valid = false;
        const errEl = document.getElementById(errId);
        if (errEl) errEl.textContent = msg;
        if (inputEl) inputEl.classList.add('is-invalid');
      };

      if (!fullName) markError('err-fullName', document.getElementById('fullName'), I18n.t('err.required'));
      if (!university) markError('err-university', document.getElementById('university'), I18n.t('err.required'));
      if (!department) {
        markError(
          'err-department',
          deptSelect.value === 'Other' ? deptCustom : deptSelect,
          I18n.t('err.required')
        );
      }
      if (cgpaRaw === '' || Number.isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 4) {
        markError('err-cgpa', document.getElementById('cgpa'), I18n.t('err.cgpaRange'));
      }
      if (!semester) markError('err-semester', document.getElementById('semester'), I18n.t('err.required'));
      if (!financialSupport) {
        markError('err-financialSupport', document.getElementById('financialSupport'), I18n.t('err.required'));
      }
      if (!country) {
        markError(
          'err-country',
          countrySelect.value === 'Other' ? countryCustom : countrySelect,
          I18n.t('err.required')
        );
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        markError('err-email', document.getElementById('email'), I18n.t('err.emailInvalid'));
      }

      if (!valid) return;

      Storage.saveProfile({
        fullName,
        university,
        department,
        cgpa: Number(cgpaNum.toFixed(2)),
        semester,
        financialSupport,
        country,
        gender,
        email
      });

      refreshReadinessPanel();
      showToast(I18n.t('toast.profileSaved'), 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 450);
    });
  }

  async function init() {
    I18n.applyTranslations();
    setupMobileNav();
    setupLanguageSwitcher();
    setupDatasetHandlers();
    setupProfileForm();

    // Auto-load primary dataset from backend /api/scholarships (with local/bundled fallback)
    if (!Storage.getDataset()) {
      const settings = Storage.getSettings();
      const autoDs = await CSV.tryAutoLoadLocalCsv(settings.backendUrl);
      if (autoDs) {
        Storage.saveDataset(autoDs);
      }
    }

    refreshReadinessPanel();
    checkAiConnection();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
