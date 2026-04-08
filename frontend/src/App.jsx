import React, { useState } from "react";
import STLViewer from "./STLViewer";

export default function App() {
  const [fileUrl, setFileUrl] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
    }
  };

  return (
    <div>
      <input type="file" accept=".stl" onChange={handleFile} />
      <STLViewer fileUrl={fileUrl} />
    </div>
  );
}
