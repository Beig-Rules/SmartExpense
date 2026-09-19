/**
 * SmartExpense — Suggestions & simulation logic
 */
const Suggestions = (() => {
  function formatMoney(n) {
    return Math.round(n).toLocaleString("fa-IR") + " تومان";
  }

  /**
   * Build smart tips from expense list + optional budget.
   */
  function buildTips(expenses, budget) {
    const tips = [];
    if (!expenses.length) {
      tips.push({ type: "good", text: "هنوز هزینه‌ای ثبت نشده. با ثبت منظم، تحلیل دقیق‌تری می‌گیری." });
      return tips;
    }

    const month = Storage.currentMonthKey();
    const thisMonth = expenses.filter((e) => Storage.monthKey(e.date) === month);
    const totalMonth = thisMonth.reduce((s, e) => s + e.amount, 0);

    // Category concentration
    const byCat = {};
    thisMonth.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });
    const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    if (sorted.length && totalMonth > 0) {
      const [topCat, topVal] = sorted[0];
      const pct = Math.round((topVal / totalMonth) * 100);
      if (pct >= 40) {
        tips.push({
          type: "warn",
          text: `حدود ${pct}٪ هزینه این ماه در «${topCat}» است. کاهش ۱۰–۲۰٪ در این دسته اثر محسوسی دارد.`
        });
      } else {
        tips.push({
          type: "good",
          text: `بزرگ‌ترین سهم این ماه: «${topCat}» (${pct}٪). توزیع نسبتاً متعادل است.`
        });
      }
    }

    // Budget
    if (budget && budget > 0) {
      const used = totalMonth / budget;
      if (used >= 1) {
        tips.push({ type: "warn", text: `بودجه ماه تمام شده یا رد شده (${formatMoney(totalMonth)} از ${formatMoney(budget)}).` });
      } else if (used >= 0.8) {
        tips.push({ type: "warn", text: `بیش از ۸۰٪ بودجه ماه مصرف شده. تا پایان ماه مراقب باش.` });
      } else {
        tips.push({ type: "good", text: `هنوز ${(100 - Math.round(used * 100))}٪ از بودجه ماه باقی مانده.` });
      }
    } else {
      tips.push({ type: "", text: "با تعیین بودجه ماهانه، هشدار و کنترل دقیق‌تری می‌گیری." });
    }

    // Frequency
    if (thisMonth.length >= 15) {
      tips.push({ type: "", text: "تعداد تراکنش‌های این ماه بالاست. تجمیع خریدهای کوچک می‌تواند هزینه پنهان را کم کند." });
    }

    return tips.slice(0, 4);
  }

  /**
   * Simulate cutting one category by percent this month.
   */
  function simulate(expenses, category, percent) {
    const month = Storage.currentMonthKey();
    const thisMonth = expenses.filter((e) => Storage.monthKey(e.date) === month);
    const total = thisMonth.reduce((s, e) => s + e.amount, 0);
    const catTotal = thisMonth
      .filter((e) => e.category === category)
      .reduce((s, e) => s + e.amount, 0);

    if (catTotal <= 0) {
      return { ok: false, message: "در این ماه برای این دسته هزینه‌ای ثبت نشده." };
    }

    const save = catTotal * (percent / 100);
    const newTotal = total - save;
    const pctOfMonth = total > 0 ? Math.round((save / total) * 100) : 0;

    return {
      ok: true,
      category,
      percent,
      catTotal,
      save,
      total,
      newTotal,
      pctOfMonth,
      message:
        `اگر «${category}» را ${percent}٪ کم کنی، حدود ${formatMoney(save)} ذخیره می‌شود ` +
        `(${pctOfMonth}٪ از کل هزینه این ماه) و مجموع ماه به ${formatMoney(newTotal)} می‌رسد.`
    };
  }

  return { buildTips, simulate, formatMoney };
})();
