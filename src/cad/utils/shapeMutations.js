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
