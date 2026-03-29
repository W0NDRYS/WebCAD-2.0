import { cloneShapes, getLineHandle, getPolylineHandle, hitTest } from "../utils/geometry";

export function createSelectionActions(state) {
  const { selectedShape, shapes, setSelectedId, setInteraction, setStatus } = state;

  function tryStartHandleEdit(point) {
    if (selectedShape?.type === "line") {
      const handle = getLineHandle(selectedShape, point.x, point.y);
      if (handle) {
        setInteraction({ kind: "line-handle", handle, shapeId: selectedShape.id, startShapes: cloneShapes(shapes) });
        setStatus("Upravuješ koncový bod linky.");
        return true;
      }
    }

    if (selectedShape?.type === "polyline") {
      const handleIndex = getPolylineHandle(selectedShape, point.x, point.y);
      if (handleIndex !== null) {
        setInteraction({ kind: "polyline-handle", pointIndex: handleIndex, shapeId: selectedShape.id, startShapes: cloneShapes(shapes) });
        setStatus("Upravuješ bod polyline.");
        return true;
      }
    }

    return false;
  }

  function selectAtPoint(point) {
    const hit = [...shapes].reverse().find((s) => hitTest(s, point.x, point.y));
    setSelectedId(hit?.id || null);
    if (hit) {
      setInteraction({ kind: "move", point, shapeId: hit.id, startShapes: cloneShapes(shapes) });
      setStatus(`Vybrán objekt: ${hit.type}`);
      return true;
    }
    setStatus("Nic nevybráno.");
    return false;
  }

  return { tryStartHandleEdit, selectAtPoint };
}
