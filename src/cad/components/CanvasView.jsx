import React, { useRef } from "react";
import { Grid3X3 } from "lucide-react";
import { styles, SVG_H, SVG_W } from "../constants";
import { useCad } from "../context/CadContext";
import DrawingSvg from "./DrawingSvg";

const MIN_VIEW_W = 40;
const MAX_VIEW_W = SVG_W * 20;
const ZOOM_STEP = 0.12;

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

  const isMiddlePanningRef = useRef(false);
  const middlePanStartRef = useRef(null);
  const rafRef = useRef(null);

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

  function getSvgElement() {
    return svgRef.current;
  }

  function svgPointFromClient(clientX, clientY) {
    const svg = getSvgElement();
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };

    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    return {
      x: viewport.x + relX * viewport.width,
      y: viewport.y + relY * viewport.height,
    };
  }

  function queueViewportUpdate(updater) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      setViewport((prev) => clampViewport(updater(prev)));
    });
  }

  function onWheel(e) {
    e.preventDefault();

    const mouse = svgPointFromClient(e.clientX, e.clientY);
    const direction = e.deltaY > 0 ? 1 : -1;
    const zoomFactor = Math.exp(direction * ZOOM_STEP);

    queueViewportUpdate((prev) => {
      const nextWidth = prev.width * zoomFactor;
      const nextHeight = prev.height * zoomFactor;

      const relX = (mouse.x - prev.x) / prev.width;
      const relY = (mouse.y - prev.y) / prev.height;

      return {
        x: mouse.x - relX * nextWidth,
        y: mouse.y - relY * nextHeight,
        width: nextWidth,
        height: nextHeight,
      };
    });
  }

  function onMouseDown(e) {
    if (e.button === 1) {
      e.preventDefault();

      const svg = getSvgElement();
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      isMiddlePanningRef.current = true;
      middlePanStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        viewportX: viewport.x,
        viewportY: viewport.y,
        worldPerPixelX: viewport.width / rect.width,
        worldPerPixelY: viewport.height / rect.height,
      };
      return;
    }

    handlePointerDown(e);
  }

  function onMouseMove(e) {
    if (isMiddlePanningRef.current && middlePanStartRef.current) {
      e.preventDefault();

      const start = middlePanStartRef.current;
      const dxPx = e.clientX - start.clientX;
      const dyPx = e.clientY - start.clientY;

      queueViewportUpdate((prev) => ({
        ...prev,
        x: start.viewportX - dxPx * start.worldPerPixelX,
        y: start.viewportY - dyPx * start.worldPerPixelY,
      }));
      return;
    }

    handlePointerMove(e);
  }

  function stopMiddlePan() {
    isMiddlePanningRef.current = false;
    middlePanStartRef.current = null;
  }

  function onMouseUp(e) {
    if (e.button === 1 && isMiddlePanningRef.current) {
      e.preventDefault();
      stopMiddlePan();
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
          style={{
            ...styles.canvasWrap,
            cursor: isMiddlePanningRef.current ? "grabbing" : "default",
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
              stopMiddlePan();
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