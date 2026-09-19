/**
 * SmartExpense — Chart.js helpers (lazy, minimal redraw)
 */
const Charts = (() => {
  let pieChart = null;
  let barChart = null;

  const COLORS = [
    "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7",
    "#06b6d4", "#ec4899", "#84cc16", "#f97316"
  ];

  function destroyIf(chart) {
    if (chart) chart.destroy();
  }

  function renderPie(expenses) {
    const canvas = document.getElementById("chart-pie");
    if (!canvas || typeof Chart === "undefined") return;

    const byCat = {};
    expenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });
    const labels = Object.keys(byCat);
    const data = Object.values(byCat);

    destroyIf(pieChart);
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
    expenses.forEach((e) => {
      const m = Storage.monthKey(e.date);
      byMonth[m] = (byMonth[m] || 0) + e.amount;
    });
    const labels = Object.keys(byMonth).sort();
    const data = labels.map((k) => byMonth[k]);

    destroyIf(barChart);
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
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#8b9bb0" }, grid: { color: "rgba(42,53,68,.5)" } },
          y: { ticks: { color: "#8b9bb0" }, grid: { color: "rgba(42,53,68,.5)" } }
        }
      }
    });
  }

  function update(expenses) {
    renderPie(expenses);
    renderBar(expenses);
  }

  return { update };
})();
