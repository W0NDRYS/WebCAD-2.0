import { useMemo, useRef, useState } from "react";
import { BASE_GRID_MM, SVG_H, SVG_W } from "../constants";
import { distance } from "../utils/geometry";

export function useCadState() {
  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const commandInputRef = useRef(null);
  const historyRef = useRef([]);
  const futureRef = useRef([]);

  const [tool, setTool] = useState("select");
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [draft, setDraft] = useState(null);
  const [polylineDraft, setPolylineDraft] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [stroke, setStroke] = useState("#111827");
  const [fill, setFill] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(24);
  const [units, setUnits] = useState("mm");
  const [gridMm, setGridMm] = useState(BASE_GRID_MM);
  const [status, setStatus] = useState("Připraveno.");
  const [interaction, setInteraction] = useState(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [commandValue, setCommandValue] = useState("");
  const [selectionBox, setSelectionBox] = useState(null);
  const [snapTarget, setSnapTarget] = useState(null);

  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    width: SVG_W,
    height: SVG_H,
  });

  const [renderViewport, setRenderViewport] = useState({
    x: 0,
    y: 0,
    width: SVG_W,
    height: SVG_H,
  });

  const selectedShape = useMemo(
    () => shapes.find((s) => s.id === selectedId) || null,
    [shapes, selectedId]
  );

  const liveMetric = useMemo(() => {
    if (draft?.type === "line") {
      return {
        kind: "length",
        valueMm: distance(draft.x1, draft.y1, draft.x2, draft.y2),
      };
    }

    if (draft?.type === "circle") {
      return {
        kind: "radius",
        valueMm: draft.r,
        diameterMm: draft.r * 2,
      };
    }

    if (draft?.type === "rect") {
      return {
        kind: "rect",
        widthMm: Math.abs(draft.x2 - draft.x1),
        heightMm: Math.abs(draft.y2 - draft.y1),
      };
    }

    return null;
  }, [draft]);

  return {
    svgRef,
    fileInputRef,
    commandInputRef,
    historyRef,
    futureRef,
    tool,
    setTool,
    shapes,
    setShapes,
    selectedId,
    setSelectedId,
    selectedIds,
    setSelectedIds,
    selectedShape,
    draft,
    setDraft,
    polylineDraft,
    setPolylineDraft,
    snapToGrid,
    setSnapToGrid,
    showGrid,
    setShowGrid,
    stroke,
    setStroke,
    fill,
    setFill,
    strokeWidth,
    setStrokeWidth,
    fontSize,
    setFontSize,
    units,
    setUnits,
    gridMm,
    setGridMm,
    status,
    setStatus,
    interaction,
    setInteraction,
    pointer,
    setPointer,
    commandValue,
    setCommandValue,
    liveMetric,
    selectionBox,
    setSelectionBox,
    snapTarget,
    setSnapTarget,
    viewport,
    setViewport,
    renderViewport,
    setRenderViewport,
  };
}