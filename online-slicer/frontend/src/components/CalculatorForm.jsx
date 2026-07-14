import { useState } from "react";
import axios from "axios";
import STLViewer from "./STLViewer";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const LAYER_OPTIONS = ["0.1", "0.15", "0.2", "0.3"];
const INFILL_OPTIONS = ["10", "20", "30", "40", "50"];
const MATERIAL_OPTIONS = ["PLA", "PETG", "ABS", "TPU"];

export default function CalculatorForm() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [serverFilePath, setServerFilePath] = useState(null);
  const [price, setPrice] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Print settings
  const [layerHeight, setLayerHeight] = useState("0.2");
  const [infill, setInfill] = useState("20");
  const [supports, setSupports] = useState(false);
  const [material, setMaterial] = useState("PLA");

  // Print status
  const [printStatus, setPrintStatus] = useState(null); // null | "loading" | {status, message, ...}
  const [printError, setPrintError] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setPrintStatus(null);
    setPrintError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await axios.post(`${API}/upload`, fd);

      setPreviewUrl(`${API}/${res.data.file}`);
      setServerFilePath(res.data.file);
      setPrice(res.data.price);
    } catch (e) {
      alert("Ошибка загрузки: " + (e.response?.data?.error || e.message));
    } finally {
      setUploading(false);
    }
  };

  const handlePrint = async () => {
    if (!serverFilePath) return;
    setPrintStatus("loading");
    setPrintError(null);

    try {
      const res = await axios.post(`${API}/print`, {
        filePath: serverFilePath,
        layerHeight,
        infill,
        supports,
        material,
      });
      setPrintStatus(res.data);
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setPrintError(msg);
      setPrintStatus(null);
    }
  };

  return (
    <section id="calculator" className="py-20 px-4 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-10">Загрузить модель</h2>

      {/* Upload */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <label className="cursor-pointer border-2 border-dashed border-gray-400 rounded-xl p-8 text-center w-full max-w-md hover:border-black transition">
          <p className="text-gray-500 mb-2">Перетащи или выбери STL-файл</p>
          <p className="font-semibold">{file ? file.name : "Нажми для выбора"}</p>
          <input
            type="file"
            accept=".stl"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files[0]);
              setPreviewUrl(null);
              setServerFilePath(null);
              setPrice(null);
              setPrintStatus(null);
            }}
          />
        </label>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-black text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-40 hover:bg-gray-800 transition"
        >
          {uploading ? "Загрузка…" : "Загрузить и просмотреть"}
        </button>
      </div>

      {/* STL Preview */}
      {previewUrl && (
        <div className="border rounded-xl overflow-hidden mb-8">
          <STLViewer fileUrl={previewUrl} />
        </div>
      )}

      {/* Price */}
      {price !== null && (
        <p className="text-center text-lg mb-6">
          Расчётная цена: <span className="font-bold">{price} ₽</span>
        </p>
      )}

      {/* Print settings — shown after upload */}
      {serverFilePath && (
        <div className="border rounded-xl p-6 mb-6 bg-gray-50">
          <h3 className="text-xl font-bold mb-5">Настройки печати</h3>

          <div className="grid grid-cols-2 gap-6">
            {/* Layer height */}
            <div>
              <label className="block text-sm font-semibold mb-2">Высота слоя (мм)</label>
              <div className="flex gap-2 flex-wrap">
                {LAYER_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setLayerHeight(v)}
                    className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${
                      layerHeight === v
                        ? "bg-black text-white border-black"
                        : "border-gray-300 hover:border-black"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Infill */}
            <div>
              <label className="block text-sm font-semibold mb-2">Заполнение (%)</label>
              <div className="flex gap-2 flex-wrap">
                {INFILL_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setInfill(v)}
                    className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${
                      infill === v
                        ? "bg-black text-white border-black"
                        : "border-gray-300 hover:border-black"
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>

            {/* Material */}
            <div>
              <label className="block text-sm font-semibold mb-2">Материал</label>
              <div className="flex gap-2 flex-wrap">
                {MATERIAL_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setMaterial(v)}
                    className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${
                      material === v
                        ? "bg-black text-white border-black"
                        : "border-gray-300 hover:border-black"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Supports */}
            <div>
              <label className="block text-sm font-semibold mb-2">Поддержки</label>
              <button
                onClick={() => setSupports((s) => !s)}
                className={`px-4 py-1 rounded-lg border text-sm font-medium transition ${
                  supports
                    ? "bg-black text-white border-black"
                    : "border-gray-300 hover:border-black"
                }`}
              >
                {supports ? "Включены" : "Выключены"}
              </button>
            </div>
          </div>

          {/* Settings summary */}
          <p className="mt-5 text-sm text-gray-500">
            Слой: <b>{layerHeight} мм</b> · Заполнение: <b>{infill}%</b> · Материал: <b>{material}</b> · Поддержки: <b>{supports ? "да" : "нет"}</b>
          </p>

          {/* Send to print button */}
          <button
            onClick={handlePrint}
            disabled={printStatus === "loading"}
            className="mt-5 w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-40"
          >
            {printStatus === "loading" ? "Отправка на принтер…" : "🖨 Отправить на печать"}
          </button>

          {/* Print result */}
          {printStatus && printStatus !== "loading" && (
            <div
              className={`mt-4 p-4 rounded-lg text-sm ${
                printStatus.status === "slicing"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-yellow-50 text-yellow-800 border border-yellow-200"
              }`}
            >
              <p className="font-semibold mb-1">
                {printStatus.status === "slicing" ? "✅ Нарезка запущена" : "📁 Файл загружен"}
              </p>
              <p>{printStatus.message}</p>
              {printStatus.octoprintUrl && (
                <a
                  href={printStatus.octoprintUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline mt-1 inline-block"
                >
                  Открыть OctoPrint →
                </a>
              )}
            </div>
          )}

          {printError && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm">
              <p className="font-semibold mb-1">❌ Ошибка</p>
              <p>{printError}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
