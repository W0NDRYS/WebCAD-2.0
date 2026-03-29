import React from "react";
import { HANDLE_R, SVG_H, SVG_W } from "../constants";
import { useCad } from "../context/CadContext";
import {
  getNearbySnapPoints,
  getSnapLabel,
  normalizeRect,
  normalizeSelectionBox,
} from "../utils/geometry";

function renderShape(shape, isSelected = false, opacity = 1, dashed = false) {
  const extra = isSelected
    ? { stroke: "#2563eb", strokeWidth: (shape.strokeWidth || 2) + 1 }
    : {};

  const commonProps = {
    opacity,
    ...(dashed ? { strokeDasharray: "8 6" } : {}),
  };

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
        {...commonProps}
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
        {...commonProps}
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
        {...commonProps}
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
        opacity={opacity}
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
        {...commonProps}
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
    interaction,
    pointer,
    snapTarget,
  } = useCad();

  const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
  const nearbySnapPoints = getNearbySnapPoints(shapes, pointer, {
    maxDistance: 18,
  });

  function renderMultiHandles() {
    if (tool !== "select") return null;

    const lineShapes = selectedShapes.filter((s) => s.type === "line");
    const circles = [];

    for (const line of lineShapes) {
      circles.push(
        <circle
          key={`${line.id}-start`}
          cx={line.x1}
          cy={line.y1}
          r={HANDLE_R}
          fill="#ffffff"
          stroke="#2563eb"
          strokeWidth="2"
        />
      );
      circles.push(
        <circle
          key={`${line.id}-end`}
          cx={line.x2}
          cy={line.y2}
          r={HANDLE_R}
          fill="#ffffff"
          stroke="#2563eb"
          strokeWidth="2"
        />
      );
    }

    if (selectedShape?.type === "polyline") {
      selectedShape.points.forEach((p, index) => {
        circles.push(
          <circle
            key={`poly-${index}`}
            cx={p.x}
            cy={p.y}
            r={HANDLE_R}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth="2"
          />
        );
      });
    }

    return circles;
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

  function renderMovePreview() {
    if (interaction?.kind !== "move-preview-group") return null;

    const idSet = new Set(interaction.shapeIds);
    const originalShapes = interaction.startShapes.filter((s) => idSet.has(s.id));

    return (
      <>
        {originalShapes.map((shape) => (
          <React.Fragment key={`ghost-${shape.id}`}>
            {renderShape(shape, false, 0.25, true)}
          </React.Fragment>
        ))}

        <circle
          cx={interaction.point.x}
          cy={interaction.point.y}
          r={6}
          fill="#ffffff"
          stroke="#ef4444"
          strokeWidth="2"
        />

        <line
          x1={interaction.point.x}
          y1={interaction.point.y}
          x2={pointer.x}
          y2={pointer.y}
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="6 4"
        />

        <circle cx={pointer.x} cy={pointer.y} r={5} fill="#ef4444" />
      </>
    );
  }

  function renderNearbySnapPoints() {
    if (!nearbySnapPoints.length) return null;

    return nearbySnapPoints.slice(0, 8).map((p, i) => (
      <circle
        key={`near-snap-${i}-${p.shapeId}-${p.ref ?? "r"}`}
        cx={p.x}
        cy={p.y}
        r={p.role === "midpoint" ? 4 : 3}
        fill="#ffffff"
        stroke="#94a3b8"
        strokeWidth="1.5"
        opacity={0.9}
      />
    ));
  }

  function renderSnapTarget() {
    if (!snapTarget) return null;

    return (
      <>
        <circle
          cx={snapTarget.x}
          cy={snapTarget.y}
          r={10}
          fill="rgba(34,197,94,0.15)"
          stroke="#22c55e"
          strokeWidth="2"
        />
        <circle
          cx={snapTarget.x}
          cy={snapTarget.y}
          r={snapTarget.role === "midpoint" ? 4 : 3}
          fill="#22c55e"
        />

        <g transform={`translate(${snapTarget.x + 12}, ${snapTarget.y - 12})`}>
          <rect
            x="0"
            y="-12"
            width={Math.max(56, getSnapLabel(snapTarget.role).length * 7)}
            height="20"
            rx="6"
            fill="rgba(15,23,42,0.9)"
          />
          <text
            x="8"
            y="2"
            fontSize="12"
            fill="#ffffff"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            {getSnapLabel(snapTarget.role)}
          </text>
        </g>
      </>
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
      {renderMovePreview()}
      {renderNearbySnapPoints()}
      {renderMultiHandles()}
      {renderSnapTarget()}
    </>
  );
}