/**
 * SmartExpense — Candy / glossy charts
 */
const Charts = (() => {
  let pieChart = null;
  let barChart = null;
  let lastPieSig = "";
  let lastBarSig = "";

  const CANDY = [
    "#f472b6", "#818cf8", "#34d399", "#fbbf24", "#22d3ee",
    "#a78bfa", "#fb7185", "#4ade80", "#38bdf8"
  ];

  function isLight() {
    return document.documentElement.getAttribute("data-theme") === "light";
  }

  function tickColor() {
    return isLight() ? "#64748b" : "#94a3b8";
  }

  function gridColor() {
    return isLight() ? "rgba(99,102,241,0.08)" : "rgba(148,163,184,0.12)";
  }

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

  function candyColors(n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(CANDY[i % CANDY.length]);
    return out;
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
    const sig = signature([labels, data, isLight()]);

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

    const colors = candyColors(labels.length);

    if (pieChart) {
      pieChart.data.labels = labels;
      pieChart.data.datasets[0].data = data;
      pieChart.data.datasets[0].backgroundColor = colors;
      pieChart.options.plugins.legend.labels.color = tickColor();
      pieChart.update("none");
      return;
    }

    pieChart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: isLight() ? "#fff" : "#0c1222",
          hoverOffset: 12,
          hoverBorderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "58%",
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 700,
          easing: "easeOutQuart"
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: tickColor(),
              boxWidth: 12,
              padding: 12,
              font: { size: 11, weight: "600" },
              usePointStyle: true,
              pointStyle: "circle"
            }
          },
          tooltip: {
            backgroundColor: isLight() ? "#1e293b" : "#0f172a",
            titleFont: { weight: "700" },
            padding: 12,
            cornerRadius: 10,
            displayColors: true
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
    const sig = signature([labels, data, isLight()]);

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

    const barColors = labels.map((_, i) => CANDY[i % CANDY.length]);

    if (barChart) {
      barChart.data.labels = labels;
      barChart.data.datasets[0].data = data;
      barChart.data.datasets[0].backgroundColor = barColors;
      barChart.options.scales.x.ticks.color = tickColor();
      barChart.options.scales.y.ticks.color = tickColor();
      barChart.options.scales.x.grid.color = gridColor();
      barChart.options.scales.y.grid.color = gridColor();
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
          backgroundColor: barColors,
          borderRadius: 14,
          borderSkipped: false,
          maxBarThickness: 48
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 700,
          easing: "easeOutQuart"
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isLight() ? "#1e293b" : "#0f172a",
            padding: 12,
            cornerRadius: 10
          }
        },
        scales: {
          x: {
            ticks: { color: tickColor(), maxRotation: 45, font: { weight: "600" } },
            grid: { color: gridColor(), drawBorder: false }
          },
          y: {
            ticks: { color: tickColor() },
            grid: { color: gridColor(), drawBorder: false }
          }
        }
      }
    });
  }

  function update(expenses) {
    lastPieSig = "";
    lastBarSig = "";
    requestAnimationFrame(() => {
      renderPie(expenses);
      renderBar(expenses);
    });
  }

  function refreshTheme() {
    lastPieSig = "";
    lastBarSig = "";
  }

  return { update, refreshTheme };
})();
