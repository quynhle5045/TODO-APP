const express = require("express");
const path = require("path");
const db = require("./src/db");
const { seed } = require("./seed");

const app = express();

if (!db.prepare("SELECT COUNT(*) AS count FROM tasks").get().count) {
  seed();
}

app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  const isLocalLiveServer = /^http:\/\/(localhost|127\.0\.0\.1):550\d+$/.test(
    origin,
  );

  if (isLocalLiveServer) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    res.header("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/tasks", require("./src/tasks"));
app.use("/api/stats", require("./src/stats"));

app.get("/api/*", (req, res) =>
  res.status(404).json({ error: "Không tìm thấy API." }),
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Đã xảy ra lỗi máy chủ." });
});

const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log("TODO App đang chạy tại http://localhost:" + port);
});
