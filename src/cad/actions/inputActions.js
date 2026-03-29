import { displayToMm } from "../utils/units";

export function createInputActions(state, shapeActions) {
  const { draft, shapes, units, commandValue, setCommandValue, setDraft, setStatus } = state;
  const { commitShapes } = shapeActions;

  function applyCommandValue() {
    const mm = displayToMm(commandValue, units);
    if (!Number.isFinite(mm) || mm <= 0) return;

    if (draft?.type === "line") {
      const nextDraft = { ...draft, x2: draft.x1 + mm, y2: draft.y1 };
      commitShapes([...shapes, nextDraft], shapes, "Linka přidána přesnou délkou.");
      setDraft(null);
      setCommandValue("");
      return;
    }

    if (draft?.type === "circle") {
      const nextDraft = { ...draft, r: mm };
      commitShapes([...shapes, nextDraft], shapes, "Kružnice přidána přesným poloměrem.");
      setDraft(null);
      setCommandValue("");
      return;
    }

    setStatus("Pole délky/poloměru funguje při rozkreslené lince nebo kružnici.");
  }

  return { applyCommandValue };
}
