import { distance, uid } from "../utils/geometry";

export function createDrawingActions(state, shapeActions) {
  const {
    tool,
    stroke,
    strokeWidth,
    fill,
    fontSize,
    shapes,
    draft,
    setDraft,
    polylineDraft,
    setPolylineDraft,
    setStatus,
  } = state;

  const { commitShapes } = shapeActions;

  function beginShape(point, startAttachment = null) {
    if (tool === "line") {
      setDraft({
        type: "line",
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
        id: uid(),
        stroke,
        strokeWidth,
        fill: "none",
        constraints: startAttachment ? { start: startAttachment } : {},
      });
      setStatus("Zvolen první bod linky. Druhým klikem potvrď konec.");
    }

    if (tool === "rect") {
      setDraft({
        type: "rect",
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
        id: uid(),
        stroke,
        strokeWidth,
        fill: fill === "transparent" ? "none" : fill,
      });
      setStatus("Zvolen první roh obdélníku. Druhým klikem potvrď.");
    }

    if (tool === "circle") {
      setDraft({
        type: "circle",
        cx: point.x,
        cy: point.y,
        r: 0,
        id: uid(),
        stroke,
        strokeWidth,
        fill: fill === "transparent" ? "none" : fill,
      });
      setStatus("Zvolen střed kružnice. Druhým klikem potvrď poloměr.");
    }
  }

  function updateDraft(point, endAttachment = null) {
    if (!draft) return;

    if (draft.type === "line") {
      setDraft({
        ...draft,
        x2: point.x,
        y2: point.y,
        constraints: {
          ...(draft.constraints || {}),
          ...(endAttachment ? { end: endAttachment } : {}),
        },
      });
    }

    if (draft.type === "rect") {
      setDraft({ ...draft, x2: point.x, y2: point.y });
    }

    if (draft.type === "circle") {
      setDraft({
        ...draft,
        r: distance(draft.cx, draft.cy, point.x, point.y),
      });
    }
  }

  function commitDraft() {
    if (!draft) return;

    if (draft.type === "line") {
      if (draft.x1 === draft.x2 && draft.y1 === draft.y2) return;
    }

    if (draft.type === "rect") {
      if (draft.x1 === draft.x2 && draft.y1 === draft.y2) return;
    }

    if (draft.type === "circle") {
      if (!draft.r || draft.r <= 0) return;
    }

    commitShapes([...shapes, draft], shapes, "Prvek přidán.");
    setDraft(null);
  }

  function addText(point) {
    const text = window.prompt("Zadej text:", "Text");
    if (!text) return;

    const shape = {
      id: uid(),
      type: "text",
      x: point.x,
      y: point.y,
      text,
      stroke,
      fill: "none",
      fontSize,
      strokeWidth: 1,
    };

    commitShapes([...shapes, shape], shapes, "Text přidán.");
  }

  function handlePolylineClick(point) {
    if (!polylineDraft) {
      setPolylineDraft({
        id: uid(),
        type: "polyline",
        points: [point],
        stroke,
        strokeWidth,
        fill: "none",
      });
      setStatus("Polyline zahájena. Dalšími kliky přidávej body, dvojklik ukončí.");
      return;
    }

    setPolylineDraft({
      ...polylineDraft,
      points: [...polylineDraft.points, point],
    });
  }

  function finishPolyline() {
    if (tool === "polyline" && polylineDraft && polylineDraft.points.length >= 2) {
      commitShapes([...shapes, polylineDraft], shapes, "Polyline dokončena.");
      setPolylineDraft(null);
    }
  }

  return {
    beginShape,
    updateDraft,
    commitDraft,
    addText,
    handlePolylineClick,
    finishPolyline,
  };
}