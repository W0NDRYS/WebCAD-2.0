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

export function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function pointsEqual(a, b, tolerance = 0.001) {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

export function normalizeRect(shape) {
  return {
    x: Math.min(shape.x1, shape.x2),
    y: Math.min(shape.y1, shape.y2),
    w: Math.abs(shape.x2 - shape.x1),
    h: Math.abs(shape.y2 - shape.y1),
  };
}

export function normalizeSelectionBox(box) {
  const x1 = Math.min(box.x1, box.x2);
  const y1 = Math.min(box.y1, box.y2);
  const x2 = Math.max(box.x1, box.x2);
  const y2 = Math.max(box.y1, box.y2);

  return {
    x1,
    y1,
    x2,
    y2,
    w: x2 - x1,
    h: y2 - y1,
    leftToRight: box.x2 >= box.x1,
  };
}

export function getShapeBounds(shape) {
  if (shape.type === "line") {
    return {
      x1: Math.min(shape.x1, shape.x2),
      y1: Math.min(shape.y1, shape.y2),
      x2: Math.max(shape.x1, shape.x2),
      y2: Math.max(shape.y1, shape.y2),
    };
  }

  if (shape.type === "rect") {
    const r = normalizeRect(shape);
    return {
      x1: r.x,
      y1: r.y,
      x2: r.x + r.w,
      y2: r.y + r.h,
    };
  }

  if (shape.type === "circle") {
    return {
      x1: shape.cx - shape.r,
      y1: shape.cy - shape.r,
      x2: shape.cx + shape.r,
      y2: shape.cy + shape.r,
    };
  }

  if (shape.type === "text") {
    return {
      x1: shape.x,
      y1: shape.y - shape.fontSize,
      x2: shape.x + shape.text.length * shape.fontSize * 0.65,
      y2: shape.y,
    };
  }

  if (shape.type === "polyline") {
    const xs = shape.points.map((p) => p.x);
    const ys = shape.points.map((p) => p.y);
    return {
      x1: Math.min(...xs),
      y1: Math.min(...ys),
      x2: Math.max(...xs),
      y2: Math.max(...ys),
    };
  }

  return { x1: 0, y1: 0, x2: 0, y2: 0 };
}

export function isBoundsInside(inner, outer) {
  return (
    inner.x1 >= outer.x1 &&
    inner.y1 >= outer.y1 &&
    inner.x2 <= outer.x2 &&
    inner.y2 <= outer.y2
  );
}

export function boundsIntersect(a, b) {
  return !(
    a.x2 < b.x1 ||
    a.x1 > b.x2 ||
    a.y2 < b.y1 ||
    a.y1 > b.y2
  );
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
  const idx = shape.points.findIndex(
    (p) => distance(p.x, p.y, x, y) <= HANDLE_R + 4
  );
  return idx >= 0 ? idx : null;
}

function pointInRect(point, rect) {
  return (
    point.x >= rect.x1 &&
    point.x <= rect.x2 &&
    point.y >= rect.y1 &&
    point.y <= rect.y2
  );
}

function orientation(a, b, c) {
  const value =
    (b.y - a.y) * (c.x - b.x) -
    (b.x - a.x) * (c.y - b.y);

  if (Math.abs(value) < 1e-9) return 0;
  return value > 0 ? 1 : 2;
}

function onSegment(a, b, c) {
  return (
    b.x <= Math.max(a.x, c.x) + 1e-9 &&
    b.x >= Math.min(a.x, c.x) - 1e-9 &&
    b.y <= Math.max(a.y, c.y) + 1e-9 &&
    b.y >= Math.min(a.y, c.y) - 1e-9
  );
}

function segmentsIntersect(p1, q1, p2, q2) {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
}

function rectEdges(rect) {
  const tl = { x: rect.x1, y: rect.y1 };
  const tr = { x: rect.x2, y: rect.y1 };
  const br = { x: rect.x2, y: rect.y2 };
  const bl = { x: rect.x1, y: rect.y2 };

  return [
    [tl, tr],
    [tr, br],
    [br, bl],
    [bl, tl],
  ];
}

function segmentIntersectsRect(a, b, rect) {
  if (pointInRect(a, rect) || pointInRect(b, rect)) return true;
  return rectEdges(rect).some(([r1, r2]) => segmentsIntersect(a, b, r1, r2));
}

function segmentInsideRect(a, b, rect) {
  return pointInRect(a, rect) && pointInRect(b, rect);
}

export function isShapeInSelection(shape, rect, leftToRight) {
  if (shape.type === "line") {
    const a = { x: shape.x1, y: shape.y1 };
    const b = { x: shape.x2, y: shape.y2 };
    return leftToRight
      ? segmentInsideRect(a, b, rect)
      : segmentIntersectsRect(a, b, rect);
  }

  if (shape.type === "polyline") {
    if (!shape.points?.length) return false;

    if (leftToRight) {
      return shape.points.every((p) => pointInRect(p, rect));
    }

    for (let i = 1; i < shape.points.length; i += 1) {
      const a = shape.points[i - 1];
      const b = shape.points[i];
      if (segmentIntersectsRect(a, b, rect)) return true;
    }

    return shape.points.some((p) => pointInRect(p, rect));
  }

  const bounds = getShapeBounds(shape);
  return leftToRight
    ? isBoundsInside(bounds, rect)
    : boundsIntersect(bounds, rect);
}

export function getShapeSnapPoints(shape) {
  if (shape.type === "line") {
    const start = { x: shape.x1, y: shape.y1 };
    const end = { x: shape.x2, y: shape.y2 };
    const mid = midpoint(start, end);

    return [
      { x: start.x, y: start.y, role: "endpoint", ref: "start" },
      { x: end.x, y: end.y, role: "endpoint", ref: "end" },
      { x: mid.x, y: mid.y, role: "midpoint", ref: "mid" },
    ];
  }

  if (shape.type === "rect") {
    const r = normalizeRect(shape);
    return [
      { x: r.x, y: r.y, role: "corner" },
      { x: r.x + r.w, y: r.y, role: "corner" },
      { x: r.x + r.w, y: r.y + r.h, role: "corner" },
      { x: r.x, y: r.y + r.h, role: "corner" },
    ];
  }

  if (shape.type === "circle") {
    return [
      { x: shape.cx, y: shape.cy, role: "center" },
      { x: shape.cx + shape.r, y: shape.cy, role: "quadrant" },
      { x: shape.cx - shape.r, y: shape.cy, role: "quadrant" },
      { x: shape.cx, y: shape.cy + shape.r, role: "quadrant" },
      { x: shape.cx, y: shape.cy - shape.r, role: "quadrant" },
    ];
  }

  if (shape.type === "polyline") {
    const points = [];

    shape.points.forEach((p, index) => {
      points.push({
        x: p.x,
        y: p.y,
        role: "vertex",
        ref: index,
      });

      if (index > 0) {
        const prev = shape.points[index - 1];
        const mid = midpoint(prev, p);
        points.push({
          x: mid.x,
          y: mid.y,
          role: "midpoint",
          ref: `mid-${index - 1}-${index}`,
        });
      }
    });

    return points;
  }

  if (shape.type === "text") {
    return [{ x: shape.x, y: shape.y, role: "anchor" }];
  }

  return [];
}

export function findNearestSnapPoint(shapes, pointer, options = {}) {
  const {
    excludeShapeId = null,
    maxDistance = 14,
  } = options;

  let best = null;

  for (const shape of shapes) {
    if (shape.id === excludeShapeId) continue;

    const points = getShapeSnapPoints(shape);
    for (const p of points) {
      const d = distance(pointer.x, pointer.y, p.x, p.y);
      if (d <= maxDistance && (!best || d < best.distance)) {
        best = {
          shapeId: shape.id,
          x: p.x,
          y: p.y,
          role: p.role,
          ref: p.ref,
          distance: d,
        };
      }
    }
  }

  return best;
}

export function getNearbySnapPoints(shapes, pointer, options = {}) {
  const {
    excludeShapeId = null,
    maxDistance = 18,
  } = options;

  const points = [];

  for (const shape of shapes) {
    if (shape.id === excludeShapeId) continue;

    for (const p of getShapeSnapPoints(shape)) {
      const d = distance(pointer.x, pointer.y, p.x, p.y);
      if (d <= maxDistance) {
        points.push({
          shapeId: shape.id,
          x: p.x,
          y: p.y,
          role: p.role,
          ref: p.ref,
          distance: d,
        });
      }
    }
  }

  points.sort((a, b) => a.distance - b.distance);
  return points;
}

export function findSharedNode(selectedShapes, pointer, maxDistance = 12) {
  const clusters = [];

  for (const shape of selectedShapes) {
    if (shape.type !== "line" && shape.type !== "polyline") continue;

    const points = getShapeSnapPoints(shape).filter(
      (p) => p.role === "endpoint" || p.role === "vertex"
    );

    for (const pt of points) {
      let cluster = clusters.find((c) =>
        pointsEqual({ x: c.x, y: c.y }, { x: pt.x, y: pt.y })
      );

      if (!cluster) {
        cluster = { x: pt.x, y: pt.y, members: [] };
        clusters.push(cluster);
      }

      cluster.members.push({
        shapeId: shape.id,
        shapeType: shape.type,
        ref: pt.ref,
      });
    }
  }

  const sharedClusters = clusters.filter((c) => c.members.length >= 2);

  let best = null;
  for (const c of sharedClusters) {
    const d = distance(pointer.x, pointer.y, c.x, c.y);
    if (d <= maxDistance && (!best || d < best.distance)) {
      best = {
        ...c,
        role: "shared-node",
        distance: d,
      };
    }
  }

  return best;
}

export function getSnapLabel(role) {
  const map = {
    endpoint: "Endpoint",
    vertex: "Vertex",
    midpoint: "Midpoint",
    center: "Center",
    corner: "Corner",
    quadrant: "Quadrant",
    anchor: "Anchor",
    "shared-node": "Shared node",
  };

  return map[role] || role || "";
}