/**
 * SmartExpense — Storage layer
 * localStorage only. Optional light obfuscation when PIN lock is enabled.
 * Never logs amounts to console.
 */
const Storage = (() => {
  const KEY_EXPENSES = "se_expenses_v2";
  const KEY_BUDGET = "se_budget_v2";
  const KEY_CATEGORIES = "se_categories_v2";
  const KEY_META = "se_meta_v2";

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
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e && e.name === "QuotaExceededError") {
        alert("فضای ذخیره‌سازی مرورگر پر است. چند مورد قدیمی را حذف یا از پشتیبان JSON استفاده کن.");
      }
      throw e;
    }
  }

  function getMeta() {
    return _read(KEY_META, { pinHash: null, locked: false });
  }

  function setMeta(meta) {
    _write(KEY_META, meta);
  }

  function getExpenses() {
    const list = _read(KEY_EXPENSES, []);
    return Array.isArray(list) ? list : [];
  }

  function saveExpenses(list) {
    _write(KEY_EXPENSES, list);
  }

  function addExpense({ date, category, amount, note }) {
    const list = getExpenses();
    const item = {
      id: (crypto.randomUUID && crypto.randomUUID()) || ("id_" + Date.now() + "_" + Math.random().toString(36).slice(2)),
      date,
      category,
      amount: Number(amount),
      note: (note || "").slice(0, 200),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.push(item);
    saveExpenses(list);
    return item;
  }

  function updateExpense(id, patch) {
    const list = getExpenses();
    const i = list.findIndex((e) => e.id === id);
    if (i < 0) return null;
    const prev = list[i];
    list[i] = {
      ...prev,
      date: patch.date ?? prev.date,
      category: patch.category ?? prev.category,
      amount: patch.amount != null ? Number(patch.amount) : prev.amount,
      note: patch.note != null ? String(patch.note).slice(0, 200) : prev.note,
      updatedAt: new Date().toISOString()
    };
    saveExpenses(list);
    return list[i];
  }

  function deleteExpense(id) {
    saveExpenses(getExpenses().filter((e) => e.id !== id));
  }

  function getBudget() {
    const v = _read(KEY_BUDGET, null);
    return v === null || v === undefined ? null : Number(v);
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
    const custom = _read(KEY_CATEGORIES, null);
    if (Array.isArray(custom) && custom.length) return custom;
    return DEFAULT_CATEGORIES.slice();
  }

  function setCategories(list) {
    const cleaned = [...new Set((list || []).map((s) => String(s).trim()).filter(Boolean))];
    if (!cleaned.length) {
      localStorage.removeItem(KEY_CATEGORIES);
      return DEFAULT_CATEGORIES.slice();
    }
    _write(KEY_CATEGORIES, cleaned);
    return cleaned;
  }

  function addCategory(name) {
    const n = String(name || "").trim();
    if (!n) return getCategories();
    const cats = getCategories();
    if (cats.includes(n)) return cats;
    cats.push(n);
    return setCategories(cats);
  }

  function removeCategory(name) {
    const cats = getCategories().filter((c) => c !== name);
    return setCategories(cats.length ? cats : DEFAULT_CATEGORIES.slice());
  }

  function currentMonthKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }

  function monthKey(dateStr) {
    return String(dateStr).slice(0, 7);
  }

  /** Full backup object for JSON export */
  function exportBackup() {
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      expenses: getExpenses(),
      budget: getBudget(),
      categories: getCategories()
      // PIN hash is NOT exported for security
    };
  }

  function importBackup(data, mode) {
    // mode: 'replace' | 'merge'
    if (!data || typeof data !== "object") throw new Error("فایل نامعتبر است");
    const expenses = Array.isArray(data.expenses) ? data.expenses : [];
    const sanitized = expenses
      .filter((e) => e && e.date && e.category && Number(e.amount) > 0)
      .map((e) => ({
        id: e.id || ("id_" + Date.now() + "_" + Math.random().toString(36).slice(2)),
        date: String(e.date).slice(0, 10),
        category: String(e.category).slice(0, 80),
        amount: Number(e.amount),
        note: String(e.note || "").slice(0, 200),
        createdAt: e.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

    if (mode === "merge") {
      const existing = getExpenses();
      const ids = new Set(existing.map((e) => e.id));
      const merged = existing.concat(sanitized.filter((e) => !ids.has(e.id)));
      saveExpenses(merged);
    } else {
      saveExpenses(sanitized);
    }

    if (data.categories && Array.isArray(data.categories)) {
      setCategories(data.categories);
    }
    if (data.budget != null && Number(data.budget) > 0) {
      setBudget(data.budget);
    }
    return getExpenses().length;
  }

  async function hashPin(pin) {
    const enc = new TextEncoder().encode("se_pin_v1:" + String(pin));
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function setPin(pin) {
    if (!pin || String(pin).length < 4) throw new Error("رمز حداقل ۴ رقم/حرف باشد");
    const hash = await hashPin(pin);
    const meta = getMeta();
    meta.pinHash = hash;
    meta.locked = false;
    setMeta(meta);
  }

  async function clearPin(currentPin) {
    const meta = getMeta();
    if (meta.pinHash) {
      const h = await hashPin(currentPin);
      if (h !== meta.pinHash) throw new Error("رمز اشتباه است");
    }
    meta.pinHash = null;
    meta.locked = false;
    setMeta(meta);
  }

  async function unlock(pin) {
    const meta = getMeta();
    if (!meta.pinHash) {
      meta.locked = false;
      setMeta(meta);
      return true;
    }
    const h = await hashPin(pin);
    if (h !== meta.pinHash) return false;
    meta.locked = false;
    setMeta(meta);
    return true;
  }

  function lock() {
    const meta = getMeta();
    if (meta.pinHash) {
      meta.locked = true;
      setMeta(meta);
    }
  }

  function isLocked() {
    const meta = getMeta();
    return !!(meta.pinHash && meta.locked);
  }

  function hasPin() {
    return !!getMeta().pinHash;
  }

  // Migrate v1 keys if present
  (function migrate() {
    try {
      if (!localStorage.getItem(KEY_EXPENSES) && localStorage.getItem("se_expenses_v1")) {
        const old = JSON.parse(localStorage.getItem("se_expenses_v1") || "[]");
        saveExpenses(old);
      }
      if (localStorage.getItem("se_budget_v1") && !localStorage.getItem(KEY_BUDGET)) {
        localStorage.setItem(KEY_BUDGET, localStorage.getItem("se_budget_v1"));
      }
    } catch (_) {}
  })();

  return {
    getExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getBudget,
    setBudget,
    getCategories,
    setCategories,
    addCategory,
    removeCategory,
    currentMonthKey,
    monthKey,
    exportBackup,
    importBackup,
    setPin,
    clearPin,
    unlock,
    lock,
    isLocked,
    hasPin
  };
})();
