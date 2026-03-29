import { updateShapeById } from "../utils/shapeMutations";

export function createShapeActions(state, historyActions) {
  const { shapes, setShapes, selectedId, setSelectedId, setDraft, setPolylineDraft, setInteraction, setStatus } = state;
  const { pushHistory } = historyActions;

  function commitShapes(nextShapes, prevShapes = shapes, newStatus = "Upraveno.") {
    pushHistory(prevShapes);
    setShapes(nextShapes);
    setStatus(newStatus);
  }

  function clearAll() {
    commitShapes([], shapes, "Plátno vyčištěno.");
    setSelectedId(null);
    setDraft(null);
    setPolylineDraft(null);
    setInteraction(null);
  }

  function removeSelected() {
    if (!selectedId) return;
    commitShapes(shapes.filter((s) => s.id !== selectedId), shapes, "Objekt smazán.");
    setSelectedId(null);
  }

  function applySelectedChange(updater, newStatus = "Objekt upraven.") {
    if (!selectedId) return;
    commitShapes(updateShapeById(shapes, selectedId, updater), shapes, newStatus);
  }

  return { commitShapes, clearAll, removeSelected, applySelectedChange };
}
