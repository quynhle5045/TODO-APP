const express = require("express");
const db = require("./db");
const router = express.Router();
router.get("/", (req, res) => {
  const today = new Date().toLocaleDateString("en-CA");
  const totals = db
    .prepare(
      "SELECT COUNT(*) total,SUM(status='Hoàn thành' AND due_date=?) completed_today,SUM(due_date<? AND status!='Hoàn thành') overdue,SUM(status='Hoàn thành') done FROM tasks",
    )
    .get(today, today);
  const group = (sql) => db.prepare(sql).all();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const startDate = start.toLocaleDateString("en-CA");
  res.json({
    total: totals.total,
    completed_today: totals.completed_today || 0,
    completion_rate: totals.total
      ? Math.round((totals.done * 100) / totals.total)
      : 0,
    overdue: totals.overdue || 0,
    by_status: group(
      "SELECT status label,COUNT(*) value FROM tasks GROUP BY status",
    ),
    by_category: group(
      "SELECT category label,COUNT(*) value FROM tasks GROUP BY category",
    ),
    by_priority: group(
      "SELECT priority label,COUNT(*) value FROM tasks GROUP BY priority",
    ),
    completed_per_day: db
      .prepare(
        "SELECT due_date label,COUNT(*) value FROM tasks WHERE status='Hoàn thành' AND due_date>=? AND due_date<=? GROUP BY due_date",
      )
      .all(startDate, today),
  });
});
module.exports = router;
