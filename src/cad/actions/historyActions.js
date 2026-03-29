export function createHistoryActions(state) {
  const { historyRef, futureRef, shapes, setShapes, setSelectedId, setInteraction, setStatus } = state;

  function pushHistory(prevShapes) {
    historyRef.current.push(JSON.stringify(prevShapes));
    futureRef.current = [];
  }

  function undo() {
    if (!historyRef.current.length) return;
    futureRef.current.push(JSON.stringify(shapes));
    setShapes(JSON.parse(historyRef.current.pop()));
    setSelectedId(null);
    setInteraction(null);
    setStatus("Vráceno zpět.");
  }

  function redo() {
    if (!futureRef.current.length) return;
    historyRef.current.push(JSON.stringify(shapes));
    setShapes(JSON.parse(futureRef.current.pop()));
    setSelectedId(null);
    setInteraction(null);
    setStatus("Vráceno vpřed.");
  }

  return { pushHistory, undo, redo };
}
