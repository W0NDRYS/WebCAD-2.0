import { SVG_H, SVG_W } from "../constants";
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
