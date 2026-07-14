const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const OCTOPRINT_URL = (process.env.OCTOPRINT_URL || "http://localhost:5000").replace(/\/$/, "");
const OCTOPRINT_KEY = process.env.OCTOPRINT_API_KEY || "";

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

    volume +=
      (ax * by * cz + ay * bz * cx + az * bx * cy -
        az * by * cx - ay * bx * cz - ax * bz * cy) / 6;
    offset += 50;
  }
  return Math.abs(volume);
}

// ===== OctoPrint helper
function octoprintHeaders(extra = {}) {
  return { "X-Api-Key": OCTOPRINT_KEY, ...extra };
}

// ===== UPLOAD STL (preview + volume calc)
app.post("/upload", upload.single("file"), (req, res) => {
  const filePath = req.file.path;
  const buffer = fs.readFileSync(filePath);
  let volume = 0;

  try {
    volume = calculateVolumeSTL(buffer);
  } catch (e) {
    console.log("STL volume error:", e.message);
  }

  const price = Math.round(volume * 5);
  res.json({ file: filePath, volume, price });
});

// ===== SEND TO OCTOPRINT + START PRINT
app.post("/print", async (req, res) => {
  const { filePath, layerHeight = 0.2, infill = 20, supports = false, material = "PLA" } = req.body;

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: "Файл не найден. Сначала загрузи STL." });
  }
  if (!OCTOPRINT_KEY) {
    return res.status(500).json({ error: "OCTOPRINT_API_KEY не задан в .env" });
  }

  const originalName = filePath.split(/[\\/]/).pop().replace(/^\d+-/, "");

  try {
    // 1. Upload STL to OctoPrint local storage
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), { filename: originalName });

    const uploadRes = await axios.post(`${OCTOPRINT_URL}/api/files/local`, form, {
      headers: { ...octoprintHeaders(), ...form.getHeaders() },
      maxBodyLength: Infinity,
    });

    const uploadedName = uploadRes.data?.files?.local?.name || originalName;
    console.log(`Uploaded to OctoPrint: ${uploadedName}`);

    // 2. Try to slice via OctoPrint Cura plugin (optional — plugin may not be installed)
    const gcodeFile = uploadedName.replace(/\.stl$/i, ".gcode");
    try {
      await axios.post(
        `${OCTOPRINT_URL}/api/files/local/${encodeURIComponent(uploadedName)}/slice`,
        {
          slicer: "cura",
          gcode: gcodeFile,
          print: true,
          profile: {
            layer_height: parseFloat(layerHeight),
            fill_density: parseInt(infill),
            print_support: supports === true || supports === "true",
          },
        },
        { headers: octoprintHeaders({ "Content-Type": "application/json" }) }
      );

      return res.json({
        status: "slicing",
        message: `Файл загружен, начата нарезка (слой ${layerHeight} мм, заполнение ${infill}%). Печать запустится автоматически.`,
        file: uploadedName,
      });
    } catch (sliceErr) {
      // Slicer plugin not installed — file uploaded, manual start required
      console.log(`Slice failed (${sliceErr.response?.status}), file uploaded only.`);
      return res.json({
        status: "uploaded",
        message: `Файл «${uploadedName}» загружен в OctoPrint. Плагин нарезчика недоступен — запусти печать вручную.`,
        file: uploadedName,
        octoprintUrl: OCTOPRINT_URL,
      });
    }
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error("OctoPrint error:", detail);
    return res.status(502).json({
      error: "Не удалось подключиться к OctoPrint",
      detail: typeof detail === "string" ? detail : JSON.stringify(detail),
    });
  }
});

// ===== OCTOPRINT PRINTER STATUS
app.get("/printer/status", async (req, res) => {
  try {
    const r = await axios.get(`${OCTOPRINT_URL}/api/printer`, {
      headers: octoprintHeaders(),
    });
    res.json(r.data);
  } catch (err) {
    res.status(502).json({ error: "OctoPrint недоступен", detail: err.message });
  }
});

// ===== STATIC
app.use("/uploads", express.static("uploads"));

app.listen(3001, "0.0.0.0", () =>
  console.log(`🚀 Backend :3001  →  OctoPrint: ${OCTOPRINT_URL}`)
);
