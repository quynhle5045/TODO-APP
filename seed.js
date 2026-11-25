const db = require("./src/db");
const names = [
  [
    "Hoàn thiện báo cáo tuần",
    "Tổng hợp tiến độ và gửi cho nhóm.",
    "Công việc",
    "Cao",
    "Đang làm",
    "09:00",
  ],
  [
    "Ôn bài môn Lập trình",
    "Xem lại phần cơ sở dữ liệu và làm bài tập.",
    "Học tập",
    "Trung bình",
    "Cần làm",
    "10:00",
  ],
  [
    "Đi bộ buổi sáng",
    "Đi bộ thư giãn quanh công viên.",
    "Sức khỏe",
    "Thấp",
    "Hoàn thành",
    "07:00",
  ],
  [
    "Họp nhóm dự án",
    "Trao đổi các đầu việc còn lại.",
    "Công việc",
    "Cao",
    "Cần làm",
    "14:00",
  ],
  [
    "Đọc 20 trang sách",
    "Duy trì thói quen đọc mỗi ngày.",
    "Cá nhân",
    "Thấp",
    "Cần làm",
    "20:00",
  ],
  [
    "Chuẩn bị slide thuyết trình",
    "Chỉnh sửa hình ảnh và nội dung.",
    "Học tập",
    "Cao",
    "Đang làm",
    "15:00",
  ],
  [
    "Gọi điện cho gia đình",
    "Hỏi thăm mọi người.",
    "Cá nhân",
    "Trung bình",
    "Cần làm",
    "19:00",
  ],
  [
    "Uống đủ nước",
    "Nhớ uống nước trong ngày.",
    "Sức khỏe",
    "Thấp",
    "Hoàn thành",
    "08:00",
  ],
  [
    "Trả lời email",
    "Phản hồi các email quan trọng.",
    "Công việc",
    "Trung bình",
    "Cần làm",
    "11:00",
  ],
  [
    "Lên kế hoạch ngày mai",
    "Ghi lại ba việc ưu tiên.",
    "Cá nhân",
    "Trung bình",
    "Cần làm",
    "21:00",
  ],
];
function seed() {
  const insert = db.prepare(
    "INSERT INTO tasks(title,description,category,priority,status,due_date,start_time) VALUES(?,?,?,?,?,?,?)",
  );
  const now = new Date();
  db.transaction(() => {
    db.prepare("DELETE FROM tasks").run();
    for (let i = 0; i < 34; i++) {
      const offset =
        i < 10 ? 0 : i % 2 ? -Math.ceil((i - 9) / 2) : Math.ceil((i - 9) / 2);
      const day = new Date(now);
      day.setDate(day.getDate() + offset);
      const due = [
        day.getFullYear(),
        String(day.getMonth() + 1).padStart(2, "0"),
        String(day.getDate()).padStart(2, "0"),
      ].join("-");
      const item = names[i % names.length];
      const status = offset < 0 && i % 3 ? "Hoàn thành" : item[4];
      insert.run(
        i < names.length
          ? item[0]
          : item[0] + " (" + (Math.floor(i / names.length) + 1) + ")",
        item[1],
        item[2],
        item[3],
        status,
        due,
        item[5],
      );
    }
  })();
  console.log("Đã tạo 34 công việc mẫu.");
}
if (require.main === module) seed();
module.exports = { seed };
