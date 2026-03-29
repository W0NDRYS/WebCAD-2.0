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

  if (shape.type === "line") {
    return `<line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" ${common} />`;
  }

  if (shape.type === "rect") {
    const { x, y, w, h } = normalizeRect(shape);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${common} />`;
  }

  if (shape.type === "circle") {
    return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" ${common} />`;
  }

  if (shape.type === "text") {
    return `<text x="${shape.x}" y="${shape.y}" font-size="${shape.fontSize}" fill="${shape.stroke}" font-family="Arial, Helvetica, sans-serif">${escapeXml(shape.text)}</text>`;
  }

  if (shape.type === "polyline") {
    const points = shape.points.map((p) => `${p.x},${p.y}`).join(" ");
    return `<polyline points="${points}" ${common} fill="none" />`;
  }

  return "";
}

export function shapesToSvg(shapes, options = {}) {
  const { showGrid = true, background = "#ffffff", gridMm = 10 } = options;
  const gridLines = [];

  if (showGrid) {
    for (let x = 0; x <= SVG_W; x += gridMm) {
      gridLines.push(
        `<line x1="${x}" y1="0" x2="${x}" y2="${SVG_H}" stroke="#f1f5f9" stroke-width="1" />`
      );
    }

    for (let y = 0; y <= SVG_H; y += gridMm) {
      gridLines.push(
        `<line x1="0" y1="${y}" x2="${SVG_W}" y2="${y}" stroke="#f1f5f9" stroke-width="1" />`
      );
    }
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
  ]
    .map(lineToDxf)
    .join("");
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
${shape.text.replaceAll("\n", " ")}
`;
}

export function shapesToDxf(shapes) {
  const entities = shapes
    .map((shape) => {
      if (shape.type === "line") return lineToDxf(shape);
      if (shape.type === "rect") return rectToDxf(shape);
      if (shape.type === "circle") return circleToDxf(shape);
      if (shape.type === "polyline") return polylineToDxf(shape);
      if (shape.type === "text") return textToDxf(shape);
      return "";
    })
    .join("");

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
