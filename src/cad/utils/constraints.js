import { getShapeSnapPoints } from "./geometry";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function makeAttachmentFromSnapTarget(snapTarget) {
  if (!snapTarget) return null;
  if (snapTarget.role === "shared-node") return null;

  return {
    hostShapeId: snapTarget.shapeId,
    hostRole: snapTarget.role,
    hostRef: snapTarget.ref ?? null,
  };
}

export function clearAttachment(shape, pointRef) {
  const next = deepClone(shape);

  if (next.type === "line") {
    next.constraints = next.constraints || {};
    if (pointRef === "start") delete next.constraints.start;
    if (pointRef === "end") delete next.constraints.end;
  }

  if (next.type === "polyline") {
    next.constraints = next.constraints || {};
    next.constraints.points = next.constraints.points || {};
    delete next.constraints.points[String(pointRef)];
  }

  return next;
}

export function setAttachment(shape, pointRef, attachment) {
  const next = deepClone(shape);

  if (!attachment) {
    return clearAttachment(next, pointRef);
  }

  if (next.type === "line") {
    next.constraints = next.constraints || {};
    if (pointRef === "start") next.constraints.start = attachment;
    if (pointRef === "end") next.constraints.end = attachment;
  }

  if (next.type === "polyline") {
    next.constraints = next.constraints || {};
    next.constraints.points = next.constraints.points || {};
    next.constraints.points[String(pointRef)] = attachment;
  }

  return next;
}

function resolveAttachment(shapeMap, attachment) {
  if (!attachment) return null;

  const hostShape = shapeMap.get(attachment.hostShapeId);
  if (!hostShape) return null;

  const snapPoints = getShapeSnapPoints(hostShape);
  const match = snapPoints.find(
    (p) =>
      p.role === attachment.hostRole &&
      (p.ref ?? null) === (attachment.hostRef ?? null)
  );

  if (!match) return null;

  return { x: match.x, y: match.y };
}

export function applyConstraintsToShapes(shapes, passes = 3) {
  let nextShapes = deepClone(shapes);

  for (let pass = 0; pass < passes; pass++) {
    const shapeMap = new Map(nextShapes.map((s) => [s.id, s]));

    nextShapes = nextShapes.map((shape) => {
      const next = deepClone(shape);

      if (next.type === "line" && next.constraints) {
        const startPos = resolveAttachment(shapeMap, next.constraints.start);
        const endPos = resolveAttachment(shapeMap, next.constraints.end);

        if (startPos) {
          next.x1 = startPos.x;
          next.y1 = startPos.y;
        }

        if (endPos) {
          next.x2 = endPos.x;
          next.y2 = endPos.y;
        }
      }

      if (next.type === "polyline" && next.constraints?.points) {
        for (const [indexKey, attachment] of Object.entries(next.constraints.points)) {
          const resolved = resolveAttachment(shapeMap, attachment);
          const index = Number(indexKey);

          if (
            resolved &&
            Number.isInteger(index) &&
            next.points &&
            next.points[index]
          ) {
            next.points[index] = {
              x: resolved.x,
              y: resolved.y,
            };
          }
        }
      }

      return next;
    });
  }

  return nextShapes;
}