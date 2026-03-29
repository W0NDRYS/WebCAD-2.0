import { SVG_H, SVG_W } from "../constants";
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
