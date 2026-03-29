import { displayToMm } from "../utils/units";

export function createInputActions(state, shapeActions) {
  const {
    draft,
    shapes,
    units,
    commandValue,
    setCommandValue,
    setDraft,
    setStatus,
    pointer,
  } = state;

  const { commitShapes } = shapeActions;

  function applyCommandValue() {
    const mm = displayToMm(commandValue, units);
    if (!Number.isFinite(mm) || mm <= 0) return;

    if (draft?.type === "line") {
      const dx = pointer.x - draft.x1;
      const dy = pointer.y - draft.y1;
      const len = Math.sqrt(dx * dx + dy * dy);

      const ux = len > 0 ? dx / len : 1;
      const uy = len > 0 ? dy / len : 0;

      const nextDraft = {
        ...draft,
        x2: draft.x1 + ux * mm,
        y2: draft.y1 + uy * mm,
      };

      commitShapes([...shapes, nextDraft], shapes, "Linka přidána přesnou délkou.");
      setDraft(null);
      setCommandValue("");
      return;
    }

    if (draft?.type === "circle") {
      const nextDraft = {
        ...draft,
        r: mm,
      };

      commitShapes([...shapes, nextDraft], shapes, "Kružnice přidána přesným poloměrem.");
      setDraft(null);
      setCommandValue("");
      return;
    }

    if (draft?.type === "rect") {
      const dx = pointer.x - draft.x1;
      const dy = pointer.y - draft.y1;

      const nextDraft = {
        ...draft,
        x2: draft.x1 + (dx >= 0 ? mm : -mm),
        y2: draft.y1 + (dy >= 0 ? mm : -mm),
      };

      commitShapes([...shapes, nextDraft], shapes, "Obdélník přidán přesnou hodnotou.");
      setDraft(null);
      setCommandValue("");
      return;
    }

    setStatus("Nejprve založ první bod kresleného objektu.");
  }

  return { applyCommandValue };
}
