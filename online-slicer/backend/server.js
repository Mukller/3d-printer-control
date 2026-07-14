const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());

// ===== STORAGE
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// ===== STL VOLUME CALC
function calculateVolumeSTL(buffer) {
  const dataView = new DataView(buffer.buffer);
  let offset = 80;
  const triangles = dataView.getUint32(offset, true);
  offset += 4;

  let volume = 0;

  for (let i = 0; i < triangles; i++) {
    const ax = dataView.getFloat32(offset + 12, true);
    const ay = dataView.getFloat32(offset + 16, true);
    const az = dataView.getFloat32(offset + 20, true);

    const bx = dataView.getFloat32(offset + 24, true);
    const by = dataView.getFloat32(offset + 28, true);
    const bz = dataView.getFloat32(offset + 32, true);

    const cx = dataView.getFloat32(offset + 36, true);
    const cy = dataView.getFloat32(offset + 40, true);
    const cz = dataView.getFloat32(offset + 44, true);

    const v =
      (ax * by * cz +
        ay * bz * cx +
        az * bx * cy -
        az * by * cx -
        ay * bx * cz -
        ax * bz * cy) /
      6;

    volume += v;
    offset += 50;
  }

  return Math.abs(volume);
}

// ===== API
app.post("/upload", upload.single("file"), (req, res) => {
  const filePath = req.file.path;

  const buffer = fs.readFileSync(filePath);
  let volume = 0;

  try {
    volume = calculateVolumeSTL(buffer);
  } catch (e) {
    console.log("STL error:", e);
  }

  const price = Math.round(volume * 5);

  res.json({
    file: filePath,
    volume,
    price,
  });
});

// STATIC
app.use("/uploads", express.static("uploads"));

app.listen(5000, "0.0.0.0", () =>
  console.log("🚀 Server running on 5000")
);
