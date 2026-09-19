/**
 * SmartExpense — Storage layer (localStorage)
 * Fast, synchronous, zero-dependency persistence.
 */
const Storage = (() => {
  const KEY_EXPENSES = "se_expenses_v1";
  const KEY_BUDGET = "se_budget_v1";

  const DEFAULT_CATEGORIES = [
    "خوراک و رستوران",
    "حمل و نقل",
    "قبض و خدمات",
    "خرید و پوشاک",
    "سرگرمی",
    "سلامت و درمان",
    "آموزش",
    "خانه و اجاره",
    "سایر"
  ];

  function _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function _write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getExpenses() {
    return _read(KEY_EXPENSES, []);
  }

  function saveExpenses(list) {
    _write(KEY_EXPENSES, list);
  }

  function addExpense({ date, category, amount, note }) {
    const list = getExpenses();
    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
      date,
      category,
      amount: Number(amount),
      note: note || "",
      createdAt: new Date().toISOString()
    };
    list.push(item);
    saveExpenses(list);
    return item;
  }

  function deleteExpense(id) {
    const list = getExpenses().filter((e) => e.id !== id);
    saveExpenses(list);
  }

  function getBudget() {
    const v = _read(KEY_BUDGET, null);
    return v === null ? null : Number(v);
  }

  function setBudget(value) {
    if (value === null || value === "" || Number(value) <= 0) {
      localStorage.removeItem(KEY_BUDGET);
      return null;
    }
    const n = Number(value);
    _write(KEY_BUDGET, n);
    return n;
  }

  function getCategories() {
    return DEFAULT_CATEGORIES.slice();
  }

  /** Current calendar month key YYYY-MM */
  function currentMonthKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }

  function monthKey(dateStr) {
    return String(dateStr).slice(0, 7);
  }

  return {
    getExpenses,
    addExpense,
    deleteExpense,
    getBudget,
    setBudget,
    getCategories,
    currentMonthKey,
    monthKey
  };
})();
