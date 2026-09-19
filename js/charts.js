/**
 * SmartExpense — Optimized charts
 * - Skip redraw when data signature unchanged
 * - Empty states without creating Chart instances
 * - destroy only when needed
 */
const Charts = (() => {
  let pieChart = null;
  let barChart = null;
  let lastPieSig = "";
  let lastBarSig = "";

  const COLORS = [
    "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7",
    "#06b6d4", "#ec4899", "#84cc16", "#f97316"
  ];

  function signature(obj) {
    return JSON.stringify(obj);
  }

  function clearCanvasMessage(canvas, msg) {
    const parent = canvas.parentElement;
    let empty = parent.querySelector(".chart-empty");
    if (!empty) {
      empty = document.createElement("p");
      empty.className = "chart-empty";
      parent.appendChild(empty);
    }
    empty.textContent = msg;
    empty.style.display = "block";
    canvas.style.display = "none";
  }

  function showCanvas(canvas) {
    canvas.style.display = "block";
    const empty = canvas.parentElement.querySelector(".chart-empty");
    if (empty) empty.style.display = "none";
  }

  function renderPie(expenses) {
    const canvas = document.getElementById("chart-pie");
    if (!canvas || typeof Chart === "undefined") return;

    const byCat = {};
    for (let i = 0; i < expenses.length; i++) {
      const e = expenses[i];
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    }
    const labels = Object.keys(byCat);
    const data = Object.values(byCat);
    const sig = signature([labels, data]);

    if (!labels.length) {
      if (pieChart) {
        pieChart.destroy();
        pieChart = null;
        lastPieSig = "";
      }
      clearCanvasMessage(canvas, "داده‌ای برای نمودار نیست");
      return;
    }

    if (sig === lastPieSig && pieChart) return;
    lastPieSig = sig;
    showCanvas(canvas);

    if (pieChart) {
      pieChart.data.labels = labels;
      pieChart.data.datasets[0].data = data;
      pieChart.data.datasets[0].backgroundColor = COLORS.slice(0, labels.length);
      pieChart.update("none");
      return;
    }

    pieChart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: COLORS.slice(0, labels.length),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 280 },
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#8b9bb0", boxWidth: 12, font: { size: 11 } }
          }
        }
      }
    });
  }

  function renderBar(expenses) {
    const canvas = document.getElementById("chart-bar");
    if (!canvas || typeof Chart === "undefined") return;

    const byMonth = {};
    for (let i = 0; i < expenses.length; i++) {
      const m = Storage.monthKey(expenses[i].date);
      byMonth[m] = (byMonth[m] || 0) + expenses[i].amount;
    }
    const labels = Object.keys(byMonth).sort();
    const data = labels.map((k) => byMonth[k]);
    const sig = signature([labels, data]);

    if (!labels.length) {
      if (barChart) {
        barChart.destroy();
        barChart = null;
        lastBarSig = "";
      }
      clearCanvasMessage(canvas, "داده‌ای برای نمودار نیست");
      return;
    }

    if (sig === lastBarSig && barChart) return;
    lastBarSig = sig;
    showCanvas(canvas);

    if (barChart) {
      barChart.data.labels = labels;
      barChart.data.datasets[0].data = data;
      barChart.update("none");
      return;
    }

    barChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "هزینه",
          data,
          backgroundColor: "#3b82f6",
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 280 },
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#8b9bb0", maxRotation: 45 }, grid: { color: "rgba(42,53,68,.5)" } },
          y: { ticks: { color: "#8b9bb0" }, grid: { color: "rgba(42,53,68,.5)" } }
        }
      }
    });
  }

  function update(expenses) {
    requestAnimationFrame(() => {
      renderPie(expenses);
      renderBar(expenses);
    });
  }

  return { update };
})();
