/**
 * SmartExpense — Main application controller
 * Optimized for fast UI updates and minimal reflows.
 */
(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  let cache = [];
  let filterMonth = "all";
  let filterCategory = "all";

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function fillCategories() {
    const cats = Storage.getCategories();
    const opts = cats.map((c) => `<option value="${c}">${c}</option>`).join("");
    $("#f-category").innerHTML = opts;
    $("#sim-category").innerHTML = opts;
    $("#filter-category").innerHTML =
      `<option value="all">همه دسته‌ها</option>` + opts;
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
      fill.classList.remove("warn", "danger");
      if (pct >= 100) fill.classList.add("danger");
      else if (pct >= 80) fill.classList.add("warn");
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
        <td>${e.date}</td>
        <td>${e.category}</td>
        <td>${Suggestions.formatMoney(e.amount)}</td>
        <td>${e.note || "—"}</td>
        <td><button type="button" class="btn-danger" data-del="${e.id}">حذف</button></td>
      </tr>`
      )
      .join("");
  }

  function renderSuggestions() {
    const tips = Suggestions.buildTips(cache, Storage.getBudget());
    $("#suggestions").innerHTML = tips
      .map((t) => `<div class="tip ${t.type || ""}">${t.text}</div>`)
      .join("");
  }

  function refreshAll() {
    cache = Storage.getExpenses();
    refreshMonthFilter();
    renderKPIs();
    renderTable();
    renderSuggestions();
    Charts.update(cache);
  }

  // ---- Events ----
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
    const id = e.target.getAttribute("data-del");
    if (!id) return;
    if (confirm("این هزینه حذف شود؟")) {
      Storage.deleteExpense(id);
      refreshAll();
    }
  });

  $("#sim-percent").addEventListener("input", (e) => {
    $("#sim-percent-val").textContent = e.target.value + "٪";
  });

  $("#btn-simulate").addEventListener("click", () => {
    const cat = $("#sim-category").value;
    const pct = Number($("#sim-percent").value);
    const result = Suggestions.simulate(cache, cat, pct);
    const box = $("#sim-result");
    box.classList.remove("hidden");
    box.textContent = result.message;
  });

  // Export menu
  const exportMenu = $("#export-menu");
  $("#btn-export-menu").addEventListener("click", () => {
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
    if (type === "image") await Export.toImage("dashboard");
  });

  // Init
  function init() {
    fillCategories();
    $("#f-date").value = todayISO();
    refreshAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
