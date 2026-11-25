(function () {
  const I18n = window.ScholarFinderI18n;
  const Storage = window.ScholarFinderStorage;
  const CSV = window.ScholarFinderCSV;
  const Matching = window.ScholarFinderMatching;
  const AI = window.ScholarFinderAI;

  const state = {
    dataset: null,
    profile: null,
    matchedAll: [],
    activeCategory: 'all',
    searchQuery: '',
    deptFilter: 'all',
    sortBy: 'match',
    savedIds: new Set(),
    progressMap: {},
    aiSnippets: {},
    backendStatus: { reachable: false, aiAvailable: false }
  };

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.removeAttribute('hidden');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.setAttribute('hidden', '');
  }

  function setupModals() {
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close-modal')));
    });
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.setAttribute('hidden', '');
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop:not([hidden])').forEach((m) => m.setAttribute('hidden', ''));
      }
    });
  }

  function setupMobileNav() {
    const btn = document.getElementById('mobileMenuBtn');
    const drawer = document.getElementById('mobileDrawer');
    if (!btn || !drawer) return;
    btn.addEventListener('click', () => {
      const hidden = drawer.hasAttribute('hidden');
      if (hidden) {
        drawer.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        drawer.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function recomputeMatches() {
    if (state.dataset && state.dataset.scholarships && state.profile) {
      state.matchedAll = Matching.evaluateAllScholarships(state.profile, state.dataset.scholarships);
    } else {
      state.matchedAll = [];
    }
  }

  function populateDeptFilter() {
    const select = document.getElementById('deptFilter');
    if (!select) return;
    const currentVal = state.deptFilter;
    const depts = new Set();

    if (state.profile && state.profile.department) {
      depts.add(state.profile.department);
    }
    if (state.dataset && state.dataset.scholarships) {
      state.dataset.scholarships.forEach((s) => {
        (s.departments || []).forEach((d) => depts.add(d));
      });
    }

    select.innerHTML = `<option value="all">${escapeHtml(I18n.t('dash.allDepts'))}</option>`;
    Array.from(depts)
      .sort((a, b) => a.localeCompare(b))
      .forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        select.appendChild(opt);
      });

    if (Array.from(select.options).some((o) => o.value === currentVal)) {
      select.value = currentVal;
    } else {
      state.deptFilter = 'all';
      select.value = 'all';
    }
  }

  function getUpcomingScholarships(windowDays) {
    return state.matchedAll.filter(({ scholarship }) => {
      if (scholarship.daysRemaining === null || scholarship.daysRemaining === undefined) return false;
      return scholarship.daysRemaining >= 0 && scholarship.daysRemaining <= windowDays;
    });
  }

  function renderContextAndKpis() {
    const lang = I18n.getStoredLanguage();
    const profEl = document.getElementById('dashProfileSummary');
    const dsEl = document.getElementById('dashDatasetSummary');
    const printMeta = document.getElementById('printReportMeta');

    if (state.profile) {
      profEl.innerHTML = `${escapeHtml(state.profile.fullName)} • ${escapeHtml(state.profile.university)} • ${escapeHtml(state.profile.department)} • CGPA ${Number(state.profile.cgpa).toFixed(2)} • ${escapeHtml(state.profile.country)}`;
    } else {
      profEl.textContent = I18n.t('dash.noProfileYet');
    }

    if (state.dataset) {
      dsEl.textContent = `${state.dataset.sourceName} (${state.dataset.validCount} ${lang === 'bn' ? 'টি রেকর্ড' : 'records'})`;
    } else {
      dsEl.textContent = I18n.t('dash.noDatasetYet');
    }

    if (printMeta) {
      const pName = state.profile ? `${state.profile.fullName} (CGPA ${Number(state.profile.cgpa).toFixed(2)}, ${state.profile.department})` : 'No Profile';
      printMeta.textContent = `${pName} | Generated ${new Date().toLocaleDateString()}`;
    }

    const total = state.dataset ? state.dataset.validCount : 0;
    const eligibleCount = state.matchedAll.filter((m) => m.match.status === 'eligible').length;
    const almostCount = state.matchedAll.filter((m) => m.match.status === 'almost_eligible').length;
    const notCount = state.matchedAll.filter((m) => m.match.status === 'not_eligible').length;
    const savedCount = state.matchedAll.filter((m) => state.savedIds.has(m.scholarship.id)).length;

    const settings = Storage.getSettings();
    const upcomingAll = getUpcomingScholarships(settings.reminderDays || 30);

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiEligible').textContent = eligibleCount;
    document.getElementById('kpiAlmost').textContent = almostCount;
    document.getElementById('kpiSaved').textContent = savedCount;
    document.getElementById('kpiDeadlines').textContent = upcomingAll.length;

    document.getElementById('tabCountAll').textContent = state.matchedAll.length;
    document.getElementById('tabCountEligible').textContent = eligibleCount;
    document.getElementById('tabCountAlmost').textContent = almostCount;
    document.getElementById('tabCountNot').textContent = notCount;
    document.getElementById('tabCountSaved').textContent = savedCount;

    // Deadline Reminder Banner & Badge
    const urgentPriority = upcomingAll.filter(
      ({ scholarship, match }) => match.status === 'eligible' || state.savedIds.has(scholarship.id)
    );
    const badge = document.getElementById('reminderCountBadge');
    const banner = document.getElementById('deadlineReminderBanner');
    const bannerText = document.getElementById('deadlineReminderText');

    if (upcomingAll.length > 0) {
      badge.hidden = false;
      badge.textContent = upcomingAll.length;
    } else {
      badge.hidden = true;
    }

    if (urgentPriority.length > 0) {
      banner.hidden = false;
      bannerText.textContent = I18n.t('reminders.banner', {
        count: urgentPriority.length,
        days: settings.reminderDays || 30
      });
    } else {
      banner.hidden = true;
    }
  }

  function getFilteredAndSortedItems() {
    let items = [...state.matchedAll];

    if (state.activeCategory === 'saved') {
      items = items.filter(({ scholarship }) => state.savedIds.has(scholarship.id));
    } else if (state.activeCategory !== 'all') {
      items = items.filter(({ match }) => match.status === state.activeCategory);
    }

    if (state.deptFilter !== 'all') {
      const filterLower = state.deptFilter.toLowerCase();
      items = items.filter(({ scholarship }) => {
        if (scholarship.openToAllDepartments) return true;
        return (scholarship.departments || []).some((d) => d.toLowerCase().includes(filterLower));
      });
    }

    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.trim().toLowerCase();
      items = items.filter(({ scholarship }) => {
        const hay = [
          scholarship.name,
          scholarship.provider,
          scholarship.amountDisplay,
          scholarship.departmentsRaw,
          scholarship.country,
          scholarship.description
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    items.sort((a, b) => {
      if (state.sortBy === 'deadline') {
        const tsA = a.scholarship.deadlineTimestamp ?? Number.MAX_SAFE_INTEGER;
        const tsB = b.scholarship.deadlineTimestamp ?? Number.MAX_SAFE_INTEGER;
        return tsA - tsB;
      }
      if (state.sortBy === 'amount') {
        return (b.scholarship.amountNumeric || 0) - (a.scholarship.amountNumeric || 0);
      }
      if (state.sortBy === 'cgpa') {
        const cA = a.scholarship.minCgpa ?? 99;
        const cB = b.scholarship.minCgpa ?? 99;
        return cA - cB;
      }
      return b.match.matchScore - a.match.matchScore;
    });

    return items;
  }

  function formatDeadlineBadge(scholarship) {
    if (!scholarship.deadline) {
      return `<span class="badge badge-neutral">${escapeHtml(I18n.t('card.unspecified'))}</span>`;
    }
    const d = scholarship.daysRemaining;
    let extra = '';
    let cls = 'badge-neutral';
    if (d !== null && d !== undefined) {
      if (d < 0) {
        extra = ` • ${I18n.t('card.expired')}`;
        cls = 'badge-not-eligible';
      } else if (d === 0) {
        extra = ` • ${I18n.t('card.dueToday')}`;
        cls = 'badge-almost';
      } else if (d <= 14) {
        extra = ` • ${I18n.t('card.daysLeft', { days: d })}`;
        cls = 'badge-almost';
      } else {
        extra = ` • ${I18n.t('card.daysLeft', { days: d })}`;
      }
    }
    return `<span class="badge ${cls}">${escapeHtml(scholarship.deadline)}${escapeHtml(extra)}</span>`;
  }

  function statusBadgeHtml(status) {
    const map = {
      eligible: 'badge-eligible',
      almost_eligible: 'badge-almost',
      not_eligible: 'badge-not-eligible'
    };
    return `<span class="badge ${map[status] || 'badge-neutral'}">${escapeHtml(I18n.t(`status.${status}`))}</span>`;
  }

  function renderDashboardContent() {
    const grid = document.getElementById('scholarshipGrid');
    const emptyDs = document.getElementById('emptyDatasetState');
    const emptyProf = document.getElementById('emptyProfileState');
    const emptyFilter = document.getElementById('emptyFilterState');

    emptyDs.hidden = true;
    emptyProf.hidden = true;
    emptyFilter.hidden = true;
    grid.innerHTML = '';

    if (!state.dataset || !state.dataset.scholarships || state.dataset.scholarships.length === 0) {
      emptyDs.hidden = false;
      return;
    }

    if (!state.profile) {
      emptyProf.hidden = false;
      return;
    }

    const items = getFilteredAndSortedItems();
    if (items.length === 0) {
      emptyFilter.hidden = false;
      return;
    }

    const lang = I18n.getStoredLanguage();
    const fragment = document.createDocumentFragment();

    items.forEach(({ scholarship, match }) => {
      const isSaved = state.savedIds.has(scholarship.id);
      const progress = state.progressMap[scholarship.id] || 'not_started';
      const cacheKey = `${scholarship.id}_${lang}_${state.profile.cgpa}_${state.profile.department}`;
      const cachedAi = state.aiSnippets[cacheKey] || Storage.getAiCache(cacheKey);
      const fallbackPreview = AI.buildFallbackExplanation(state.profile, scholarship, match, lang);
      const shownExplanation = cachedAi || fallbackPreview;

      const card = document.createElement('article');
      card.className = 'card scholarship-card';

      const deptText = scholarship.openToAllDepartments
        ? I18n.t('card.openAll')
        : scholarship.departments.length > 0
          ? scholarship.departments.join(', ')
          : I18n.t('card.unspecified');

      const missingHtml =
        match.status === 'almost_eligible'
          ? `<div class="sc-gap-box"><strong>${escapeHtml(I18n.t('card.missingGap'))}:</strong> ${escapeHtml(match.missingRequirements.join(' • '))}</div>`
          : match.status === 'not_eligible'
            ? `<div class="sc-fail-box"><strong>${escapeHtml(I18n.t('card.whyNot'))}:</strong> ${escapeHtml(match.missingRequirements.join(' • '))}</div>`
            : '';

      card.innerHTML = `
        <div class="sc-header">
          <div class="sc-title-wrap">
            ${statusBadgeHtml(match.status)}
            <h3 class="sc-title">${escapeHtml(scholarship.name)}</h3>
            <div class="sc-provider">${escapeHtml(scholarship.provider || I18n.t('card.unspecified'))}</div>
          </div>
          <button type="button" class="bookmark-btn ${isSaved ? 'saved' : ''}" data-action="bookmark" data-id="${escapeHtml(scholarship.id)}" aria-label="Bookmark">
            ${isSaved ? '★' : '☆'}
          </button>
        </div>

        <div class="sc-meta-grid">
          <div class="sc-meta-item">
            <span class="sc-meta-label">${escapeHtml(I18n.t('card.amount'))}</span>
            <span class="sc-meta-val">${escapeHtml(scholarship.amountDisplay || I18n.t('card.unspecified'))}</span>
          </div>
          <div class="sc-meta-item">
            <span class="sc-meta-label">${escapeHtml(I18n.t('card.reqCgpa'))}</span>
            <span class="sc-meta-val">${scholarship.minCgpa !== null ? scholarship.minCgpa.toFixed(2) : escapeHtml(I18n.t('card.unspecified'))}</span>
          </div>
          <div class="sc-meta-item">
            <span class="sc-meta-label">${escapeHtml(I18n.t('card.departments'))}</span>
            <span class="sc-meta-val">${escapeHtml(deptText)}</span>
          </div>
          <div class="sc-meta-item">
            <span class="sc-meta-label">${escapeHtml(I18n.t('card.deadline'))}</span>
            <span class="sc-meta-val">${formatDeadlineBadge(scholarship)}</span>
          </div>
        </div>

        ${missingHtml}

        <div class="sc-ai-snippet">
          <div class="sc-ai-snippet-head">
            <span>${
              shownExplanation.source === 'ai'
                ? escapeHtml(I18n.t('ai.sourceAi', { provider: shownExplanation.provider || 'Gemini AI' }))
                : escapeHtml(I18n.t('ai.sourceFallback'))
            }</span>
          </div>
          <div>${escapeHtml(shownExplanation.structured?.summary || '')}</div>
        </div>

        <div class="sc-progress-row no-print">
          <span class="sc-meta-label">${escapeHtml(I18n.t('card.progress'))}</span>
          <select class="form-control progress-select" data-action="progress" data-id="${escapeHtml(scholarship.id)}">
            <option value="not_started" ${progress === 'not_started' ? 'selected' : ''}>${escapeHtml(I18n.t('progress.not_started'))}</option>
            <option value="preparing" ${progress === 'preparing' ? 'selected' : ''}>${escapeHtml(I18n.t('progress.preparing'))}</option>
            <option value="in_progress" ${progress === 'in_progress' ? 'selected' : ''}>${escapeHtml(I18n.t('progress.in_progress'))}</option>
            <option value="submitted" ${progress === 'submitted' ? 'selected' : ''}>${escapeHtml(I18n.t('progress.submitted'))}</option>
            <option value="awarded" ${progress === 'awarded' ? 'selected' : ''}>${escapeHtml(I18n.t('progress.awarded'))}</option>
          </select>
        </div>

        <div class="sc-actions no-print">
          ${
            scholarship.link
              ? `<a href="${escapeHtml(scholarship.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">${escapeHtml(I18n.t('card.applyNow'))} ↗</a>`
              : `<button type="button" class="btn btn-outline btn-sm" disabled>${escapeHtml(I18n.t('card.noLink'))}</button>`
          }
          <button type="button" class="btn btn-outline btn-sm" data-action="explain" data-id="${escapeHtml(scholarship.id)}">
            ✨ ${escapeHtml(I18n.t('card.explainAi'))}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="details" data-id="${escapeHtml(scholarship.id)}">
            ${escapeHtml(I18n.t('card.viewDetails'))}
          </button>
        </div>
      `;

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  }

  async function explainSingleScholarship(scholarshipId, forceRefresh = false) {
    const found = state.matchedAll.find((m) => m.scholarship.id === scholarshipId);
    if (!found || !state.profile) return null;

    const lang = I18n.getStoredLanguage();
    const cacheKey = `${scholarshipId}_${lang}_${state.profile.cgpa}_${state.profile.department}`;
    if (!forceRefresh) {
      const existing = state.aiSnippets[cacheKey] || Storage.getAiCache(cacheKey);
      if (existing && existing.source === 'ai') return existing;
    }

    const settings = Storage.getSettings();
    const result = await AI.requestScholarshipExplanation({
      backendUrl: settings.backendUrl,
      student: state.profile,
      scholarship: found.scholarship,
      matchResult: found.match,
      language: lang
    });

    state.aiSnippets[cacheKey] = result;
    Storage.setAiCache(cacheKey, result);
    return result;
  }

  async function openScholarshipDetailsModal(scholarshipId) {
    const found = state.matchedAll.find((m) => m.scholarship.id === scholarshipId);
    if (!found) return;
    const { scholarship, match } = found;
    const lang = I18n.getStoredLanguage();

    const badge = document.getElementById('detailsModalStatusBadge');
    badge.className = `badge ${
      match.status === 'eligible'
        ? 'badge-eligible'
        : match.status === 'almost_eligible'
          ? 'badge-almost'
          : 'badge-not-eligible'
    }`;
    badge.textContent = I18n.t(`status.${match.status}`);

    document.getElementById('detailsModalTitle').textContent = scholarship.name;
    document.getElementById('detailsModalProvider').textContent = `${scholarship.provider || I18n.t('card.unspecified')} • ${scholarship.amountDisplay || I18n.t('card.unspecified')}`;

    const auditRows = match.checks
      .map((c) => {
        const label = lang === 'bn' ? c.labelBn : c.labelEn;
        const badgeCls = c.state === 'pass' ? 'badge-eligible' : c.state === 'fail' ? 'badge-not-eligible' : 'badge-neutral';
        const stateText = c.state === 'pass' ? I18n.t('modal.pass') : c.state === 'fail' ? I18n.t('modal.fail') : I18n.t('modal.unspec');
        return `
          <tr>
            <td><strong>${escapeHtml(label)}</strong></td>
            <td>${escapeHtml(c.requiredDisplay)}</td>
            <td>${escapeHtml(c.studentDisplay)}</td>
            <td><span class="badge ${badgeCls}">${escapeHtml(stateText)}</span></td>
          </tr>
        `;
      })
      .join('');

    const checklistState = Storage.getChecklistState(scholarship.id);
    const checklistHtml = Storage.DEFAULT_CHECKLIST_ITEMS.map((item) => {
      const checked = Boolean(checklistState[item.id]);
      return `
        <label class="checklist-item ${checked ? 'checked' : ''}">
          <input type="checkbox" data-checklist-sch="${escapeHtml(scholarship.id)}" data-checklist-item="${escapeHtml(item.id)}" ${checked ? 'checked' : ''} />
          <span>${escapeHtml(lang === 'bn' ? item.bn : item.en)}</span>
        </label>
      `;
    }).join('');

    const extraEntries = Object.entries(scholarship.extraFields || {});
    const extraHtml = extraEntries.length
      ? `
        <h3 class="mt-md">${escapeHtml(I18n.t('modal.extraFields'))}</h3>
        <table class="audit-table">
          <tbody>
            ${extraEntries
              .map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v)}</td></tr>`)
              .join('')}
          </tbody>
        </table>
      `
      : '';

    const cacheKey = `${scholarship.id}_${lang}_${state.profile.cgpa}_${state.profile.department}`;
    const aiData = state.aiSnippets[cacheKey] || Storage.getAiCache(cacheKey) || AI.buildFallbackExplanation(state.profile, scholarship, match, lang);

    const body = document.getElementById('detailsModalBody');
    body.innerHTML = `
      ${scholarship.description ? `<p>${escapeHtml(scholarship.description)}</p>` : ''}

      <h3>${escapeHtml(I18n.t('modal.ruleAudit'))}</h3>
      <table class="audit-table">
        <thead>
          <tr>
            <th>${escapeHtml(I18n.t('modal.criterion'))}</th>
            <th>${escapeHtml(I18n.t('modal.required'))}</th>
            <th>${escapeHtml(I18n.t('modal.yours'))}</th>
            <th>${escapeHtml(I18n.t('modal.result'))}</th>
          </tr>
        </thead>
        <tbody>${auditRows}</tbody>
      </table>

      <div class="mt-md">
        <div class="ai-strategy-header">
          <h3>${escapeHtml(I18n.t('modal.aiCoach'))}</h3>
          <button type="button" class="btn btn-sm btn-outline" id="modalRegenAiBtn" data-id="${escapeHtml(scholarship.id)}">
            ✨ ${escapeHtml(I18n.t('modal.regenerateAi'))}
          </button>
        </div>
        <div id="modalAiContent" class="ai-strategy-body" style="grid-template-columns: 1fr;">
          ${renderAiBlocksHtml(aiData)}
        </div>
      </div>

      <h3 class="mt-md">${escapeHtml(I18n.t('modal.checklist'))}</h3>
      <div class="checklist-box">${checklistHtml}</div>

      ${extraHtml}

      <div class="modal-footer">
        ${
          scholarship.link
            ? `<a href="${escapeHtml(scholarship.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${escapeHtml(I18n.t('card.applyNow'))} ↗</a>`
            : ''
        }
        <button type="button" class="btn btn-outline" data-close-modal="detailsModal">${escapeHtml(I18n.t('common.cancel'))}</button>
      </div>
    `;

    body.querySelectorAll('[data-close-modal]').forEach((b) =>
      b.addEventListener('click', () => closeModal(b.getAttribute('data-close-modal')))
    );

    body.querySelectorAll('input[data-checklist-item]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const schId = cb.getAttribute('data-checklist-sch');
        const itemId = cb.getAttribute('data-checklist-item');
        const updated = Storage.toggleChecklistItem(schId, itemId);
        cb.closest('.checklist-item').classList.toggle('checked', Boolean(updated[itemId]));
      });
    });

    const regenBtn = document.getElementById('modalRegenAiBtn');
    if (regenBtn) {
      regenBtn.addEventListener('click', async () => {
        regenBtn.disabled = true;
        regenBtn.textContent = I18n.t('card.explaining');
        const fresh = await explainSingleScholarship(scholarship.id, true);
        const container = document.getElementById('modalAiContent');
        if (container && fresh) {
          container.innerHTML = renderAiBlocksHtml(fresh);
        }
        regenBtn.disabled = false;
        regenBtn.textContent = `✨ ${I18n.t('modal.regenerateAi')}`;
        renderDashboardContent();
      });
    }

    openModal('detailsModal');
  }

  function renderAiBlocksHtml(aiResp) {
    const s = aiResp?.structured || {};
    const sourceLabel =
      aiResp?.source === 'ai'
        ? I18n.t('ai.sourceAi', { provider: aiResp.provider || 'Gemini' })
        : I18n.t('ai.sourceFallback');

    return `
      <div class="ai-box">
        <div class="sc-ai-snippet-head"><span>${escapeHtml(sourceLabel)}</span></div>
        <p>${escapeHtml(s.summary || '')}</p>
      </div>
      ${s.advice ? `<div class="ai-box"><h4>${escapeHtml(I18n.t('ai.advice'))}</h4><p>${escapeHtml(s.advice)}</p></div>` : ''}
      ${s.improvements ? `<div class="ai-box"><h4>${escapeHtml(I18n.t('ai.improvement'))}</h4><p>${escapeHtml(s.improvements)}</p></div>` : ''}
      ${s.guide ? `<div class="ai-box"><h4>${escapeHtml(I18n.t('ai.guide'))}</h4><p style="white-space:pre-line">${escapeHtml(s.guide)}</p></div>` : ''}
    `;
  }

  function setupToolbarAndCardActions() {
    document.querySelectorAll('#categoryTabs .tab-btn').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#categoryTabs .tab-btn').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeCategory = tab.getAttribute('data-category');
        renderDashboardContent();
      });
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderDashboardContent();
    });

    document.getElementById('deptFilter').addEventListener('change', (e) => {
      state.deptFilter = e.target.value;
      renderDashboardContent();
    });

    document.getElementById('sortSelect').addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderDashboardContent();
    });

    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
      state.activeCategory = 'all';
      state.searchQuery = '';
      state.deptFilter = 'all';
      document.getElementById('searchInput').value = '';
      document.getElementById('deptFilter').value = 'all';
      document.querySelectorAll('#categoryTabs .tab-btn').forEach((t) => {
        t.classList.toggle('active', t.getAttribute('data-category') === 'all');
      });
      renderDashboardContent();
    });

    // Delegated card actions
    const grid = document.getElementById('scholarshipGrid');
    grid.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');

      if (action === 'bookmark') {
        const res = Storage.toggleSavedId(id);
        state.savedIds = new Set(res.ids);
        showToast(I18n.t(res.saved ? 'toast.savedAdded' : 'toast.savedRemoved'), 'info');
        renderContextAndKpis();
        renderDashboardContent();
      } else if (action === 'details') {
        openScholarshipDetailsModal(id);
      } else if (action === 'explain') {
        btn.disabled = true;
        btn.textContent = I18n.t('card.explaining');
        await explainSingleScholarship(id, true);
        renderDashboardContent();
      }
    });

    grid.addEventListener('change', (e) => {
      const sel = e.target.closest('select[data-action="progress"]');
      if (!sel) return;
      const id = sel.getAttribute('data-id');
      state.progressMap = Storage.setScholarshipProgress(id, sel.value);
    });

    // CSV Export & Print
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
      const items = getFilteredAndSortedItems();
      if (items.length === 0) return;
      const csvText = CSV.exportResultsToCsv(items, state.savedIds, state.progressMap);
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scholarfinder_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(I18n.t('toast.exportedCsv'), 'success');
    });

    document.getElementById('printReportBtn').addEventListener('click', () => {
      window.print();
    });
  }

  function setupStrategyAiButton() {
    const btn = document.getElementById('generateStrategyBtn');
    const body = document.getElementById('aiStrategyBody');

    btn.addEventListener('click', async () => {
      if (!state.profile || !state.dataset) {
        showToast(I18n.t('empty.noProfileDesc'), 'warning');
        return;
      }

      btn.disabled = true;
      btn.textContent = I18n.t('card.explaining');
      body.hidden = false;
      body.innerHTML = `<div class="skeleton skeleton-box"></div><div class="skeleton skeleton-box"></div>`;

      const eligible = state.matchedAll.filter((m) => m.match.status === 'eligible');
      const almost = state.matchedAll.filter((m) => m.match.status === 'almost_eligible');

      const summaryStats = {
        totalCount: state.matchedAll.length,
        eligibleCount: eligible.length,
        almostEligibleCount: almost.length
      };

      const topEligible = eligible.slice(0, 5).map((m) => ({
        name: m.scholarship.name,
        amount: m.scholarship.amountDisplay,
        deadline: m.scholarship.deadline
      }));

      const topAlmostEligible = almost.slice(0, 5).map((m) => ({
        name: m.scholarship.name,
        missing: m.match.missingRequirements.join(' | '),
        deadline: m.scholarship.deadline
      }));

      const settings = Storage.getSettings();
      const lang = I18n.getStoredLanguage();
      const res = await AI.requestStrategyRecommendation({
        backendUrl: settings.backendUrl,
        student: state.profile,
        summaryStats,
        topEligible,
        topAlmostEligible,
        language: lang
      });

      const s = res.structured || {};
      body.innerHTML = `
        <div class="ai-box"><h4>${escapeHtml(I18n.t('ai.overview'))}</h4><p>${escapeHtml(s.overview || '')}</p></div>
        <div class="ai-box"><h4>${escapeHtml(I18n.t('ai.topPicks'))}</h4><p>${escapeHtml(s.topRecommendations || '')}</p></div>
        <div class="ai-box"><h4>${escapeHtml(I18n.t('ai.improvement'))}</h4><p>${escapeHtml(s.improvementPlan || '')}</p></div>
        <div class="ai-box"><h4>${escapeHtml(I18n.t('ai.next7Days'))}</h4><p>${escapeHtml(s.next7Days || '')}</p></div>
      `;

      btn.disabled = false;
      btn.textContent = I18n.t('ai.generateStrategy');
    });
  }

  function setupProfileModal() {
    const form = document.getElementById('modalProfileForm');
    const deptSelect = document.getElementById('mDepartmentSelect');
    const deptCustom = document.getElementById('mDepartmentCustom');
    const countrySelect = document.getElementById('mCountrySelect');
    const countryCustom = document.getElementById('mCountryCustom');

    deptSelect.addEventListener('change', () => {
      deptCustom.hidden = deptSelect.value !== 'Other';
    });
    countrySelect.addEventListener('change', () => {
      countryCustom.hidden = countrySelect.value !== 'Other';
    });

    const openWithHydration = () => {
      const p = state.profile;
      if (p) {
        document.getElementById('mFullName').value = p.fullName || '';
        document.getElementById('mUniversity').value = p.university || '';
        document.getElementById('mCgpa').value = p.cgpa ?? '';
        document.getElementById('mSemester').value = p.semester || '';
        document.getElementById('mFinancialSupport').value = p.financialSupport || '';
        document.getElementById('mGender').value = p.gender || 'Unspecified';
        document.getElementById('mEmail').value = p.email || '';

        const hasDept = Array.from(deptSelect.options).some((o) => o.value === p.department);
        if (hasDept) {
          deptSelect.value = p.department;
          deptCustom.hidden = true;
        } else {
          deptSelect.value = 'Other';
          deptCustom.hidden = false;
          deptCustom.value = p.department || '';
        }

        const hasCountry = Array.from(countrySelect.options).some((o) => o.value === p.country);
        if (hasCountry) {
          countrySelect.value = p.country;
          countryCustom.hidden = true;
        } else {
          countrySelect.value = 'Other';
          countryCustom.hidden = false;
          countryCustom.value = p.country || '';
        }
      }
      openModal('profileModal');
    };

    ['openProfileModalBtn', 'mobileProfileBtn', 'ribbonEditProfileBtn', 'emptyCreateProfileBtn'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', openWithHydration);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));

      const fullName = document.getElementById('mFullName').value.trim();
      const university = document.getElementById('mUniversity').value.trim();
      const department = deptSelect.value === 'Other' ? deptCustom.value.trim() : deptSelect.value;
      const cgpaRaw = document.getElementById('mCgpa').value.trim();
      const cgpa = Number(cgpaRaw);
      const semester = document.getElementById('mSemester').value;
      const financialSupport = document.getElementById('mFinancialSupport').value;
      const country = countrySelect.value === 'Other' ? countryCustom.value.trim() : countrySelect.value;
      const gender = document.getElementById('mGender').value || 'Unspecified';
      const email = document.getElementById('mEmail').value.trim();

      let valid = true;
      if (!fullName) { document.getElementById('mErr-fullName').textContent = I18n.t('err.required'); valid = false; }
      if (!university) { document.getElementById('mErr-university').textContent = I18n.t('err.required'); valid = false; }
      if (!department) { document.getElementById('mErr-department').textContent = I18n.t('err.required'); valid = false; }
      if (cgpaRaw === '' || Number.isNaN(cgpa) || cgpa < 0 || cgpa > 4) {
        document.getElementById('mErr-cgpa').textContent = I18n.t('err.cgpaRange');
        valid = false;
      }
      if (!semester) { document.getElementById('mErr-semester').textContent = I18n.t('err.required'); valid = false; }
      if (!financialSupport) { document.getElementById('mErr-financialSupport').textContent = I18n.t('err.required'); valid = false; }
      if (!country) { document.getElementById('mErr-country').textContent = I18n.t('err.required'); valid = false; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('mErr-email').textContent = I18n.t('err.emailInvalid');
        valid = false;
      }

      if (!valid) return;

      state.profile = {
        fullName,
        university,
        department,
        cgpa: Number(cgpa.toFixed(2)),
        semester,
        financialSupport,
        country,
        gender,
        email
      };
      Storage.saveProfile(state.profile);
      closeModal('profileModal');
      recomputeMatches();
      populateDeptFilter();
      renderContextAndKpis();
      renderDashboardContent();
      showToast(I18n.t('toast.profileSaved'), 'success');
    });
  }

  function setupDatasetModal() {
    ['openDatasetModalBtn', 'mobileDatasetBtn', 'ribbonImportCsvBtn', 'emptyUploadCsvBtn', 'emptySheetsHelpBtn'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => openModal('datasetModal'));
    });

    const loadCsvText = (csvText, name) => {
      try {
        const parsed = CSV.validateAndNormalizeDataset(csvText, name);
        state.dataset = parsed;
        Storage.saveDataset(parsed);
        closeModal('datasetModal');
        recomputeMatches();
        populateDeptFilter();
        renderContextAndKpis();
        renderDashboardContent();
        showToast(I18n.t('toast.csvLoaded', { count: parsed.validCount, name }), 'success');
      } catch (err) {
        showToast(I18n.t('toast.csvError', { msg: err.message }), 'error');
      }
    };

    const fileInput = document.getElementById('dashCsvFileInput');
    const dropzone = document.getElementById('dashCsvDropzone');

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => loadCsvText(String(reader.result || ''), file.name);
      reader.readAsText(file);
    });

    ['dragenter', 'dragover'].forEach((evt) => {
      dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    });
    ['dragleave', 'drop'].forEach((evt) => {
      dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('drag-over'); });
    });
    dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => loadCsvText(String(reader.result || ''), file.name);
      reader.readAsText(file);
    });

    const fetchBtn = document.getElementById('dashFetchSheetBtn');
    const urlInput = document.getElementById('dashSheetUrlInput');
    fetchBtn.addEventListener('click', async () => {
      fetchBtn.disabled = true;
      try {
        const settings = Storage.getSettings();
        const parsed = await CSV.fetchGoogleSheetCsv(urlInput.value, settings.backendUrl);
        state.dataset = parsed;
        Storage.saveDataset(parsed);
        closeModal('datasetModal');
        recomputeMatches();
        populateDeptFilter();
        renderContextAndKpis();
        renderDashboardContent();
        showToast(I18n.t('toast.csvLoaded', { count: parsed.validCount, name: parsed.sourceName }), 'success');
      } catch (err) {
        showToast(err.message, 'warning');
      } finally {
        fetchBtn.disabled = false;
      }
    });
  }

  function setupRemindersAndSettings() {
    const remSelect = document.getElementById('reminderDaysSelect');
    const remList = document.getElementById('remindersListContainer');

    const renderRemindersList = () => {
      const days = Number(remSelect.value || 30);
      const upcoming = getUpcomingScholarships(days).sort(
        (a, b) => (a.scholarship.daysRemaining ?? 999) - (b.scholarship.daysRemaining ?? 999)
      );
      if (upcoming.length === 0) {
        remList.innerHTML = `<p class="card-subtext">${escapeHtml(I18n.t('reminders.none'))}</p>`;
        return;
      }
      remList.innerHTML = upcoming
        .map(
          ({ scholarship, match }) => `
          <div class="reminder-item">
            <div>
              <strong>${escapeHtml(scholarship.name)}</strong>
              <div class="readiness-meta">${escapeHtml(scholarship.deadline)} • ${escapeHtml(I18n.t(`status.${match.status}`))}</div>
            </div>
            <span class="badge badge-almost">${escapeHtml(I18n.t('card.daysLeft', { days: scholarship.daysRemaining }))}</span>
          </div>
        `
        )
        .join('');
    };

    document.getElementById('openRemindersBtn').addEventListener('click', () => {
      const settings = Storage.getSettings();
      remSelect.value = String(settings.reminderDays || 30);
      renderRemindersList();
      openModal('remindersModal');
    });

    document.getElementById('viewUrgentBtn').addEventListener('click', () => {
      state.sortBy = 'deadline';
      document.getElementById('sortSelect').value = 'deadline';
      renderDashboardContent();
    });

    document.getElementById('dismissReminderBtn').addEventListener('click', () => {
      document.getElementById('deadlineReminderBanner').hidden = true;
    });

    remSelect.addEventListener('change', () => {
      Storage.saveSettings({ reminderDays: Number(remSelect.value) });
      renderRemindersList();
      renderContextAndKpis();
    });

    // Settings modal
    document.getElementById('openSettingsBtn').addEventListener('click', () => {
      const settings = Storage.getSettings();
      document.getElementById('backendUrlInput').value = settings.backendUrl || 'http://localhost:5000';
      openModal('settingsModal');
    });

    document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
      const url = document.getElementById('backendUrlInput').value.trim();
      Storage.saveSettings({ backendUrl: url });
      await updateAiEngineStatus();
      const resultEl = document.getElementById('backendTestResult');
      if (state.backendStatus.reachable) {
        const msg = state.backendStatus.aiAvailable
          ? `${state.backendStatus.provider} (${state.backendStatus.model})`
          : 'Fallback Mode';
        resultEl.innerHTML = `<span class="badge badge-eligible">${escapeHtml(I18n.t('toast.backendOk', { status: msg }))}</span>`;
      } else {
        resultEl.innerHTML = `<span class="badge badge-almost">${escapeHtml(I18n.t('toast.backendFail'))}</span>`;
      }
    });

    document.getElementById('clearAllDataBtn').addEventListener('click', () => {
      Storage.clearAllData();
      state.dataset = null;
      state.profile = null;
      state.matchedAll = [];
      state.savedIds = new Set();
      state.progressMap = {};
      closeModal('settingsModal');
      renderContextAndKpis();
      renderDashboardContent();
      showToast('Local data cleared.', 'info');
    });
  }

  async function updateAiEngineStatus() {
    const settings = Storage.getSettings();
    state.backendStatus = await AI.checkBackendStatus(settings.backendUrl);
    const badge = document.getElementById('aiEngineBadge');
    if (state.backendStatus.reachable && state.backendStatus.aiAvailable) {
      badge.textContent = I18n.t('ai.geminiReady');
      badge.className = 'badge badge-eligible';
    } else {
      badge.textContent = I18n.t('ai.fallbackReady');
      badge.className = 'badge badge-ai';
    }
  }

  function setupLanguageSwitcher() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        I18n.setStoredLanguage(lang);
        I18n.applyTranslations();
        populateDeptFilter();
        renderContextAndKpis();
        renderDashboardContent();
        updateAiEngineStatus();
      });
    });
  }

  async function init() {
    I18n.applyTranslations();
    setupMobileNav();
    setupModals();
    setupLanguageSwitcher();
    setupToolbarAndCardActions();
    setupStrategyAiButton();
    setupProfileModal();
    setupDatasetModal();
    setupRemindersAndSettings();

    const skeleton = document.getElementById('skeletonGrid');
    skeleton.hidden = false;

    state.dataset = Storage.getDataset();
    if (!state.dataset) {
      const settings = Storage.getSettings();
      const autoDs = await CSV.tryAutoLoadLocalCsv(settings.backendUrl);
      if (autoDs) {
        state.dataset = autoDs;
        Storage.saveDataset(autoDs);
      }
    }

    state.profile = Storage.getProfile();
    state.savedIds = new Set(Storage.getSavedIds());
    state.progressMap = Storage.getProgressMap();

    recomputeMatches();
    populateDeptFilter();
    renderContextAndKpis();
    skeleton.hidden = true;
    renderDashboardContent();
    updateAiEngineStatus();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
