import React from "react";
import "./toolbar.css";

export default function Toolbar({ mode, setMode, onCenter }) {
  return (
    <div className="toolbar">

      <button className="tool-btn" title="Home">
        🏠
      </button>

      <button className="tool-btn" title="Arrange">
        🔳
      </button>

      <div className="divider" />

      <button
        className={`tool-btn ${mode === "translate" ? "active" : ""}`}
        onClick={() => setMode("translate")}
      >
        ⬍
      </button>

      <button
        className={`tool-btn ${mode === "rotate" ? "active" : ""}`}
        onClick={() => setMode("rotate")}
      >
        ⟳
      </button>

      <button
        className={`tool-btn ${mode === "scale" ? "active" : ""}`}
        onClick={() => setMode("scale")}
      >
        ⤢
      </button>

      <div className="divider" />

      <button className="tool-btn">↩</button>
      <button className="tool-btn">↪</button>

      <div className="divider" />

      {/* 🎯 ЦЕНТР */}
      <button className="tool-btn" onClick={onCenter} title="Center">
        ⌖
      </button>

      <button className="tool-btn">⬚</button>

    </div>
  );
}
