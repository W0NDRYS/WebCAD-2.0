import { SVG_H, SVG_W } from "../constants";
import {
  boundsIntersect,
  findNearestSnapPoint,
  findSharedNode,
  getShapeBounds,
  isBoundsInside,
  normalizeSelectionBox,
} from "../utils/geometry";
import { moveShapesByIds, updateShapeById } from "../utils/shapeMutations";
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
    selectedIds,
    setShapes,
    interaction,
    setInteraction,
    setPointer,
    setStatus,
    setSelectedId,
    setSelectedIds,
    setSelectionBox,
    selectionBox,
    setSnapTarget,
    setDraft,
    setPolylineDraft,
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

  function getSnappedPoint(rawPoint) {
    const snapPoint = findNearestSnapPoint(shapes, rawPoint, {
      excludeShapeId:
        interaction?.kind === "line-handle" || interaction?.kind === "polyline-handle"
          ? interaction.shapeId
          : null,
      maxDistance: 16,
    });

    if (snapPoint) {
      setSnapTarget(snapPoint);
      return { x: snapPoint.x, y: snapPoint.y };
    }

    setSnapTarget(null);
    return rawPoint;
  }

  function confirmCurrentInteraction() {
    if (!interaction) return false;

    if (interaction.kind === "move-preview-group") {
      if (JSON.stringify(interaction.startShapes) !== JSON.stringify(shapes)) {
        pushHistory(interaction.startShapes);
      }
      setInteraction(null);
      setStatus("Přesun potvrzen.");
      return true;
    }

    if (
      interaction.kind === "line-handle" ||
      interaction.kind === "polyline-handle" ||
      interaction.kind === "shared-node"
    ) {
      if (JSON.stringify(interaction.startShapes) !== JSON.stringify(shapes)) {
        pushHistory(interaction.startShapes);
      }
      setInteraction(null);
      setSnapTarget(null);
      setStatus("Bod potvrzen.");
      return true;
    }

    return false;
  }

  function cancelCurrentInteraction() {
    if (draft) {
      setDraft(null);
      setSnapTarget(null);
      setStatus("Kreslení zrušeno.");
      return true;
    }

    if (state.polylineDraft) {
      setPolylineDraft(null);
      setSnapTarget(null);
      setStatus("Polyline zrušena.");
      return true;
    }

    if (interaction?.startShapes) {
      setShapes(interaction.startShapes);
      setInteraction(null);
      setSnapTarget(null);
      setSelectionBox(null);
      setStatus("Manipulace zrušena.");
      return true;
    }

    if (interaction?.kind === "selection-box") {
      setInteraction(null);
      setSelectionBox(null);
      setSnapTarget(null);
      setStatus("Výběr zrušen.");
      return true;
    }

    return false;
  }

  function handlePointerDown(evt) {
    const rawPoint = getPoint(evt);
    const point = draft ? getSnappedPoint(rawPoint) : rawPoint;
    setPointer(point);

    if (tool === "select") {
      if (confirmCurrentInteraction()) return;

      const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
      const sharedNode = findSharedNode(selectedShapes, rawPoint, 12);

      if (sharedNode) {
        setInteraction({
          kind: "shared-node",
          point: { x: sharedNode.x, y: sharedNode.y },
          members: sharedNode.members,
          startShapes: JSON.parse(JSON.stringify(shapes)),
        });
        setSnapTarget(sharedNode);
        setStatus("Společný bod vybrán. Pohni myší a klikem potvrď.");
        return;
      }

      if (tryStartHandleEdit(rawPoint)) return;

      const hit = selectAtPoint(rawPoint);
      if (hit) return;

      setSelectedId(null);
      setSelectedIds([]);
      setSelectionBox({
        x1: rawPoint.x,
        y1: rawPoint.y,
        x2: rawPoint.x,
        y2: rawPoint.y,
      });
      setInteraction({
        kind: "selection-box",
        startPoint: rawPoint,
      });
      setStatus("Táhni výběr.");
      return;
    }

    if (tool === "pan") {
      if (confirmCurrentInteraction()) return;

      if (selectedIds?.length > 0) {
        setInteraction({
          kind: "move-preview-group",
          point: rawPoint,
          shapeIds: [...selectedIds],
          startShapes: JSON.parse(JSON.stringify(shapes)),
        });
        setStatus("Přesun zahájen. Pohni myší a klikem nebo Enter potvrď.");
        focusCommandInput?.();
        return;
      }

      setStatus("Nejprve vyber jeden nebo více objektů.");
      return;
    }

    if (tool === "text") {
      addText(point);
      return;
    }

    if (tool === "polyline") {
      handlePolylineClick(getSnappedPoint(rawPoint));
      return;
    }

    if (tool === "line" || tool === "rect" || tool === "circle") {
      if (!draft) {
        beginShape(getSnappedPoint(rawPoint));
        focusCommandInput?.();
      } else {
        updateDraft(getSnappedPoint(rawPoint));
        commitDraft();
      }
      return;
    }
  }

  function handlePointerMove(evt) {
    const rawPoint = getPoint(evt);
    setPointer(rawPoint);

    if (draft) {
      const point = getSnappedPoint(rawPoint);
      setPointer(point);
      updateDraft(point);
      return;
    }

    if (!interaction) {
      const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
      const sharedNode = findSharedNode(selectedShapes, rawPoint, 12);

      if (sharedNode) {
        setSnapTarget(sharedNode);
      } else {
        const hoverSnap = findNearestSnapPoint(shapes, rawPoint, {
          maxDistance: 14,
        });
        setSnapTarget(hoverSnap || null);
      }
      return;
    }

    if (interaction.kind === "selection-box") {
      setSelectionBox({
        x1: interaction.startPoint.x,
        y1: interaction.startPoint.y,
        x2: rawPoint.x,
        y2: rawPoint.y,
      });
      return;
    }

    if (interaction.kind === "move-preview-group") {
      const dx = rawPoint.x - interaction.point.x;
      const dy = rawPoint.y - interaction.point.y;

      setShapes(
        moveShapesByIds(interaction.startShapes, interaction.shapeIds, dx, dy)
      );
      return;
    }

    const point = getSnappedPoint(rawPoint);
    setPointer(point);

    if (interaction.kind === "shared-node") {
      setShapes(
        interaction.startShapes.map((shape) => {
          const members = interaction.members.filter((m) => m.shapeId === shape.id);
          if (!members.length) return shape;

          const next = JSON.parse(JSON.stringify(shape));

          for (const member of members) {
            if (shape.type === "line") {
              if (member.ref === "start") {
                next.x1 = point.x;
                next.y1 = point.y;
              }
              if (member.ref === "end") {
                next.x2 = point.x;
                next.y2 = point.y;
              }
            }

            if (shape.type === "polyline") {
              next.points[member.ref] = { x: point.x, y: point.y };
            }
          }

          return next;
        })
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

    if (interaction?.kind === "move-preview-group") return;
    if (interaction?.kind === "line-handle") return;
    if (interaction?.kind === "polyline-handle") return;
    if (interaction?.kind === "shared-node") return;

    setSnapTarget(null);
  }

  function handleDoubleClick() {
    finishPolyline();
  }

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
    confirmCurrentInteraction,
    cancelCurrentInteraction,
  };
}