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
    const d = distance(shape.cx, shape.cy, x, y);
    return Math.abs(d - shape.r) <= tolerance || d < shape.r;
  }

  if (shape.type === "line") {
    const len = distance(shape.x1, shape.y1, shape.x2, shape.y2);
    const d1 = distance(shape.x1, shape.y1, x, y);
    const d2 = distance(shape.x2, shape.y2, x, y);
    return Math.abs(len - (d1 + d2)) < tolerance;
  }

  if (shape.type === "text") {
    return (
      x >= shape.x &&
      x <= shape.x + shape.text.length * shape.fontSize * 0.65 &&
      y <= shape.y &&
      y >= shape.y - shape.fontSize
    );
  }

  if (shape.type === "polyline") {
    return shape.points.some((p, i) => {
      const prev = i > 0 ? shape.points[i - 1] : null;

      if (!prev) {
        return distance(p.x, p.y, x, y) < tolerance;
      }

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
  const idx = shape.points.findIndex(
    (p) => distance(p.x, p.y, x, y) <= HANDLE_R + 4
  );
  return idx >= 0 ? idx : null;
}
