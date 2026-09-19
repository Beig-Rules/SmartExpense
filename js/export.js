/**
 * SmartExpense — Structured export (Excel multi-sheet, PDF, image, JSON)
 */
const Export = (() => {
  function formatMoney(n) {
    return Math.round(Number(n) || 0).toLocaleString("fa-IR");
  }

  function monthKey(dateStr) {
    return String(dateStr).slice(0, 7);
  }

  function buildSummary(expenses) {
    const byCat = {};
    const byMonth = {};
    let total = 0;
    expenses.forEach((e) => {
      const a = Number(e.amount) || 0;
      total += a;
      byCat[e.category] = (byCat[e.category] || 0) + a;
      const m = monthKey(e.date);
      byMonth[m] = (byMonth[m] || 0) + a;
    });
    return { total, byCat, byMonth, count: expenses.length };
  }

  /**
   * Workbook layout (database-like):
   * 1) Meta — report identity
   * 2) Expenses — row-level ledger
   * 3) By_Category — aggregate
   * 4) By_Month — aggregate
   * 5) Dictionary — field definitions
   */
  function toExcel(expenses) {
    if (typeof XLSX === "undefined") {
      alert("کتابخانه اکسل بارگذاری نشده. اتصال اینترنت را بررسی کن.");
      return;
    }

    const list = Array.isArray(expenses) ? expenses.slice() : [];
    list.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const summary = buildSummary(list);
    const budget = Storage.getBudget();
    const exportedAt = new Date().toISOString();

    const wb = XLSX.utils.book_new();

    // --- Sheet: Meta ---
    const metaRows = [
      ["Field", "Value", "Description"],
      ["report_id", "SE-" + exportedAt.slice(0, 10).replace(/-/g, ""), "Unique report stamp"],
      ["exported_at_utc", exportedAt, "Export timestamp (ISO UTC)"],
      ["app", "SmartExpense", "Application name"],
      ["version", 2, "Data schema version"],
      ["currency", "IRR (Toman display)", "Amounts stored as numbers; UI shows تومان"],
      ["row_count", list.length, "Number of expense rows"],
      ["total_amount", summary.total, "Sum of all amounts in this export"],
      ["monthly_budget", budget == null ? "" : budget, "User budget ceiling if set"],
      ["categories_count", Object.keys(summary.byCat).length, "Distinct categories in export"]
    ];
    const wsMeta = XLSX.utils.aoa_to_sheet(metaRows);
    wsMeta["!cols"] = [{ wch: 22 }, { wch: 28 }, { wch: 42 }];
    XLSX.utils.book_append_sheet(wb, wsMeta, "Meta");

    // --- Sheet: Expenses (ledger) ---
    const expHeader = [
      "id",
      "date",
      "year_month",
      "category",
      "amount",
      "note",
      "created_at",
      "updated_at"
    ];
    const expRows = [expHeader].concat(
      list.map((e) => [
        e.id || "",
        e.date || "",
        monthKey(e.date || ""),
        e.category || "",
        Number(e.amount) || 0,
        e.note || "",
        e.createdAt || "",
        e.updatedAt || ""
      ])
    );
    const wsExp = XLSX.utils.aoa_to_sheet(expRows);
    wsExp["!cols"] = [
      { wch: 36 },
      { wch: 12 },
      { wch: 10 },
      { wch: 18 },
      { wch: 14 },
      { wch: 28 },
      { wch: 22 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsExp, "Expenses");

    // --- Sheet: By_Category ---
    const catHeader = ["category", "amount", "share_pct", "txn_count"];
    const catCounts = {};
    list.forEach((e) => {
      catCounts[e.category] = (catCounts[e.category] || 0) + 1;
    });
    const catRows = [catHeader].concat(
      Object.entries(summary.byCat)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => [
          cat,
          amt,
          summary.total ? Math.round((amt / summary.total) * 10000) / 100 : 0,
          catCounts[cat] || 0
        ])
    );
    const wsCat = XLSX.utils.aoa_to_sheet(catRows);
    wsCat["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsCat, "By_Category");

    // --- Sheet: By_Month ---
    const monHeader = ["year_month", "amount", "txn_count"];
    const monCounts = {};
    list.forEach((e) => {
      const m = monthKey(e.date);
      monCounts[m] = (monCounts[m] || 0) + 1;
    });
    const monRows = [monHeader].concat(
      Object.keys(summary.byMonth)
        .sort()
        .map((m) => [m, summary.byMonth[m], monCounts[m] || 0])
    );
    const wsMon = XLSX.utils.aoa_to_sheet(monRows);
    wsMon["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsMon, "By_Month");

    // --- Sheet: Dictionary ---
    const dictRows = [
      ["sheet", "column", "type", "description"],
      ["Expenses", "id", "string", "Primary key / UUID of the expense row"],
      ["Expenses", "date", "date YYYY-MM-DD", "Transaction date"],
      ["Expenses", "year_month", "string YYYY-MM", "Derived month bucket for grouping"],
      ["Expenses", "category", "string", "Expense category label"],
      ["Expenses", "amount", "number", "Amount in toman units (numeric, no formatting)"],
      ["Expenses", "note", "string", "Optional free-text note (max 200 chars in app)"],
      ["Expenses", "created_at", "ISO datetime", "Row creation time"],
      ["Expenses", "updated_at", "ISO datetime", "Last edit time"],
      ["By_Category", "share_pct", "number", "Percent of total amount (0–100)"],
      ["By_Month", "year_month", "string", "Calendar month key"],
      ["Meta", "monthly_budget", "number|empty", "User-defined monthly ceiling"]
    ];
    const wsDict = XLSX.utils.aoa_to_sheet(dictRows);
    wsDict["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 48 }];
    XLSX.utils.book_append_sheet(wb, wsDict, "Dictionary");

    const fname = "SmartExpense-Ledger-" + exportedAt.slice(0, 10) + ".xlsx";
    XLSX.writeFile(wb, fname);
  }

  function toPDF(expenses, kpis) {
    const lib = window.jspdf || (typeof jspdf !== "undefined" ? jspdf : null);
    if (!lib) {
      alert("کتابخانه PDF بارگذاری نشده.");
      return;
    }
    const { jsPDF } = lib;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const list = Array.isArray(expenses) ? expenses.slice() : [];
    const summary = buildSummary(list);

    doc.setFontSize(16);
    doc.text("SmartExpense — Structured Report", 20, 18);
    doc.setFontSize(10);
    doc.text("Generated: " + new Date().toISOString(), 20, 26);
    doc.text("Rows: " + list.length + "  |  Total: " + formatMoney(summary.total), 20, 32);

    if (kpis) {
      doc.text(
        "This month: " +
          formatMoney(kpis.monthTotal) +
          "  |  Txn: " +
          kpis.count +
          "  |  Daily avg: " +
          formatMoney(kpis.avg),
        20,
        38
      );
    }

    // Category table
    doc.setFontSize(12);
    doc.text("By category", 20, 48);
    doc.setFontSize(9);
    let y = 54;
    doc.text("Category", 20, y);
    doc.text("Amount", 100, y);
    doc.text("Share%", 140, y);
    y += 5;
    Object.entries(summary.byCat)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, amt]) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const share = summary.total ? Math.round((amt / summary.total) * 100) : 0;
        doc.text(String(cat).substring(0, 32), 20, y);
        doc.text(formatMoney(amt), 100, y);
        doc.text(String(share), 140, y);
        y += 5;
      });

    y += 8;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.text("Ledger (first 45 rows)", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.text("Date", 20, y);
    doc.text("Category", 45, y);
    doc.text("Amount", 110, y);
    y += 5;
    list.slice(0, 45).forEach((e) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(String(e.date || ""), 20, y);
      doc.text(String(e.category || "").substring(0, 28), 45, y);
      doc.text(formatMoney(e.amount), 110, y);
      y += 5;
    });

    doc.save("SmartExpense-Report-" + new Date().toISOString().slice(0, 10) + ".pdf");
  }

  async function toImage(elementId) {
    if (typeof html2canvas === "undefined") {
      alert("کتابخانه تصویر بارگذاری نشده.");
      return;
    }
    const el = document.getElementById(elementId) || document.querySelector(".main");
    const canvas = await html2canvas(el, {
      backgroundColor: "#0c1222",
      scale: 2,
      useCORS: true,
      logging: false
    });
    const link = document.createElement("a");
    link.download = "SmartExpense-dashboard-" + new Date().toISOString().slice(0, 10) + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function toJSONBackup() {
    const data = Storage.exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SmartExpense-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return { toExcel, toPDF, toImage, toJSONBackup };
})();
