import React, { useEffect, useRef } from "react";
import { Grid3X3 } from "lucide-react";
import { styles, SVG_H, SVG_W, TOOLBAR } from "../constants";
import { useCad } from "../context/CadContext";
import DrawingSvg from "./DrawingSvg";

const MIN_VIEW_W = 40;
const MAX_VIEW_W = SVG_W * 20;
const ZOOM_STEP = 0.12;
const VIEW_LERP = 0.22;

export default function CanvasView() {
  const {
    svgRef,
    tool,
    viewport,
    setViewport,
    renderViewport,
    setRenderViewport,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
  } = useCad();

  const isViewPanningRef = useRef(false);
  const panStartRef = useRef(null);

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

  function svgPointFromClient(clientX, clientY, activeViewport = renderViewport) {
    const svg = getSvgElement();
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };

    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    return {
      x: activeViewport.x + relX * activeViewport.width,
      y: activeViewport.y + relY * activeViewport.height,
    };
  }

  useEffect(() => {
    let rafId = 0;

    function animate() {
      setRenderViewport((prev) => {
        const dx = viewport.x - prev.x;
        const dy = viewport.y - prev.y;
        const dw = viewport.width - prev.width;
        const dh = viewport.height - prev.height;

        const closeEnough =
          Math.abs(dx) < 0.01 &&
          Math.abs(dy) < 0.01 &&
          Math.abs(dw) < 0.01 &&
          Math.abs(dh) < 0.01;

        if (closeEnough) {
          return viewport;
        }

        return {
          x: prev.x + dx * VIEW_LERP,
          y: prev.y + dy * VIEW_LERP,
          width: prev.width + dw * VIEW_LERP,
          height: prev.height + dh * VIEW_LERP,
        };
      });

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [viewport, setRenderViewport]);

  function onWheel(e) {
    e.preventDefault();

    const mouse = svgPointFromClient(e.clientX, e.clientY, renderViewport);
    const direction = e.deltaY > 0 ? 1 : -1;
    const zoomFactor = Math.exp(direction * ZOOM_STEP);

    setViewport((prev) => {
      const nextWidth = prev.width * zoomFactor;
      const nextHeight = prev.height * zoomFactor;

      const relX = (mouse.x - prev.x) / prev.width;
      const relY = (mouse.y - prev.y) / prev.height;

      return clampViewport({
        x: mouse.x - relX * nextWidth,
        y: mouse.y - relY * nextHeight,
        width: nextWidth,
        height: nextHeight,
      });
    });
  }

  function startViewPan(e) {
    const svg = getSvgElement();
    if (!svg) return false;

    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;

    isViewPanningRef.current = true;
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      viewportX: viewport.x,
      viewportY: viewport.y,
      worldPerPixelX: viewport.width / rect.width,
      worldPerPixelY: viewport.height / rect.height,
    };
    return true;
  }

  function onMouseDown(e) {
    if (e.button === 1) {
      e.preventDefault();
      startViewPan(e);
      return;
    }

    if (tool === "hand" && e.button === 0) {
      e.preventDefault();
      startViewPan(e);
      return;
    }

    handlePointerDown(e);
  }

  function onMouseMove(e) {
    if (isViewPanningRef.current && panStartRef.current) {
      e.preventDefault();

      const start = panStartRef.current;
      const dxPx = e.clientX - start.clientX;
      const dyPx = e.clientY - start.clientY;

      setViewport((prev) => ({
        ...prev,
        x: start.viewportX - dxPx * start.worldPerPixelX,
        y: start.viewportY - dyPx * start.worldPerPixelY,
      }));
      return;
    }

    handlePointerMove(e);
  }

  function stopViewPan() {
    isViewPanningRef.current = false;
    panStartRef.current = null;
  }

  function onMouseUp(e) {
    if (isViewPanningRef.current) {
      if (e.button === 1 || (tool === "hand" && e.button === 0)) {
        e.preventDefault();
        stopViewPan();
        return;
      }
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

  const toolLabel =
    TOOLBAR.find((item) => item.key === tool)?.label || tool;

  return (
    <div style={styles.canvasArea}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.title}>Výkres</h2>

          <div style={{ ...styles.toolbarMeta, gap: 12 }}>
            <div style={styles.toolbarMeta}>
              <Grid3X3 size={16} />
              <span>
                {Math.round(renderViewport.width)} × {Math.round(renderViewport.height)} view
              </span>
            </div>

            <div style={styles.toolbarMeta}>
              <span>{toolLabel}</span>
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
            cursor: isViewPanningRef.current
              ? "grabbing"
              : tool === "hand"
              ? "grab"
              : "default",
            overflow: "hidden",
          }}
          onWheel={onWheel}
        >
          <svg
            ref={svgRef}
            viewBox={`${renderViewport.x} ${renderViewport.y} ${renderViewport.width} ${renderViewport.height}`}
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