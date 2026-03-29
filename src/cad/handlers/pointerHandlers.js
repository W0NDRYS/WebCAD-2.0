import { SVG_H, SVG_W } from "../constants";
import { moveShape, updateShapeById } from "../utils/shapeMutations";
import { snap } from "../utils/units";

let dragRafId = null;
let pendingPoint = null;

export function createPointerHandlers(
  state,
  historyActions,
  drawingActions,
  selectionActions
) {
  const {
    svgRef,
    snapToGrid,
    gridMm,
    tool,
    shapes,
    draft,
    setShapes,
    interaction,
    setInteraction,
    setPointer,
    setStatus,
  } = state;

  const { pushHistory } = historyActions;
  const {
    beginShape,
    updateDraft,
    commitDraft,
    addText,
    handlePolylineClick,
    finishPolyline,
  } = drawingActions;
  const { tryStartHandleEdit, selectAtPoint } = selectionActions;

  function getPoint(evt) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };

    const x = (evt.clientX - ctm.e) / ctm.a;
    const y = (evt.clientY - ctm.f) / ctm.d;

    return {
      x: snap(Math.max(0, Math.min(SVG_W, x)), snapToGrid, gridMm),
      y: snap(Math.max(0, Math.min(SVG_H, y)), snapToGrid, gridMm),
    };
  }

  function cancelScheduledFrame() {
    if (dragRafId) {
      cancelAnimationFrame(dragRafId);
      dragRafId = null;
    }
    pendingPoint = null;
  }

  function flushInteractionFrame() {
    dragRafId = null;

    if (!interaction || !pendingPoint) return;

    const point = pendingPoint;

    if (interaction.kind === "move") {
      const dx = point.x - interaction.point.x;
      const dy = point.y - interaction.point.y;

      setShapes(
        updateShapeById(interaction.startShapes, interaction.shapeId, (shape) =>
          moveShape(shape, dx, dy)
        )
      );
      return;
    }

    if (interaction.kind === "line-handle") {
      setShapes(
        updateShapeById(shapes, interaction.shapeId, (shape) => {
          if (interaction.handle === "start") {
            shape.x1 = point.x;
            shape.y1 = point.y;
          } else {
            shape.x2 = point.x;
            shape.y2 = point.y;
          }
          return shape;
        })
      );
      return;
    }

    if (interaction.kind === "polyline-handle") {
      setShapes(
        updateShapeById(shapes, interaction.shapeId, (shape) => {
          shape.points[interaction.pointIndex] = {
            x: point.x,
            y: point.y,
          };
          return shape;
        })
      );
    }
  }

  function scheduleInteractionFrame(point) {
    pendingPoint = point;

    if (dragRafId) return;
    dragRafId = requestAnimationFrame(flushInteractionFrame);
  }

  function handlePointerDown(evt) {
    const point = getPoint(evt);
    setPointer(point);

    if (tool === "select") {
      if (tryStartHandleEdit(point)) return;
      selectAtPoint(point);
      return;
    }

    if (tool === "pan") {
      setStatus("Posun plátna zatím není implementovaný.");
      return;
    }

    if (tool === "text") {
      addText(point);
      return;
    }

    if (tool === "polyline") {
      handlePolylineClick(point);
      return;
    }

    beginShape(point);
  }

  function handlePointerMove(evt) {
    const point = getPoint(evt);
    setPointer(point);

    if (draft) {
      updateDraft(point);
      return;
    }

    if (!interaction) return;

    scheduleInteractionFrame(point);
  }

  function handlePointerUp() {
    cancelScheduledFrame();

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

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
  };
}