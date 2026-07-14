import { useState } from "react";
import axios from "axios";
import STLViewer from "./STLViewer";

export default function CalculatorForm() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState(null);
  const [price, setPrice] = useState(null);

  const send = async () => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await axios.post("http://localhost:5000/upload", fd);

    setUrl("http://localhost:5000/" + res.data.file);
    setPrice(res.data.price);
  };

  return (
    <section className="py-20 text-center">
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <button onClick={send} className="block mx-auto mt-4 bg-black text-white p-3">
        Upload
      </button>

      <STLViewer fileUrl={url} />

      {price && <p>Цена: {price}</p>}
    </section>
  );
}