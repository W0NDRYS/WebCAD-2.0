import React from "react";
import { SVG_H, SVG_W } from "../constants";
import { useCad } from "../context/CadContext";
import {
  getNearbySnapPoints,
  getSnapLabel,
  normalizeRect,
  normalizeSelectionBox,
} from "../utils/geometry";

function shapeVectorProps(opacity = 1, dashed = false) {
  return {
    opacity,
    vectorEffect: "non-scaling-stroke",
    ...(dashed ? { strokeDasharray: "8 6" } : {}),
  };
}

function renderShape(shape, isSelected = false, opacity = 1, dashed = false) {
  const extra = isSelected
    ? { stroke: "#2563eb", strokeWidth: (shape.strokeWidth || 2) + 1 }
    : {};

  const commonProps = shapeVectorProps(opacity, dashed);

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
    renderViewport,
  } = useCad();

  const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
  const nearbySnapPoints = getNearbySnapPoints(shapes, pointer, {
    maxDistance: 18,
  });

  // konstantní vizuální velikosti v "world" jednotkách podle aktuálního render viewportu
  const worldPerScreenPx = renderViewport.width / 1200;
  const handleRadius = 8 * worldPerScreenPx;
  const smallPointRadius = 3.5 * worldPerScreenPx;
  const midPointRadius = 4.5 * worldPerScreenPx;
  const snapOuterRadius = 10 * worldPerScreenPx;
  const moveStartRadius = 6 * worldPerScreenPx;
  const moveCurrentRadius = 5 * worldPerScreenPx;
  const tooltipOffset = 12 * worldPerScreenPx;
  const tooltipHeight = 20 * worldPerScreenPx;
  const tooltipTextSize = 12 * worldPerScreenPx;
  const tooltipPadding = 8 * worldPerScreenPx;

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
          r={handleRadius}
          fill="#ffffff"
          stroke="#2563eb"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      );
      circles.push(
        <circle
          key={`${line.id}-end`}
          cx={line.x2}
          cy={line.y2}
          r={handleRadius}
          fill="#ffffff"
          stroke="#2563eb"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
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
            r={handleRadius}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
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
        vectorEffect="non-scaling-stroke"
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
          r={moveStartRadius}
          fill="#ffffff"
          stroke="#ef4444"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        <line
          x1={interaction.point.x}
          y1={interaction.point.y}
          x2={pointer.x}
          y2={pointer.y}
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="6 4"
          vectorEffect="non-scaling-stroke"
        />

        <circle
          cx={pointer.x}
          cy={pointer.y}
          r={moveCurrentRadius}
          fill="#ef4444"
          vectorEffect="non-scaling-stroke"
        />
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
        r={p.role === "midpoint" ? midPointRadius : smallPointRadius}
        fill="#ffffff"
        stroke="#94a3b8"
        strokeWidth="1.5"
        opacity={0.9}
        vectorEffect="non-scaling-stroke"
      />
    ));
  }

  function renderSnapTarget() {
    if (!snapTarget) return null;

    const label = getSnapLabel(snapTarget.role);
    const tooltipWidth = Math.max(
      56 * worldPerScreenPx,
      label.length * 7 * worldPerScreenPx
    );

    return (
      <>
        <circle
          cx={snapTarget.x}
          cy={snapTarget.y}
          r={snapOuterRadius}
          fill="rgba(34,197,94,0.15)"
          stroke="#22c55e"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={snapTarget.x}
          cy={snapTarget.y}
          r={snapTarget.role === "midpoint" ? midPointRadius : smallPointRadius}
          fill="#22c55e"
          vectorEffect="non-scaling-stroke"
        />

        <g transform={`translate(${snapTarget.x + tooltipOffset}, ${snapTarget.y - tooltipOffset})`}>
          <rect
            x="0"
            y={-tooltipHeight * 0.6}
            width={tooltipWidth}
            height={tooltipHeight}
            rx={6 * worldPerScreenPx}
            fill="rgba(15,23,42,0.9)"
          />
          <text
            x={tooltipPadding}
            y={tooltipTextSize * 0.2}
            fontSize={tooltipTextSize}
            fill="#ffffff"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            {label}
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
            vectorEffect="non-scaling-stroke"
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
            vectorEffect="non-scaling-stroke"
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