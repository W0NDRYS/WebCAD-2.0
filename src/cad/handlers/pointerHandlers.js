import { SVG_H, SVG_W } from "../constants";
import {
  boundsIntersect,
  getShapeBounds,
  isBoundsInside,
  normalizeSelectionBox,
} from "../utils/geometry";
import { moveShape, updateShapeById } from "../utils/shapeMutations";
import { snap } from "../utils/units";

export function createPointerHandlers(
  state,
  historyActions,
  drawingActions,
  selectionActions,
  focusCommandInput
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
    setSelectedId,
    setSelectedIds,
    setSelectionBox,
    selectionBox,
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

  function handlePointerDown(evt) {
    const point = getPoint(evt);
    setPointer(point);

    if (tool === "select") {
      if (interaction?.kind === "move-preview") {
        if (
          JSON.stringify(interaction.startShapes) !== JSON.stringify(shapes)
        ) {
          pushHistory(interaction.startShapes);
        }
        setInteraction(null);
        setStatus("Přesun objektu potvrzen.");
        return;
      }

      if (tryStartHandleEdit(point)) return;

      const selected = selectAtPoint(point);

      if (selected) {
        const hit = [...shapes].reverse().find((s) => {
          const b = getShapeBounds(s);
          return (
            point.x >= b.x1 &&
            point.x <= b.x2 &&
            point.y >= b.y1 &&
            point.y <= b.y2
          );
        });

        if (hit) {
          setSelectedId(hit.id);
          setSelectedIds([hit.id]);
          setInteraction({
            kind: "move-preview",
            point,
            shapeId: hit.id,
            startShapes: JSON.parse(JSON.stringify(shapes)),
          });
          setStatus("Přesun zahájen. Druhým klikem potvrď novou pozici.");
          return;
        }
      }

      setSelectedId(null);
      setSelectedIds([]);
      setSelectionBox({
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
      });
      setInteraction({
        kind: "selection-box",
        startPoint: point,
      });
      setStatus("Táhni výběr.");
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

    if (tool === "line" || tool === "rect" || tool === "circle") {
      if (!draft) {
        beginShape(point);
        focusCommandInput?.();
      } else {
        updateDraft(point);
        commitDraft();
      }
      return;
    }
  }

  function handlePointerMove(evt) {
    const point = getPoint(evt);
    setPointer(point);

    if (draft) {
      updateDraft(point);
      return;
    }

    if (!interaction) return;

    if (interaction.kind === "selection-box") {
      setSelectionBox({
        x1: interaction.startPoint.x,
        y1: interaction.startPoint.y,
        x2: point.x,
        y2: point.y,
      });
      return;
    }

    if (interaction.kind === "move-preview") {
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

  function handlePointerUp() {
    if (interaction?.kind === "selection-box" && selectionBox) {
      const box = normalizeSelectionBox(selectionBox);

      const hits = shapes
        .filter((shape) => {
          const bounds = getShapeBounds(shape);

          if (box.leftToRight) {
            return isBoundsInside(bounds, box);
          }

          return boundsIntersect(bounds, box);
        })
        .map((shape) => shape.id);

      setSelectedIds(hits);
      setSelectedId(hits.length === 1 ? hits[0] : null);
      setSelectionBox(null);
      setInteraction(null);

      if (hits.length) {
        setStatus(`Vybráno objektů: ${hits.length}`);
      } else {
        setStatus("Žádný objekt nevybrán.");
      }
      return;
    }

    if (interaction?.kind === "move-preview") {
      return;
    }

    if (interaction?.kind === "move") {
      if (JSON.stringify(interaction.startShapes) !== JSON.stringify(shapes)) {
        pushHistory(interaction.startShapes);
      }
      setInteraction(null);
      return;
    }

    if (
      interaction?.kind === "line-handle" ||
      interaction?.kind === "polyline-handle"
    ) {
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
