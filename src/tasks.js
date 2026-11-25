const express = require("express");
const db = require("./db");
const router = express.Router();
const fields = [
  "title",
  "description",
  "category",
  "priority",
  "status",
  "due_date",
  "start_time",
];
const enums = {
  priority: ["Thấp", "Trung bình", "Cao"],
  status: ["Cần làm", "Đang làm", "Hoàn thành"],
};
function validate(body) {
  const errors = [];
  if (!body.title || !String(body.title).trim())
    errors.push("Vui lòng nhập tiêu đề công việc.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date || "") ||
    Number.isNaN(Date.parse(body.due_date + "T00:00:00"))
  )
    errors.push("Ngày đến hạn không hợp lệ.");
  if (body.start_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.start_time))
    errors.push("Giờ cần có định dạng HH:MM.");
  for (const [key, values] of Object.entries(enums))
    if (body[key] && !values.includes(body[key]))
      errors.push("Giá trị " + key + " không hợp lệ.");
  return errors;
}
router.get("/", (req, res) => {
  const where = [],
    values = [];
  if (req.query.search) {
    where.push(
      "(title LIKE ? COLLATE NOCASE OR description LIKE ? COLLATE NOCASE)",
    );
    values.push("%" + req.query.search + "%", "%" + req.query.search + "%");
  }
  for (const key of ["status", "priority", "category"])
    if (req.query[key]) {
      where.push(key + "=?");
      values.push(req.query[key]);
    }
  if (req.query.date && req.query.date !== "all") {
    where.push("due_date=?");
    values.push(
      req.query.date === "today"
        ? new Date().toLocaleDateString("en-CA")
        : req.query.date,
    );
  }
  const sql =
    "SELECT * FROM tasks " +
    (where.length ? "WHERE " + where.join(" AND ") : "") +
    " ORDER BY due_date, CASE WHEN start_time = '' THEN 1 ELSE 0 END, start_time, CASE priority WHEN 'Cao' THEN 1 WHEN 'Trung bình' THEN 2 ELSE 3 END";
  res.json(db.prepare(sql).all(...values));
});
router.get("/:id", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id=?").get(req.params.id);
  task
    ? res.json(task)
    : res.status(404).json({ error: "Không tìm thấy công việc." });
});
router.post("/", (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });
  const b = req.body;
  const result = db
    .prepare(
      "INSERT INTO tasks(" +
        fields.join(",") +
        ") VALUES(" +
        fields.map((x) => ":" + x).join(",") +
        ")",
    )
    .run(Object.fromEntries(fields.map((k) => [k, b[k] || ""])));
  res
    .status(201)
    .json(
      db.prepare("SELECT * FROM tasks WHERE id=?").get(result.lastInsertRowid),
    );
});
router.put("/:id", (req, res) => {
  if (!db.prepare("SELECT id FROM tasks WHERE id=?").get(req.params.id))
    return res.status(404).json({ error: "Không tìm thấy công việc." });
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });
  const b = req.body;
  db.prepare(
    "UPDATE tasks SET " +
      fields.map((k) => k + "=@" + k).join(",") +
      ",updated_at=CURRENT_TIMESTAMP WHERE id=@id",
  ).run({
    ...Object.fromEntries(fields.map((k) => [k, b[k] || ""])),
    id: req.params.id,
  });
  res.json(db.prepare("SELECT * FROM tasks WHERE id=?").get(req.params.id));
});
router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM tasks WHERE id=?").run(req.params.id);
  result.changes
    ? res.status(204).end()
    : res.status(404).json({ error: "Không tìm thấy công việc." });
});
router.patch("/:id/status", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id=?").get(req.params.id);
  if (!task)
    return res.status(404).json({ error: "Không tìm thấy công việc." });
  const flow = ["Cần làm", "Đang làm", "Hoàn thành"];
  db.prepare(
    "UPDATE tasks SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
  ).run(flow[(flow.indexOf(task.status) + 1) % flow.length], task.id);
  res.json(db.prepare("SELECT * FROM tasks WHERE id=?").get(task.id));
});
module.exports = router;
