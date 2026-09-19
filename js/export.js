/**
 * SmartExpense — Export helpers
 */
const Export = (() => {
  function formatMoney(n) {
    return Math.round(n).toLocaleString("fa-IR");
  }

  function toExcel(expenses) {
    if (typeof XLSX === "undefined") {
      alert("کتابخانه اکسل بارگذاری نشده. اتصال اینترنت را بررسی کن.");
      return;
    }
    const rows = expenses.map((e) => ({
      تاریخ: e.date,
      دسته‌بندی: e.category,
      مبلغ: e.amount,
      توضیح: e.note || ""
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "هزینه‌ها");
    XLSX.writeFile(wb, "SmartExpense-" + new Date().toISOString().slice(0, 10) + ".xlsx");
  }

  function toPDF(expenses, kpis) {
    const lib = window.jspdf || (typeof jspdf !== "undefined" ? jspdf : null);
    if (!lib) {
      alert("کتابخانه PDF بارگذاری نشده.");
      return;
    }
    const { jsPDF } = lib;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text("SmartExpense Report", 20, 20);
    doc.setFontSize(11);
    doc.text("Generated: " + new Date().toLocaleString(), 20, 30);
    if (kpis) {
      doc.text("Month total: " + formatMoney(kpis.monthTotal), 20, 40);
      doc.text("Transactions: " + kpis.count, 20, 48);
      doc.text("Daily avg: " + formatMoney(kpis.avg), 20, 56);
    }
    let y = 70;
    doc.setFontSize(10);
    doc.text("Date", 20, y);
    doc.text("Category", 50, y);
    doc.text("Amount", 120, y);
    y += 6;
    expenses.slice(0, 50).forEach((e) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(String(e.date), 20, y);
      doc.text(String(e.category).substring(0, 28), 50, y);
      doc.text(formatMoney(e.amount), 120, y);
      y += 6;
    });
    doc.save("SmartExpense-" + new Date().toISOString().slice(0, 10) + ".pdf");
  }

  async function toImage(elementId) {
    if (typeof html2canvas === "undefined") {
      alert("کتابخانه تصویر بارگذاری نشده.");
      return;
    }
    const el = document.getElementById(elementId) || document.querySelector(".main");
    const canvas = await html2canvas(el, {
      backgroundColor: "#0f1419",
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
