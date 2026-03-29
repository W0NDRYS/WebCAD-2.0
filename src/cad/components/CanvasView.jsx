import React from "react";
import { Grid3X3 } from "lucide-react";
import { styles, SVG_H, SVG_W } from "../constants";
import { useCad } from "../context/CadContext";
import DrawingSvg from "./DrawingSvg";

export default function CanvasView() {
  const { svgRef, handlePointerDown, handlePointerMove, handlePointerUp, handleDoubleClick } = useCad();

  return (
    <div style={styles.canvasArea}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.title}>Výkres</h2>
          <div style={styles.toolbarMeta}><Grid3X3 size={16} /><span>{SVG_W} × {SVG_H} mm</span></div>
        </div>
        <div style={styles.canvasWrap}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ width: "100%", height: "100%", display: "block", touchAction: "none", userSelect: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onDoubleClick={handleDoubleClick}
          >
            <DrawingSvg />
          </svg>
        </div>
      </div>
    </div>
  );
}
