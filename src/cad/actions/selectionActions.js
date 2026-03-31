import {
  cloneShapes,
  getLineHandle,
  getPolylineHandle,
  hitTest,
} from "../utils/geometry";

export function createSelectionActions(state) {
  const {
    selectedShape,
    selectedIds,
    shapes,
    setSelectedId,
    setSelectedIds,
    setInteraction,
    setStatus,
  } = state;

  function tryStartHandleEdit(point) {
    // body upravujeme jen když je vybraný právě jeden objekt
    if (!selectedShape || (selectedIds && selectedIds.length > 1)) {
      return false;
    }

    if (selectedShape.type === "line") {
      const handle = getLineHandle(selectedShape, point.x, point.y);
      if (handle) {
        setInteraction({
          kind: "line-handle",
          handle,
          shapeId: selectedShape.id,
          startShapes: cloneShapes(shapes),
        });
        setStatus("Upravuješ koncový bod linky.");
        return true;
      }
    }

    if (selectedShape.type === "polyline") {
      const handleIndex = getPolylineHandle(selectedShape, point.x, point.y);
      if (handleIndex !== null) {
        setInteraction({
          kind: "polyline-handle",
          pointIndex: handleIndex,
          shapeId: selectedShape.id,
          startShapes: cloneShapes(shapes),
        });
        setStatus("Upravuješ bod polyline.");
        return true;
      }
    }

    return false;
  }

  function selectAtPoint(point) {
    const hit = [...shapes].reverse().find((shape) =>
      hitTest(shape, point.x, point.y)
    );

    setSelectedId(hit?.id || null);
    setSelectedIds(hit ? [hit.id] : []);

    if (hit) {
      setStatus(`Vybrán objekt: ${hit.type}`);
      return hit;
    }

    setStatus("Nic nevybráno.");
    return null;
  }

  return {
    tryStartHandleEdit,
    selectAtPoint,
  };
}