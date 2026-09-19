/**
 * SmartExpense — Main controller (edit, categories, backup, PIN, theme, Three.js)
 */
(() => {
  const $ = (sel) => document.querySelector(sel);

  let cache = [];
  let filterMonth = "all";
  let filterCategory = "all";
  let editingId = null;

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function fillCategorySelects() {
    const cats = Storage.getCategories();
    const opts = cats.map((c) => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join("");
    $("#f-category").innerHTML = opts;
    $("#sim-category").innerHTML = opts;
    $("#edit-category").innerHTML = opts;
    $("#filter-category").innerHTML =
      `<option value="all">همه دسته‌ها</option>` + opts;
    const list = $("#cat-list");
    if (list) {
      list.innerHTML = cats
        .map(
          (c) =>
            `<li><span>${escapeHtml(c)}</span><button type="button" class="btn-danger" data-rm-cat="${escapeAttr(c)}">×</button></li>`
        )
        .join("");
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """);
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function refreshMonthFilter() {
    const months = [...new Set(cache.map((e) => Storage.monthKey(e.date)))].sort().reverse();
    const sel = $("#filter-month");
    const current = sel.value;
    sel.innerHTML =
      `<option value="all">همه ماه‌ها</option>` +
      months.map((m) => `<option value="${m}">${m}</option>`).join("");
    if ([...sel.options].some((o) => o.value === current)) sel.value = current;
  }

  function filtered() {
    return cache.filter((e) => {
      if (filterMonth !== "all" && Storage.monthKey(e.date) !== filterMonth) return false;
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      return true;
    });
  }

  function kpisFor(list) {
    const month = Storage.currentMonthKey();
    const thisMonth = list.filter((e) => Storage.monthKey(e.date) === month);
    const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
    const count = thisMonth.length;
    let avg = 0;
    if (count) {
      const dates = thisMonth.map((e) => new Date(e.date).getTime());
      const days = Math.max(1, Math.round((Math.max(...dates) - Math.min(...dates)) / 86400000) + 1);
      avg = monthTotal / days;
    }
    return { monthTotal, count, avg };
  }

  function renderKPIs() {
    const { monthTotal, count, avg } = kpisFor(cache);
    $("#kpi-month").textContent = Suggestions.formatMoney(monthTotal);
    $("#kpi-count").textContent = count.toLocaleString("fa-IR");
    $("#kpi-avg").textContent = Suggestions.formatMoney(avg);

    const budget = Storage.getBudget();
    if (budget) {
      $("#kpi-budget").textContent = Suggestions.formatMoney(budget);
      $("#budget-input").value = budget;
      const pct = Math.min(100, (monthTotal / budget) * 100);
      const fill = $("#budget-fill");
      fill.style.width = pct + "%";
      fill.classList.toggle("warn", pct >= 80 && pct < 100);
      fill.classList.toggle("danger", pct >= 100);
      $("#budget-bar-wrap").classList.remove("hidden");
      $("#budget-text").textContent =
        `${Math.round(pct)}٪ مصرف شده — ${Suggestions.formatMoney(monthTotal)} از ${Suggestions.formatMoney(budget)}`;
    } else {
      $("#kpi-budget").textContent = "—";
      $("#budget-bar-wrap").classList.add("hidden");
    }
  }

  function renderTable() {
    const list = filtered().slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    const tbody = $("#expense-table tbody");
    if (!list.length) {
      tbody.innerHTML = "";
      $("#empty-state").classList.remove("hidden");
      return;
    }
    $("#empty-state").classList.add("hidden");
    tbody.innerHTML = list
      .map(
        (e) => `
      <tr>
        <td>${escapeHtml(e.date)}</td>
        <td>${escapeHtml(e.category)}</td>
        <td>${Suggestions.formatMoney(e.amount)}</td>
        <td>${escapeHtml(e.note || "—")}</td>
        <td class="row-actions">
          <button type="button" class="btn-link" data-edit="${escapeAttr(e.id)}">ویرایش</button>
          <button type="button" class="btn-danger" data-del="${escapeAttr(e.id)}">حذف</button>
        </td>
      </tr>`
      )
      .join("");
  }

  function renderSuggestions() {
    const tips = Suggestions.buildTips(cache, Storage.getBudget());
    $("#suggestions").innerHTML = tips
      .map((t) => `<div class="tip ${t.type || ""}">${escapeHtml(t.text)}</div>`)
      .join("");
  }

  function updateCharts() {
    Charts.update(cache);
    if (typeof Charts3D !== "undefined" && Charts3D.ready()) {
      Charts3D.update(cache);
    }
  }

  function refreshAll() {
    cache = Storage.getExpenses();
    fillCategorySelects();
    refreshMonthFilter();
    renderKPIs();
    renderTable();
    renderSuggestions();
    updateCharts();
  }

  function openEdit(id) {
    const item = cache.find((e) => e.id === id);
    if (!item) return;
    editingId = id;
    $("#edit-date").value = item.date;
    $("#edit-amount").value = item.amount;
    $("#edit-category").value = item.category;
    $("#edit-note").value = item.note || "";
    $("#edit-modal").classList.remove("hidden");
  }

  function closeEdit() {
    editingId = null;
    $("#edit-modal").classList.add("hidden");
  }

  function showLockScreen(show) {
    const el = $("#lock-screen");
    if (!el) return;
    el.classList.toggle("hidden", !show);
    $("#app-root").classList.toggle("hidden", show);
  }

  function applyTheme(theme) {
    const t = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("se_theme", t);
    } catch (_) {}
    const btn = $("#btn-theme");
    if (btn) btn.textContent = t === "light" ? "☀️" : "🌙";
    const meta = document.getElementById("meta-theme");
    if (meta) meta.setAttribute("content", t === "light" ? "#f0f4ff" : "#0c1222");
    if (typeof Charts !== "undefined" && Charts.refreshTheme) Charts.refreshTheme();
    if (typeof Charts3D !== "undefined" && Charts3D.refreshTheme) Charts3D.refreshTheme();
    if (!Storage.isLocked()) updateCharts();
  }

  $("#expense-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const date = $("#f-date").value;
    const amount = Number($("#f-amount").value);
    const category = $("#f-category").value;
    const note = $("#f-note").value.trim();
    if (!date || !(amount > 0)) return;
    Storage.addExpense({ date, category, amount, note });
    $("#f-amount").value = "";
    $("#f-note").value = "";
    refreshAll();
  });

  $("#btn-save-budget").addEventListener("click", () => {
    Storage.setBudget($("#budget-input").value);
    refreshAll();
  });

  $("#filter-month").addEventListener("change", (e) => {
    filterMonth = e.target.value;
    renderTable();
  });
  $("#filter-category").addEventListener("change", (e) => {
    filterCategory = e.target.value;
    renderTable();
  });

  $("#expense-table").addEventListener("click", (e) => {
    const del = e.target.getAttribute("data-del");
    const edit = e.target.getAttribute("data-edit");
    if (del && confirm("این هزینه حذف شود؟")) {
      Storage.deleteExpense(del);
      refreshAll();
    }
    if (edit) openEdit(edit);
  });

  $("#edit-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!editingId) return;
    Storage.updateExpense(editingId, {
      date: $("#edit-date").value,
      amount: Number($("#edit-amount").value),
      category: $("#edit-category").value,
      note: $("#edit-note").value.trim()
    });
    closeEdit();
    refreshAll();
  });
  $("#edit-cancel").addEventListener("click", closeEdit);

  $("#btn-add-cat").addEventListener("click", () => {
    const name = $("#new-cat").value.trim();
    if (!name) return;
    Storage.addCategory(name);
    $("#new-cat").value = "";
    fillCategorySelects();
  });

  $("#cat-list").addEventListener("click", (e) => {
    const name = e.target.getAttribute("data-rm-cat");
    if (!name) return;
    if (confirm("حذف دسته «" + name + "»؟")) {
      Storage.removeCategory(name);
      fillCategorySelects();
    }
  });

  $("#sim-percent").addEventListener("input", (e) => {
    $("#sim-percent-val").textContent = e.target.value + "٪";
  });

  $("#btn-simulate").addEventListener("click", () => {
    const result = Suggestions.simulate(cache, $("#sim-category").value, Number($("#sim-percent").value));
    const box = $("#sim-result");
    box.classList.remove("hidden");
    box.textContent = result.message;
  });

  const exportMenu = $("#export-menu");
  $("#btn-export-menu").addEventListener("click", (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle("hidden");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".header-actions")) exportMenu.classList.add("hidden");
  });
  exportMenu.addEventListener("click", async (e) => {
    const type = e.target.getAttribute("data-export");
    if (!type) return;
    exportMenu.classList.add("hidden");
    const list = filtered().length ? filtered() : cache;
    if (type === "excel") Export.toExcel(list);
    if (type === "pdf") Export.toPDF(list, kpisFor(cache));
    if (type === "image") await Export.toImage("dashboard-3d");
    if (type === "json") Export.toJSONBackup();
  });

  $("#btn-import-json").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const mode = confirm("OK = جایگزینی کامل داده‌ها\nCancel = ادغام با داده‌های فعلی") ? "replace" : "merge";
      const n = Storage.importBackup(data, mode);
      alert("وارد شد. تعداد کل هزینه‌ها: " + n);
      refreshAll();
    } catch (err) {
      alert("خطا در خواندن فایل: " + (err.message || "نامعتبر"));
    }
  });

  $("#btn-set-pin").addEventListener("click", async () => {
    const pin = $("#pin-input").value;
    try {
      await Storage.setPin(pin);
      $("#pin-input").value = "";
      alert("قفل فعال شد.");
      $("#btn-lock-now").classList.remove("hidden");
    } catch (err) {
      alert(err.message || "خطا");
    }
  });
  $("#btn-clear-pin").addEventListener("click", async () => {
    const pin = $("#pin-input").value;
    try {
      await Storage.clearPin(pin);
      $("#pin-input").value = "";
      alert("قفل غیرفعال شد");
      $("#btn-lock-now").classList.add("hidden");
    } catch (err) {
      alert(err.message || "خطا");
    }
  });
  $("#btn-lock-now").addEventListener("click", () => {
    Storage.lock();
    showLockScreen(true);
  });
  $("#btn-unlock").addEventListener("click", async () => {
    const ok = await Storage.unlock($("#unlock-pin").value);
    $("#unlock-pin").value = "";
    if (ok) {
      showLockScreen(false);
      refreshAll();
    } else alert("رمز اشتباه است");
  });

  const themeBtn = $("#btn-theme");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      applyTheme(cur === "light" ? "dark" : "light");
    });
  }

  function init() {
    const saved = (() => {
      try {
        return localStorage.getItem("se_theme");
      } catch (_) {
        return null;
      }
    })();
    applyTheme(saved === "light" ? "light" : "dark");
    if (Storage.hasPin()) {
      Storage.lock();
      showLockScreen(true);
      $("#btn-lock-now").classList.remove("hidden");
    } else {
      showLockScreen(false);
    }
    fillCategorySelects();
    $("#f-date").value = todayISO();
    if (!Storage.isLocked()) refreshAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
