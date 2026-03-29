import React from "react";
import { HANDLE_R, SVG_H, SVG_W } from "../constants";
import { useCad } from "../context/CadContext";
import { normalizeRect, normalizeSelectionBox } from "../utils/geometry";

function renderShape(shape, isSelected = false) {
  const extra = isSelected
    ? { stroke: "#2563eb", strokeWidth: (shape.strokeWidth || 2) + 1 }
    : {};

  if (shape.type === "line") {
    return (
      <line
        key={shape.id}
        x1={shape.x1}
        y1={shape.y1}
        x2={shape.x2}
        y2={shape.y2}
        stroke={extra.stroke || shape.stroke}
        strokeWidth={extra.strokeWidth || shape.strokeWidth}
      />
    );
  }

  if (shape.type === "rect") {
    const { x, y, w, h } = normalizeRect(shape);
    return (
      <rect
        key={shape.id}
        x={x}
        y={y}
        width={w}
        height={h}
        stroke={extra.stroke || shape.stroke}
        strokeWidth={extra.strokeWidth || shape.strokeWidth}
        fill={shape.fill || "none"}
      />
    );
  }

  if (shape.type === "circle") {
    return (
      <circle
        key={shape.id}
        cx={shape.cx}
        cy={shape.cy}
        r={shape.r}
        stroke={extra.stroke || shape.stroke}
        strokeWidth={extra.strokeWidth || shape.strokeWidth}
        fill={shape.fill || "none"}
      />
    );
  }

  if (shape.type === "text") {
    return (
      <text
        key={shape.id}
        x={shape.x}
        y={shape.y}
        fontSize={shape.fontSize}
        fill={extra.stroke || shape.stroke}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        {shape.text}
      </text>
    );
  }

  if (shape.type === "polyline") {
    return (
      <polyline
        key={shape.id}
        points={shape.points.map((p) => `${p.x},${p.y}`).join(" ")}
        stroke={extra.stroke || shape.stroke}
        strokeWidth={extra.strokeWidth || shape.strokeWidth}
        fill="none"
      />
    );
  }

  return null;
}

export default function DrawingSvg() {
  const {
    shapes,
    selectedId,
    selectedIds,
    draft,
    polylineDraft,
    selectedShape,
    tool,
    showGrid,
    gridMm,
    selectionBox,
  } = useCad();

  function renderHandles() {
    if (!selectedShape || tool !== "select") return null;

    if (selectedShape.type === "line") {
      return (
        <>
          <circle
            cx={selectedShape.x1}
            cy={selectedShape.y1}
            r={HANDLE_R}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth="2"
          />
          <circle
            cx={selectedShape.x2}
            cy={selectedShape.y2}
            r={HANDLE_R}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth="2"
          />
        </>
      );
    }

    if (selectedShape.type === "polyline") {
      return selectedShape.points.map((p, index) => (
        <circle
          key={`h-${index}`}
          cx={p.x}
          cy={p.y}
          r={HANDLE_R}
          fill="#ffffff"
          stroke="#2563eb"
          strokeWidth="2"
        />
      ));
    }

    return null;
  }

  function renderSelectionBox() {
    if (!selectionBox) return null;

    const box = normalizeSelectionBox(selectionBox);
    const leftToRight = box.leftToRight;

    return (
      <rect
        x={box.x1}
        y={box.y1}
        width={box.w}
        height={box.h}
        fill={leftToRight ? "rgba(37,99,235,0.08)" : "rgba(22,163,74,0.08)"}
        stroke={leftToRight ? "#2563eb" : "#16a34a"}
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
    );
  }

  return (
    <>
      <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#ffffff" />

      {showGrid &&
        Array.from({ length: Math.floor(SVG_W / gridMm) + 1 }).map((_, i) => (
          <line
            key={`vx-${i}`}
            x1={i * gridMm}
            y1="0"
            x2={i * gridMm}
            y2={SVG_H}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}

      {showGrid &&
        Array.from({ length: Math.floor(SVG_H / gridMm) + 1 }).map((_, i) => (
          <line
            key={`hy-${i}`}
            x1="0"
            y1={i * gridMm}
            x2={SVG_W}
            y2={i * gridMm}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}

      {shapes.map((shape) =>
        renderShape(
          shape,
          shape.id === selectedId || selectedIds.includes(shape.id)
        )
      )}

      {draft && renderShape(draft, false)}
      {polylineDraft && renderShape(polylineDraft, false)}
      {renderSelectionBox()}
      {renderHandles()}
    </>
  );
}
