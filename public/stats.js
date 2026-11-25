const API_BASE = location.port === "3002" ? "" : "http://localhost:3002";
const $ = (selector) => document.querySelector(selector);
const palette = ["#476f55", "#d49b4a", "#8594c4", "#bf7662", "#9cae86"];
const chartInstances = {};

$("#todayLabel").textContent = new Date().toLocaleDateString("vi-VN", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

// Used as a visual preview if the database server is not running yet.
const demoStats = {
  total: 34,
  completed_today: 2,
  completion_rate: 32,
  overdue: 3,
  by_status: [
    { label: "Cần làm", value: 15 },
    { label: "Đang làm", value: 8 },
    { label: "Hoàn thành", value: 11 },
  ],
  by_category: [
    { label: "Công việc", value: 10 },
    { label: "Học tập", value: 9 },
    { label: "Cá nhân", value: 8 },
    { label: "Sức khỏe", value: 7 },
  ],
  by_priority: [
    { label: "Cao", value: 9 },
    { label: "Trung bình", value: 15 },
    { label: "Thấp", value: 10 },
  ],
  completed_per_day: [1, 0, 2, 1, 3, 1, 2],
};

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function renderStats(data, isDemo = false) {
  $("#total").textContent = data.total;
  $("#completed").textContent = data.completed_today;
  $("#rate").textContent = data.completion_rate + "%";
  $("#overdue").textContent = data.overdue;

  const source = $("#dataSource");
  source.textContent = isDemo
    ? "Số liệu minh họa · hãy bật server để xem dữ liệu thật"
    : "Dữ liệu thật từ database SQLite";
  source.classList.toggle("demo-data", isDemo);
  source.classList.toggle("real-data", !isDemo);

  if (!window.Chart) {
    return;
  }

  function draw(id, type, rows) {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
    }

    chartInstances[id] = new Chart($("#" + id), {
      type,
      data: {
        labels: rows.map((item) => item.label),
        datasets: [
          {
            data: rows.map((item) => item.value),
            backgroundColor: palette,
            borderColor: "#476f55",
            borderWidth: type === "line" ? 2 : 0,
            borderRadius: type === "bar" ? 5 : 0,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: type === "doughnut", position: "bottom" },
        },
        scales:
          type === "bar" || type === "line"
            ? {
                y: {
                  beginAtZero: true,
                  ticks: { precision: 0 },
                  grid: { color: "#edf0eb" },
                },
                x: { grid: { display: false } },
              }
            : {},
      },
    });
  }

  draw("statusChart", "doughnut", data.by_status);
  draw("categoryChart", "bar", data.by_category);
  draw("priorityChart", "bar", data.by_priority);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    return date;
  });

  let dailyRows;
  if (isDemo) {
    dailyRows = days.map((date, index) => ({
      label: date.toLocaleDateString("vi-VN", { weekday: "short" }),
      value: data.completed_per_day[index],
    }));
  } else {
    const counts = Object.fromEntries(
      data.completed_per_day.map((item) => [item.label, item.value]),
    );
    dailyRows = days.map((date) => ({
      label: date.toLocaleDateString("vi-VN", { weekday: "short" }),
      value: counts[dateKey(date)] || 0,
    }));
  }

  draw("dailyChart", "line", dailyRows);
}

renderStats(demoStats, true);

fetch(API_BASE + "/api/stats")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Không thể tải số liệu từ máy chủ.");
    }
    return response.json();
  })
  .then((data) => {
    if (data.total > 0) {
      renderStats(data);
    }
  })
  .catch(() => {
    // Keep the sample numbers visible until the local Node.js server is started.
  });
