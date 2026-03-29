import React, { useRef, useState } from "react";
import { Grid3X3 } from "lucide-react";
import { styles, SVG_H, SVG_W } from "../constants";
import { useCad } from "../context/CadContext";
import DrawingSvg from "./DrawingSvg";

const MIN_VIEW_W = 120;
const MAX_VIEW_W = SVG_W * 20;

export default function CanvasView() {
  const {
    svgRef,
    viewport,
    setViewport,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
  } = useCad();

  const wrapRef = useRef(null);
  const [isPanningView, setIsPanningView] = useState(false);
  const [panStart, setPanStart] = useState(null);

  function clampViewport(next) {
    const width = Math.max(MIN_VIEW_W, Math.min(MAX_VIEW_W, next.width));
    const height = (width * SVG_H) / SVG_W;

    return {
      x: next.x,
      y: next.y,
      width,
      height,
    };
  }

  function svgPointFromClient(clientX, clientY) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };

    return {
      x: (clientX - ctm.e) / ctm.a,
      y: (clientY - ctm.f) / ctm.d,
    };
  }

  function onWheel(e) {
    e.preventDefault();

    const mouse = svgPointFromClient(e.clientX, e.clientY);
    const factor = e.deltaY > 0 ? 1.1 : 0.9;

    setViewport((prev) => {
      const nextWidth = prev.width * factor;
      const nextHeight = prev.height * factor;

      const relX = (mouse.x - prev.x) / prev.width;
      const relY = (mouse.y - prev.y) / prev.height;

      const next = {
        x: mouse.x - relX * nextWidth,
        y: mouse.y - relY * nextHeight,
        width: nextWidth,
        height: nextHeight,
      };

      return clampViewport(next);
    });
  }

  function onMouseDown(e) {
    if (e.button === 1) {
      e.preventDefault();
      const start = svgPointFromClient(e.clientX, e.clientY);
      setIsPanningView(true);
      setPanStart({
        clientX: e.clientX,
        clientY: e.clientY,
        viewX: viewport.x,
        viewY: viewport.y,
        anchorX: start.x,
        anchorY: start.y,
      });
      return;
    }

    handlePointerDown(e);
  }

  function onMouseMove(e) {
    if (isPanningView && panStart) {
      e.preventDefault();

      const current = svgPointFromClient(e.clientX, e.clientY);
      const dx = current.x - panStart.anchorX;
      const dy = current.y - panStart.anchorY;

      setViewport((prev) => ({
        ...prev,
        x: panStart.viewX - dx,
        y: panStart.viewY - dy,
      }));
      return;
    }

    handlePointerMove(e);
  }

  function stopViewPan() {
    setIsPanningView(false);
    setPanStart(null);
  }

  function onMouseUp(e) {
    if (e.button === 1 && isPanningView) {
      e.preventDefault();
      stopViewPan();
      return;
    }

    handlePointerUp(e);
  }

  function fitToScreen() {
    setViewport({
      x: 0,
      y: 0,
      width: SVG_W,
      height: SVG_H,
    });
  }

  return (
    <div style={styles.canvasArea}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.title}>Výkres</h2>
          <div style={{ ...styles.toolbarMeta, gap: 12 }}>
            <div style={styles.toolbarMeta}>
              <Grid3X3 size={16} />
              <span>
                {Math.round(viewport.width)} × {Math.round(viewport.height)} view
              </span>
            </div>

            <button
              onClick={fitToScreen}
              style={{
                minHeight: 30,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#fff",
                cursor: "pointer",
                padding: "0 10px",
              }}
              title="Přizpůsobit na obrazovku"
            >
              Fit
            </button>
          </div>
        </div>

        <div
          ref={wrapRef}
          style={{
            ...styles.canvasWrap,
            cursor: isPanningView ? "grabbing" : "default",
          }}
          onWheel={onWheel}
        >
          <svg
            ref={svgRef}
            viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              touchAction: "none",
              userSelect: "none",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={() => {
              stopViewPan();
              handlePointerUp();
            }}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => e.preventDefault()}
          >
            <DrawingSvg />
          </svg>
        </div>
      </div>
    </div>
  );
}