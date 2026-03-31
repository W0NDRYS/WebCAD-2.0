import React from "react";
import {
  Circle,
  Download,
  FileImage,
  FileJson,
  FileType,
  Hand,
  Minus,
  MousePointer2,
  Move,
  PenTool,
  Redo2,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { TOOLBAR, styles } from "../constants";
import { useCad } from "../context/CadContext";

const toolIcons = {
  select: MousePointer2,
  line: Minus,
  rect: Square,
  circle: Circle,
  polyline: PenTool,
  text: Type,
  move: Move,
  hand: Hand,
};

const actions = [
  { key: "undo", label: "Undo", icon: Undo2 },
  { key: "redo", label: "Redo", icon: Redo2 },
  { key: "delete", label: "Smazat vybraný", icon: Trash2 },
  { key: "svg", label: "Export SVG", icon: FileType },
  { key: "png", label: "Export PNG", icon: FileImage },
  { key: "pdf", label: "Export PDF", icon: Download },
  { key: "dxf", label: "Export DXF", icon: Download },
  { key: "json", label: "Export JSON", icon: FileJson },
];

export default function Sidebar() {
  const {
    tool,
    setTool,
    undo,
    redo,
    removeSelected,
    exportSvg,
    exportPng,
    exportPdf,
    exportDxf,
    exportJson,
  } = useCad();

  function runAction(key) {
    if (key === "undo") undo();
    if (key === "redo") redo();
    if (key === "delete") removeSelected();
    if (key === "svg") exportSvg();
    if (key === "png") exportPng();
    if (key === "pdf") exportPdf();
    if (key === "dxf") exportDxf();
    if (key === "json") exportJson();
  }

  return (
    <div style={styles.rail}>
      {TOOLBAR.map(({ key, label }) => {
        const Icon = toolIcons[key];
        const active = tool === key;

        return (
          <button
            key={key}
            title={label}
            onClick={() => setTool(key)}
            style={{
              ...styles.railButton,
              ...(active
                ? {
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "1px solid #2563eb",
                  }
                : {}),
            }}
          >
            <Icon size={18} />
          </button>
        );
      })}

      <div
        style={{
          width: "36px",
          height: "1px",
          background: "#e2e8f0",
          margin: "8px 0",
        }}
      />

      {actions.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          title={label}
          onClick={() => runAction(key)}
          style={styles.railButton}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
}