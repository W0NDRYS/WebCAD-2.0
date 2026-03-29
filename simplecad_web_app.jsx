// CLEAN MERGE: Nové UX + modulární CAD logika
// Každý blok níže ulož jako samostatný soubor.

// ================================
// FILE: src/App.jsx
// ================================
import React from "react";
import { CadProvider } from "./cad/context/CadProvider";
import Sidebar from "./cad/components/Sidebar";
import CanvasView from "./cad/components/CanvasView";
import StatusBar from "./cad/components/StatusBar";
import "./index.css";

const shell = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "64px 1fr",
  gridTemplateRows: "1fr 48px",
  background: "#f1f5f9",
  color: "#0f172a",
  fontFamily: "Inter, Arial, Helvetica, sans-serif",
};

export default function App() {
  return (
    <CadProvider>
      <div style={shell}>
        <Sidebar />
        <CanvasView />
        <StatusBar />
      </div>
    </CadProvider>
  );
}

// ================================
// FILE: src/cad/constants.js
// ================================
export const SVG_W = 1200;
export const SVG_H = 800;
export const BASE_GRID_MM = 10;
export const HANDLE_R = 8;

export const UNIT_FACTORS = {
  mm: 1,
  cm: 10,
  m: 1000,
};

export const TOOLBAR = [
  { key: "select", label: "Výběr" },
  { key: "line", label: "Čára" },
  { key: "rect", label: "Obdélník" },
  { key: "circle", label: "Kružnice" },
  { key: "polyline", label: "Polyline" },
  { key: "text", label: "Text" },
  { key: "pan", label: "Posun" },
];

export const styles = {
  rail: {
    gridColumn: "1 / 2",
    gridRow: "1 / 3",
    borderRight: "1px solid #e2e8f0",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "10px 8px",
  },
  railButton: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  canvasArea: {
    gridColumn: "2 / 3",
    gridRow: "1 / 2",
    padding: "16px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
    overflow: "hidden",
    height: "100%",
  },
  cardHeader: {
    padding: "18px 20px 8px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
  },
  toolbarMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 500,
  },
  canvasWrap: {
    margin: 16,
    overflow: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    background: "#ffffff",
    height: "calc(100vh - 96px)",
  },
  statusBar: {
    gridColumn: "2 / 3",
    gridRow: "2 / 3",
    borderTop: "1px solid #e2e8f0",
    background: "#ffffff",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    gap: "16px",
    padding: "0 16px",
    fontSize: "13px",
    color: "#334155",
  },
  statusInfo: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  statusCommand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  input: {
    minHeight: "32px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "6px 10px",
    boxSizing: "border-box",
    background: "#ffffff",
  },
  primaryButton: {
    minHeight: "32px",
    borderRadius: "10px",
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    padding: "0 12px",
    cursor: "pointer",
  },
};

// ================================
// FILE: src/cad/utils/units.js
// ================================
import { UNIT_FACTORS } from "../constants";

export function mmToDisplay(value, unit) {
  return Number((value / UNIT_FACTORS[unit]).toFixed(3));
}

export function displayToMm(value, unit) {
  const num = Number(value);
  return Number.isFinite(num) ? num * UNIT_FACTORS[unit] : 0;
}

export function snap(value, enabled, gridMm) {
  return enabled ? Math.round(value / gridMm) * gridMm : value;
}

// ================================
// FILE: src/cad/utils/geometry.js
// ================================
import { HANDLE_R } from "../constants";

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function cloneShapes(value) {
  return JSON.parse(JSON.stringify(value));
}

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function normalizeRect(shape) {
  return {
    x: Math.min(shape.x1, shape.x2),
    y: Math.min(shape.y1, shape.y2),
    w: Math.abs(shape.x2 - shape.x1),
    h: Math.abs(shape.y2 - shape.y1),
  };
}

export function hitTest(shape, x, y) {
  const tolerance = 10;

  if (shape.type === "rect") {
    const { x: left, y: top, w, h } = normalizeRect(shape);
    return x >= left && x <= left + w && y >= top && y <= top + h;
  }

  if (shape.type === "circle") {
    return Math.abs(distance(shape.cx, shape.cy, x, y) - shape.r) <= tolerance || distance(shape.cx, shape.cy, x, y) < shape.r;
  }

  if (shape.type === "line") {
    const len = distance(shape.x1, shape.y1, shape.x2, shape.y2);
    const d1 = distance(shape.x1, shape.y1, x, y);
    const d2 = distance(shape.x2, shape.y2, x, y);
    return Math.abs(len - (d1 + d2)) < tolerance;
  }

  if (shape.type === "text") {
    return x >= shape.x && x <= shape.x + shape.text.length * shape.fontSize * 0.65 && y <= shape.y && y >= shape.y - shape.fontSize;
  }

  if (shape.type === "polyline") {
    return shape.points.some((p, i) => {
      const prev = i > 0 ? shape.points[i - 1] : null;
      if (!prev) return distance(p.x, p.y, x, y) < tolerance;
      const len = distance(prev.x, prev.y, p.x, p.y);
      const d1 = distance(prev.x, prev.y, x, y);
      const d2 = distance(p.x, p.y, x, y);
      return Math.abs(len - (d1 + d2)) < tolerance;
    });
  }

  return false;
}

export function getLineHandle(shape, x, y) {
  if (!shape || shape.type !== "line") return null;
  if (distance(shape.x1, shape.y1, x, y) <= HANDLE_R + 4) return "start";
  if (distance(shape.x2, shape.y2, x, y) <= HANDLE_R + 4) return "end";
  return null;
}

export function getPolylineHandle(shape, x, y) {
  if (!shape || shape.type !== "polyline") return null;
  const idx = shape.points.findIndex((p) => distance(p.x, p.y, x, y) <= HANDLE_R + 4);
  return idx >= 0 ? idx : null;
}

// ================================
// FILE: src/cad/utils/shapeMutations.js
// ================================
export function updateShapeById(shapes, id, updater) {
  return shapes.map((shape) => (shape.id === id ? updater(JSON.parse(JSON.stringify(shape))) : shape));
}

export function moveShape(shape, dx, dy) {
  if (shape.type === "line" || shape.type === "rect") {
    return { ...shape, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy };
  }
  if (shape.type === "circle") {
    return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
  }
  if (shape.type === "text") {
    return { ...shape, x: shape.x + dx, y: shape.y + dy };
  }
  if (shape.type === "polyline") {
    return { ...shape, points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
  }
  return shape;
}

// ================================
// FILE: src/cad/utils/exporters.js
// ================================
import { SVG_H, SVG_W } from "../constants";
import { normalizeRect } from "./geometry";

function escapeXml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function shapeToSvg(shape) {
  const common = `stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" fill="${shape.fill || "none"}"`;
  if (shape.type === "line") return `<line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" ${common} />`;
  if (shape.type === "rect") {
    const { x, y, w, h } = normalizeRect(shape);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${common} />`;
  }
  if (shape.type === "circle") return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" ${common} />`;
  if (shape.type === "text") return `<text x="${shape.x}" y="${shape.y}" font-size="${shape.fontSize}" fill="${shape.stroke}" font-family="Arial, Helvetica, sans-serif">${escapeXml(shape.text)}</text>`;
  if (shape.type === "polyline") return `<polyline points="${shape.points.map((p) => `${p.x},${p.y}`).join(" ")}" ${common} fill="none" />`;
  return "";
}

export function shapesToSvg(shapes, options = {}) {
  const { showGrid = true, background = "#ffffff", gridMm = 10 } = options;
  const gridLines = [];
  if (showGrid) {
    for (let x = 0; x <= SVG_W; x += gridMm) gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${SVG_H}" stroke="#f1f5f9" stroke-width="1" />`);
    for (let y = 0; y <= SVG_H; y += gridMm) gridLines.push(`<line x1="0" y1="${y}" x2="${SVG_W}" y2="${y}" stroke="#f1f5f9" stroke-width="1" />`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}" viewBox="0 0 ${SVG_W} ${SVG_H}">
  <rect width="100%" height="100%" fill="${background}" />
  ${gridLines.join("\n")}
  ${shapes.map(shapeToSvg).join("\n")}
</svg>`;
}

function lineToDxf(shape) {
  return `0
LINE
8
0
10
${shape.x1}
20
${SVG_H - shape.y1}
30
0
11
${shape.x2}
21
${SVG_H - shape.y2}
31
0
`;
}

function rectToDxf(shape) {
  const { x, y, w, h } = normalizeRect(shape);
  const x2 = x + w;
  const y2 = y + h;
  return [
    { x1: x, y1: y, x2, y2: y },
    { x1: x2, y1: y, x2, y2 },
    { x1: x2, y1: y2, x2: x, y2 },
    { x1: x, y1: y2, x2: x, y2: y },
  ].map(lineToDxf).join("");
}

function circleToDxf(shape) {
  return `0
CIRCLE
8
0
10
${shape.cx}
20
${SVG_H - shape.cy}
30
0
40
${shape.r}
`;
}

function polylineToDxf(shape) {
  let out = `0
LWPOLYLINE
8
0
90
${shape.points.length}
70
0
`;
  shape.points.forEach((p) => {
    out += `10
${p.x}
20
${SVG_H - p.y}
`;
  });
  return out;
}

function textToDxf(shape) {
  return `0
TEXT
8
0
10
${shape.x}
20
${SVG_H - shape.y}
30
0
40
${shape.fontSize}
1
${shape.text.replaceAll("
", " ")}
`;
}

export function shapesToDxf(shapes) {
  const entities = shapes.map((shape) => {
    if (shape.type === "line") return lineToDxf(shape);
    if (shape.type === "rect") return rectToDxf(shape);
    if (shape.type === "circle") return circleToDxf(shape);
    if (shape.type === "polyline") return polylineToDxf(shape);
    if (shape.type === "text") return textToDxf(shape);
    return "";
  }).join("");
  return `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
${entities}0
ENDSEC
0
EOF`;
}

export function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ================================
// FILE: src/cad/context/CadContext.jsx
// ================================
import { createContext, useContext } from "react";

export const CadContext = createContext(null);

export function useCad() {
  const ctx = useContext(CadContext);
  if (!ctx) throw new Error("useCad musí být použit uvnitř CadProvider");
  return ctx;
}

// ================================
// FILE: src/cad/state/useCadState.js
// ================================
import { useMemo, useRef, useState } from "react";
import { BASE_GRID_MM } from "../constants";
import { distance } from "../utils/geometry";

export function useCadState() {
  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const historyRef = useRef([]);
  const futureRef = useRef([]);

  const [tool, setTool] = useState("select");
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [polylineDraft, setPolylineDraft] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [stroke, setStroke] = useState("#111827");
  const [fill, setFill] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(24);
  const [units, setUnits] = useState("mm");
  const [gridMm, setGridMm] = useState(BASE_GRID_MM);
  const [status, setStatus] = useState("Připraveno.");
  const [interaction, setInteraction] = useState(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [commandValue, setCommandValue] = useState("");

  const selectedShape = useMemo(() => shapes.find((s) => s.id === selectedId) || null, [shapes, selectedId]);

  const liveMetric = useMemo(() => {
    if (draft?.type === "line") return { kind: "length", valueMm: distance(draft.x1, draft.y1, draft.x2, draft.y2) };
    if (draft?.type === "circle") return { kind: "radius", valueMm: draft.r, diameterMm: draft.r * 2 };
    return null;
  }, [draft]);

  return {
    svgRef, fileInputRef, historyRef, futureRef,
    tool, setTool,
    shapes, setShapes,
    selectedId, setSelectedId,
    selectedShape,
    draft, setDraft,
    polylineDraft, setPolylineDraft,
    snapToGrid, setSnapToGrid,
    showGrid, setShowGrid,
    stroke, setStroke,
    fill, setFill,
    strokeWidth, setStrokeWidth,
    fontSize, setFontSize,
    units, setUnits,
    gridMm, setGridMm,
    status, setStatus,
    interaction, setInteraction,
    pointer, setPointer,
    commandValue, setCommandValue,
    liveMetric,
  };
}

// ================================
// FILE: src/cad/actions/historyActions.js
// ================================
export function createHistoryActions(state) {
  const { historyRef, futureRef, shapes, setShapes, setSelectedId, setInteraction, setStatus } = state;

  function pushHistory(prevShapes) {
    historyRef.current.push(JSON.stringify(prevShapes));
    futureRef.current = [];
  }

  function undo() {
    if (!historyRef.current.length) return;
    futureRef.current.push(JSON.stringify(shapes));
    setShapes(JSON.parse(historyRef.current.pop()));
    setSelectedId(null);
    setInteraction(null);
    setStatus("Vráceno zpět.");
  }

  function redo() {
    if (!futureRef.current.length) return;
    historyRef.current.push(JSON.stringify(shapes));
    setShapes(JSON.parse(futureRef.current.pop()));
    setSelectedId(null);
    setInteraction(null);
    setStatus("Vráceno vpřed.");
  }

  return { pushHistory, undo, redo };
}

// ================================
// FILE: src/cad/actions/shapeActions.js
// ================================
import { updateShapeById } from "../utils/shapeMutations";

export function createShapeActions(state, historyActions) {
  const { shapes, setShapes, selectedId, setSelectedId, setDraft, setPolylineDraft, setInteraction, setStatus } = state;
  const { pushHistory } = historyActions;

  function commitShapes(nextShapes, prevShapes = shapes, newStatus = "Upraveno.") {
    pushHistory(prevShapes);
    setShapes(nextShapes);
    setStatus(newStatus);
  }

  function clearAll() {
    commitShapes([], shapes, "Plátno vyčištěno.");
    setSelectedId(null);
    setDraft(null);
    setPolylineDraft(null);
    setInteraction(null);
  }

  function removeSelected() {
    if (!selectedId) return;
    commitShapes(shapes.filter((s) => s.id !== selectedId), shapes, "Objekt smazán.");
    setSelectedId(null);
  }

  function applySelectedChange(updater, newStatus = "Objekt upraven.") {
    if (!selectedId) return;
    commitShapes(updateShapeById(shapes, selectedId, updater), shapes, newStatus);
  }

  return { commitShapes, clearAll, removeSelected, applySelectedChange };
}

// ================================
// FILE: src/cad/actions/drawingActions.js
// ================================
import { distance, uid } from "../utils/geometry";

export function createDrawingActions(state, shapeActions) {
  const { tool, stroke, strokeWidth, fill, fontSize, shapes, draft, setDraft, polylineDraft, setPolylineDraft, setStatus } = state;
  const { commitShapes } = shapeActions;

  function beginShape(point) {
    if (tool === "line") setDraft({ type: "line", x1: point.x, y1: point.y, x2: point.x, y2: point.y, id: uid(), stroke, strokeWidth, fill: "none" });
    if (tool === "rect") setDraft({ type: "rect", x1: point.x, y1: point.y, x2: point.x, y2: point.y, id: uid(), stroke, strokeWidth, fill: fill === "transparent" ? "none" : fill });
    if (tool === "circle") setDraft({ type: "circle", cx: point.x, cy: point.y, r: 0, id: uid(), stroke, strokeWidth, fill: fill === "transparent" ? "none" : fill });
  }

  function updateDraft(point) {
    if (!draft) return;
    if (draft.type === "line") setDraft({ ...draft, x2: point.x, y2: point.y });
    if (draft.type === "rect") setDraft({ ...draft, x2: point.x, y2: point.y });
    if (draft.type === "circle") setDraft({ ...draft, r: distance(draft.cx, draft.cy, point.x, point.y) });
  }

  function commitDraft() {
    if (!draft) return;
    commitShapes([...shapes, draft], shapes, "Prvek přidán.");
    setDraft(null);
  }

  function addText(point) {
    const text = window.prompt("Zadej text:", "Text");
    if (!text) return;
    const shape = { id: uid(), type: "text", x: point.x, y: point.y, text, stroke, fill: "none", fontSize, strokeWidth: 1 };
    commitShapes([...shapes, shape], shapes, "Text přidán.");
  }

  function handlePolylineClick(point) {
    if (!polylineDraft) {
      setPolylineDraft({ id: uid(), type: "polyline", points: [point], stroke, strokeWidth, fill: "none" });
      setStatus("Polyline zahájena. Klikáním přidávej body, dvojklikem ukonči.");
      return;
    }
    setPolylineDraft({ ...polylineDraft, points: [...polylineDraft.points, point] });
  }

  function finishPolyline() {
    if (tool === "polyline" && polylineDraft && polylineDraft.points.length >= 2) {
      commitShapes([...shapes, polylineDraft], shapes, "Polyline dokončena.");
      setPolylineDraft(null);
    }
  }

  return { beginShape, updateDraft, commitDraft, addText, handlePolylineClick, finishPolyline };
}

// ================================
// FILE: src/cad/actions/selectionActions.js
// ================================
import { cloneShapes, getLineHandle, getPolylineHandle, hitTest } from "../utils/geometry";

export function createSelectionActions(state) {
  const { selectedShape, shapes, setSelectedId, setInteraction, setStatus } = state;

  function tryStartHandleEdit(point) {
    if (selectedShape?.type === "line") {
      const handle = getLineHandle(selectedShape, point.x, point.y);
      if (handle) {
        setInteraction({ kind: "line-handle", handle, shapeId: selectedShape.id, startShapes: cloneShapes(shapes) });
        setStatus("Upravuješ koncový bod linky.");
        return true;
      }
    }

    if (selectedShape?.type === "polyline") {
      const handleIndex = getPolylineHandle(selectedShape, point.x, point.y);
      if (handleIndex !== null) {
        setInteraction({ kind: "polyline-handle", pointIndex: handleIndex, shapeId: selectedShape.id, startShapes: cloneShapes(shapes) });
        setStatus("Upravuješ bod polyline.");
        return true;
      }
    }

    return false;
  }

  function selectAtPoint(point) {
    const hit = [...shapes].reverse().find((s) => hitTest(s, point.x, point.y));
    setSelectedId(hit?.id || null);
    if (hit) {
      setInteraction({ kind: "move", point, shapeId: hit.id, startShapes: cloneShapes(shapes) });
      setStatus(`Vybrán objekt: ${hit.type}`);
      return true;
    }
    setStatus("Nic nevybráno.");
    return false;
  }

  return { tryStartHandleEdit, selectAtPoint };
}

// ================================
// FILE: src/cad/actions/exportActions.js
// ================================
import { jsPDF } from "jspdf";
import { SVG_H, SVG_W } from "../constants";
import { downloadBlob, shapesToDxf, shapesToSvg } from "../utils/exporters";

export function createExportActions(state, shapeActions) {
  const { shapes, gridMm, setGridMm, setSelectedId } = state;
  const { commitShapes } = shapeActions;

  function exportSvg() {
    downloadBlob("drawing.svg", shapesToSvg(shapes, { showGrid: false, gridMm }), "image/svg+xml;charset=utf-8");
  }

  function exportJson() {
    downloadBlob("drawing.json", JSON.stringify({ width: SVG_W, height: SVG_H, units: "mm", gridMm, shapes }, null, 2), "application/json;charset=utf-8");
  }

  function exportDxf() {
    downloadBlob("drawing.dxf", shapesToDxf(shapes), "application/dxf;charset=utf-8");
  }

  function exportPng() {
    const svgString = shapesToSvg(shapes, { showGrid: false, gridMm });
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SVG_W;
      canvas.height = SVG_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, SVG_W, SVG_H);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "drawing.png";
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function exportPdf() {
    const svgString = shapesToSvg(shapes, { showGrid: false, gridMm });
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SVG_W;
      canvas.height = SVG_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, SVG_W, SVG_H);
      ctx.drawImage(img, 0, 0);
      const data = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [SVG_W * 0.75, SVG_H * 0.75] });
      pdf.addImage(data, "PNG", 0, 0, SVG_W * 0.75, SVG_H * 0.75);
      pdf.save("drawing.pdf");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function importJson(evt) {
    const file = evt.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    commitShapes(parsed.shapes || [], shapes, "Projekt načten z JSON.");
    if (parsed.gridMm) setGridMm(parsed.gridMm);
    setSelectedId(null);
    evt.target.value = "";
  }

  return { exportSvg, exportJson, exportDxf, exportPng, exportPdf, importJson };
}

// ================================
// FILE: src/cad/actions/inputActions.js
// ================================
import { displayToMm } from "../utils/units";

export function createInputActions(state, shapeActions) {
  const { draft, shapes, units, commandValue, setCommandValue, setDraft, setStatus } = state;
  const { commitShapes } = shapeActions;

  function applyCommandValue() {
    const mm = displayToMm(commandValue, units);
    if (!Number.isFinite(mm) || mm <= 0) return;

    if (draft?.type === "line") {
      const nextDraft = { ...draft, x2: draft.x1 + mm, y2: draft.y1 };
      commitShapes([...shapes, nextDraft], shapes, "Linka přidána přesnou délkou.");
      setDraft(null);
      setCommandValue("");
      return;
    }

    if (draft?.type === "circle") {
      const nextDraft = { ...draft, r: mm };
      commitShapes([...shapes, nextDraft], shapes, "Kružnice přidána přesným poloměrem.");
      setDraft(null);
      setCommandValue("");
      return;
    }

    setStatus("Pole délky/poloměru funguje při rozkreslené lince nebo kružnici.");
  }

  return { applyCommandValue };
}

// ================================
// FILE: src/cad/handlers/pointerHandlers.js
// ================================
import { SVG_H, SVG_W } from "../constants";
import { moveShape, updateShapeById } from "../utils/shapeMutations";
import { snap } from "../utils/units";

export function createPointerHandlers(state, historyActions, drawingActions, selectionActions) {
  const {
    svgRef, snapToGrid, gridMm, tool, shapes, draft, setShapes, interaction, setInteraction, setPointer, setStatus,
  } = state;
  const { pushHistory } = historyActions;
  const { beginShape, updateDraft, commitDraft, addText, handlePolylineClick, finishPolyline } = drawingActions;
  const { tryStartHandleEdit, selectAtPoint } = selectionActions;

  function getPoint(evt) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((evt.clientX - rect.left) / rect.width) * SVG_W;
    const y = ((evt.clientY - rect.top) / rect.height) * SVG_H;
    return { x: snap(x, snapToGrid, gridMm), y: snap(y, snapToGrid, gridMm) };
  }

  function handlePointerDown(evt) {
    const point = getPoint(evt);
    setPointer(point);

    if (tool === "select") {
      if (tryStartHandleEdit(point)) return;
      selectAtPoint(point);
      return;
    }

    if (tool === "pan") {
      setStatus("Posun plátna zatím není implementovaný.");
      return;
    }

    if (tool === "text") {
      addText(point);
      return;
    }

    if (tool === "polyline") {
      handlePolylineClick(point);
      return;
    }

    beginShape(point);
  }

  function handlePointerMove(evt) {
    const point = getPoint(evt);
    setPointer(point);

    if (draft) {
      updateDraft(point);
      return;
    }

    if (!interaction) return;

    if (interaction.kind === "move") {
      const dx = point.x - interaction.point.x;
      const dy = point.y - interaction.point.y;
      setShapes(updateShapeById(interaction.startShapes, interaction.shapeId, (shape) => moveShape(shape, dx, dy)));
      return;
    }

    if (interaction.kind === "line-handle") {
      setShapes(updateShapeById(shapes, interaction.shapeId, (shape) => {
        if (interaction.handle === "start") {
          shape.x1 = point.x;
          shape.y1 = point.y;
        } else {
          shape.x2 = point.x;
          shape.y2 = point.y;
        }
        return shape;
      }));
      return;
    }

    if (interaction.kind === "polyline-handle") {
      setShapes(updateShapeById(shapes, interaction.shapeId, (shape) => {
        shape.points[interaction.pointIndex] = { x: point.x, y: point.y };
        return shape;
      }));
    }
  }

  function handlePointerUp() {
    if (draft) {
      commitDraft();
      return;
    }

    if (interaction) {
      if (JSON.stringify(interaction.startShapes) !== JSON.stringify(shapes)) {
        pushHistory(interaction.startShapes);
      }
      setInteraction(null);
    }
  }

  function handleDoubleClick() {
    finishPolyline();
  }

  return { handlePointerDown, handlePointerMove, handlePointerUp, handleDoubleClick };
}

// ================================
// FILE: src/cad/context/CadProvider.jsx
// ================================
import React from "react";
import { CadContext } from "./CadContext";
import { useCadState } from "../state/useCadState";
import { createHistoryActions } from "../actions/historyActions";
import { createShapeActions } from "../actions/shapeActions";
import { createDrawingActions } from "../actions/drawingActions";
import { createSelectionActions } from "../actions/selectionActions";
import { createExportActions } from "../actions/exportActions";
import { createInputActions } from "../actions/inputActions";
import { createPointerHandlers } from "../handlers/pointerHandlers";

export function CadProvider({ children }) {
  const state = useCadState();
  const historyActions = createHistoryActions(state);
  const shapeActions = createShapeActions(state, historyActions);
  const drawingActions = createDrawingActions(state, shapeActions);
  const selectionActions = createSelectionActions(state);
  const exportActions = createExportActions(state, shapeActions);
  const inputActions = createInputActions(state, shapeActions);
  const pointerHandlers = createPointerHandlers(state, historyActions, drawingActions, selectionActions);

  const value = {
    ...state,
    ...historyActions,
    ...shapeActions,
    ...drawingActions,
    ...selectionActions,
    ...exportActions,
    ...inputActions,
    ...pointerHandlers,
  };

  return <CadContext.Provider value={value}>{children}</CadContext.Provider>;
}

// ================================
// FILE: src/cad/components/Sidebar.jsx
// ================================
import React from "react";
import { Circle, Download, FileImage, FileJson, FileType, Minus, MousePointer2, Move, PenTool, Redo2, Square, Trash2, Type, Undo2 } from "lucide-react";
import { TOOLBAR, styles } from "../constants";
import { useCad } from "../context/CadContext";

const toolIcons = {
  select: MousePointer2,
  line: Minus,
  rect: Square,
  circle: Circle,
  polyline: PenTool,
  text: Type,
  pan: Move,
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
  const { tool, setTool, undo, redo, removeSelected, exportSvg, exportPng, exportPdf, exportDxf, exportJson } = useCad();

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
            style={{ ...styles.railButton, ...(active ? { background: "#2563eb", color: "#ffffff", border: "1px solid #2563eb" } : {}) }}
          >
            <Icon size={18} />
          </button>
        );
      })}

      <div style={{ width: "36px", height: "1px", background: "#e2e8f0", margin: "8px 0" }} />

      {actions.map(({ key, label, icon: Icon }) => (
        <button key={key} title={label} onClick={() => runAction(key)} style={styles.railButton}>
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
}

// ================================
// FILE: src/cad/components/DrawingSvg.jsx
// ================================
import React from "react";
import { HANDLE_R, SVG_H, SVG_W } from "../constants";
import { useCad } from "../context/CadContext";
import { normalizeRect } from "../utils/geometry";

function renderShape(shape, isSelected = false) {
  const extra = isSelected ? { stroke: "#2563eb", strokeWidth: (shape.strokeWidth || 2) + 1 } : {};

  if (shape.type === "line") return <line key={shape.id} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={extra.stroke || shape.stroke} strokeWidth={extra.strokeWidth || shape.strokeWidth} />;
  if (shape.type === "rect") {
    const { x, y, w, h } = normalizeRect(shape);
    return <rect key={shape.id} x={x} y={y} width={w} height={h} stroke={extra.stroke || shape.stroke} strokeWidth={extra.strokeWidth || shape.strokeWidth} fill={shape.fill || "none"} />;
  }
  if (shape.type === "circle") return <circle key={shape.id} cx={shape.cx} cy={shape.cy} r={shape.r} stroke={extra.stroke || shape.stroke} strokeWidth={extra.strokeWidth || shape.strokeWidth} fill={shape.fill || "none"} />;
  if (shape.type === "text") return <text key={shape.id} x={shape.x} y={shape.y} fontSize={shape.fontSize} fill={extra.stroke || shape.stroke} fontFamily="Arial, Helvetica, sans-serif">{shape.text}</text>;
  if (shape.type === "polyline") return <polyline key={shape.id} points={shape.points.map((p) => `${p.x},${p.y}`).join(" ")} stroke={extra.stroke || shape.stroke} strokeWidth={extra.strokeWidth || shape.strokeWidth} fill="none" />;
  return null;
}

export default function DrawingSvg() {
  const { shapes, selectedId, draft, polylineDraft, selectedShape, tool, showGrid, gridMm } = useCad();

  function renderHandles() {
    if (!selectedShape || tool !== "select") return null;
    if (selectedShape.type === "line") {
      return (
        <>
          <circle cx={selectedShape.x1} cy={selectedShape.y1} r={HANDLE_R} fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
          <circle cx={selectedShape.x2} cy={selectedShape.y2} r={HANDLE_R} fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
        </>
      );
    }
    if (selectedShape.type === "polyline") {
      return selectedShape.points.map((p, index) => <circle key={`h-${index}`} cx={p.x} cy={p.y} r={HANDLE_R} fill="#ffffff" stroke="#2563eb" strokeWidth="2" />);
    }
    return null;
  }

  return (
    <>
      <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#ffffff" />
      {showGrid && Array.from({ length: Math.floor(SVG_W / gridMm) + 1 }).map((_, i) => <line key={`vx-${i}`} x1={i * gridMm} y1="0" x2={i * gridMm} y2={SVG_H} stroke="#f1f5f9" strokeWidth="1" />)}
      {showGrid && Array.from({ length: Math.floor(SVG_H / gridMm) + 1 }).map((_, i) => <line key={`hy-${i}`} x1="0" y1={i * gridMm} x2={SVG_W} y2={i * gridMm} stroke="#f1f5f9" strokeWidth="1" />)}
      {shapes.map((shape) => renderShape(shape, shape.id === selectedId))}
      {draft && renderShape(draft, false)}
      {polylineDraft && renderShape(polylineDraft, false)}
      {renderHandles()}
    </>
  );
}

// ================================
// FILE: src/cad/components/CanvasView.jsx
// ================================
import React from "react";
import { Grid3X3 } from "lucide-react";
import { styles, SVG_H, SVG_W } from "../constants";
import { useCad } from "../context/CadContext";
import DrawingSvg from "./DrawingSvg";

export default function CanvasView() {
  const { svgRef, handlePointerDown, handlePointerMove, handlePointerUp, handleDoubleClick } = useCad();

  return (
    <div style={styles.canvasArea}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.title}>Výkres</h2>
          <div style={styles.toolbarMeta}><Grid3X3 size={16} /><span>{SVG_W} × {SVG_H} mm</span></div>
        </div>
        <div style={styles.canvasWrap}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ width: "100%", height: "100%", display: "block", touchAction: "none", userSelect: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onDoubleClick={handleDoubleClick}
          >
            <DrawingSvg />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ================================
// FILE: src/cad/components/StatusBar.jsx
// ================================
import React from "react";
import { styles } from "../constants";
import { useCad } from "../context/CadContext";
import { mmToDisplay } from "../utils/units";

export default function StatusBar() {
  const { status, tool, units, pointer, liveMetric, commandValue, setCommandValue, applyCommandValue } = useCad();

  const metricText = (() => {
    if (!liveMetric) return "";
    if (liveMetric.kind === "length") return `Délka: ${mmToDisplay(liveMetric.valueMm, units)} ${units}`;
    if (liveMetric.kind === "radius") return `Poloměr: ${mmToDisplay(liveMetric.valueMm, units)} ${units} | Průměr: ${mmToDisplay(liveMetric.diameterMm, units)} ${units}`;
    return "";
  })();

  const placeholder = liveMetric?.kind === "radius" ? `Poloměr (${units})` : `Délka (${units})`;

  return (
    <div style={styles.statusBar}>
      <div style={styles.statusInfo}>
        <span><strong>Stav:</strong> {status}</span>
        <span><strong>Nástroj:</strong> {tool}</span>
        <span><strong>Souřadnice:</strong> X {mmToDisplay(pointer.x, units)} / Y {mmToDisplay(pointer.y, units)} {units}</span>
        {metricText ? <span><strong>{metricText}</strong></span> : null}
      </div>
      <div style={styles.statusCommand}>
        <input
          type="number"
          step="0.001"
          value={commandValue}
          onChange={(e) => setCommandValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyCommandValue();
          }}
          placeholder={placeholder}
          style={{ ...styles.input, width: 180 }}
        />
        <button onClick={applyCommandValue} style={styles.primaryButton}>Použít</button>
      </div>
    </div>
  );
}
