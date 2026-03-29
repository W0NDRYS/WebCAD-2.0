import { applyConstraintsToShapes } from "../utils/constraints";
import { updateShapeById } from "../utils/shapeMutations";

export function createShapeActions(state, historyActions) {
  const {
    shapes,
    setShapes,
    selectedId,
    selectedIds,
    setSelectedId,
    setSelectedIds,
    setDraft,
    setPolylineDraft,
    setInteraction,
    setStatus,
  } = state;

  const { pushHistory } = historyActions;

  function commitShapes(nextShapes, prevShapes = shapes, newStatus = "Upraveno.") {
    const resolvedShapes = applyConstraintsToShapes(nextShapes);
    pushHistory(prevShapes);
    setShapes(resolvedShapes);
    setStatus(newStatus);
  }

  function clearAll() {
    commitShapes([], shapes, "Plátno vyčištěno.");
    setSelectedId(null);
    setSelectedIds([]);
    setDraft(null);
    setPolylineDraft(null);
    setInteraction(null);
  }

  function removeSelected() {
    const activeIds =
      selectedIds && selectedIds.length
        ? selectedIds
        : selectedId
        ? [selectedId]
        : [];

    if (!activeIds.length) return;

    const idSet = new Set(activeIds);
    commitShapes(
      shapes.filter((s) => !idSet.has(s.id)),
      shapes,
      activeIds.length > 1
        ? `Smazáno objektů: ${activeIds.length}`
        : "Objekt smazán."
    );

    setSelectedId(null);
    setSelectedIds([]);
  }

  function applySelectedChange(updater, newStatus = "Objekt upraven.") {
    if (!selectedId) return;
    commitShapes(updateShapeById(shapes, selectedId, updater), shapes, newStatus);
  }

  return {
    commitShapes,
    clearAll,
    removeSelected,
    applySelectedChange,
  };
}