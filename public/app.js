const API_BASE = location.port === "3002" ? "" : "http://localhost:3002";
const $ = (s) => document.querySelector(s),
  today = () => {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
  };
$("#todayLabel").textContent = new Date().toLocaleDateString("vi-VN", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
let view = "today",
  timer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2400);
}
function esc(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function slug(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, "-");
}
async function load() {
  const q = new URLSearchParams();
  if ($("#search").value) q.set("search", $("#search").value);
  [
    ["status", "statusFilter"],
    ["priority", "priorityFilter"],
    ["category", "categoryFilter"],
  ].forEach(([k, id]) => {
    if ($("#" + id).value) q.set(k, $("#" + id).value);
  });
  q.set("date", $("#dateFilter").value || view);
  const r = await fetch(API_BASE + "/api/tasks?" + q),
    tasks = await r.json();
  $("#listTitle").textContent =
    view === "today" && !$("#dateFilter").value
      ? "Việc hôm nay"
      : "Danh sách công việc";
  $("#listSubtitle").textContent =
    view === "today" && !$("#dateFilter").value
      ? "Những điều bạn muốn hoàn thành hôm nay"
      : "Các công việc theo bộ lọc đã chọn";
  $("#taskCount").textContent = tasks.length + " công việc";
  const statusCounts = { "Cần làm": 0, "Đang làm": 0, "Hoàn thành": 0 };
  tasks.forEach((t) => {
    if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
  });
  $("#todoCount").textContent = statusCounts["Cần làm"];
  $("#doingCount").textContent = statusCounts["Đang làm"];
  $("#doneCount").textContent = statusCounts["Hoàn thành"];
  const done = statusCounts["Hoàn thành"];
  $("#progressTitle").textContent =
    done + " / " + tasks.length + " việc đã xong";
  $("#progressText").textContent = tasks.length
    ? done === tasks.length
      ? "Tuyệt vời, bạn đã hoàn thành tất cả!"
      : "Cứ tiếp tục từng bước nhé."
    : "Thêm công việc đầu tiên của bạn.";
  const pct = tasks.length ? Math.round((done * 100) / tasks.length) : 0;
  $("#progressPercent").textContent = pct + "%";
  $("#progressBar").style.width = pct + "%";
  $("#taskList").innerHTML = tasks.length
    ? tasks
        .map(
          (t) =>
            '<article class="task ' +
            (t.status === "Hoàn thành" ? "is-done" : "") +
            '"><button class="check" title="Đổi trạng thái" data-status="' +
            t.id +
            '">' +
            (t.status === "Hoàn thành" ? "✓" : "") +
            "</button><div><h3>" +
            esc(t.title) +
            "</h3><p>" +
            esc(t.description) +
            '</p><div class="meta"><span class="pill">' +
            esc(t.category) +
            '</span><span class="pill priority-' +
            slug(t.priority) +
            '">Ưu tiên ' +
            esc(t.priority.toLowerCase()) +
            '</span><span class="pill status-' +
            slug(t.status) +
            '">' +
            esc(t.status) +
            "</span><span>" +
            esc(t.due_date) +
            (t.start_time ? " · " + esc(t.start_time) : "") +
            '</span></div></div><div class="ops"><button data-edit="' +
            t.id +
            '">Sửa</button><button data-delete="' +
            t.id +
            '">Xóa</button></div></article>',
        )
        .join("")
    : '<div class="empty"><strong>Danh sách đang trống</strong>Thử thay đổi bộ lọc hoặc thêm một công việc mới.</div>';
}
function openForm(t) {
  $("#taskForm").reset();
  $("#taskId").value = t ? t.id : "";
  $("#dialogTitle").textContent = t ? "Chỉnh sửa công việc" : "Thêm công việc";
  $("#title").value = t ? t.title : "";
  $("#description").value = t ? t.description || "" : "";
  $("#category").value = t ? t.category : "Công việc";
  $("#priority").value = t ? t.priority : "Trung bình";
  $("#status").value = t ? t.status : "Cần làm";
  $("#dueDate").value = t ? t.due_date : today();
  $("#startTime").value = t ? t.start_time || "" : "";
  $("#taskDialog").showModal();
}
$("#addTask").onclick = () => openForm();
$("#closeDialog").onclick = $("#cancelDialog").onclick = () =>
  $("#taskDialog").close();
document.querySelectorAll(".tab").forEach(
  (b) =>
    (b.onclick = () => {
      view = b.dataset.view;
      document
        .querySelectorAll(".tab")
        .forEach((x) => x.classList.toggle("active", x === b));
      $("#dateFilter").value = "";
      load();
    }),
);
[
  "search",
  "statusFilter",
  "priorityFilter",
  "categoryFilter",
  "dateFilter",
].forEach((id) =>
  $("#" + id).addEventListener(id === "search" ? "input" : "change", () => {
    clearTimeout(timer);
    timer = setTimeout(load, 160);
  }),
);
$("#resetFilters").onclick = () => {
  $("#search").value = "";
  ["statusFilter", "priorityFilter", "categoryFilter", "dateFilter"].forEach(
    (id) => ($("#" + id).value = ""),
  );
  view = "today";
  document
    .querySelectorAll(".tab")
    .forEach((x) => x.classList.toggle("active", x.dataset.view === "today"));
  load();
};
$("#taskList").onclick = async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  try {
    if (b.dataset.edit) {
      const t = await (
        await fetch(API_BASE + "/api/tasks/" + b.dataset.edit)
      ).json();
      openForm(t);
    }
    if (b.dataset.delete && confirm("Bạn có chắc muốn xóa công việc này?")) {
      const r = await fetch(API_BASE + "/api/tasks/" + b.dataset.delete, {
        method: "DELETE",
      });
      if (!r.ok) throw Error("Không thể xóa công việc");
      toast("Đã xóa công việc");
      load();
    }
    if (b.dataset.status) {
      const r = await fetch(
        API_BASE + "/api/tasks/" + b.dataset.status + "/status",
        {
          method: "PATCH",
        },
      );
      if (!r.ok) throw Error("Không thể đổi trạng thái");
      load();
    }
  } catch (err) {
    toast(err.message);
  }
};
$("#taskForm").onsubmit = async (e) => {
  e.preventDefault();
  const id = $("#taskId").value,
    payload = {
      title: $("#title").value.trim(),
      description: $("#description").value,
      category: $("#category").value,
      priority: $("#priority").value,
      status: $("#status").value,
      due_date: $("#dueDate").value,
      start_time: $("#startTime").value,
    };
  try {
    const r = await fetch(API_BASE + "/api/tasks" + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      data = await r.json();
    if (!r.ok) throw Error(data.error || "Không thể lưu công việc");
    $("#taskDialog").close();
    toast(id ? "Đã cập nhật công việc" : "Đã thêm công việc");
    load();
  } catch (err) {
    toast(err.message);
  }
};
load();
