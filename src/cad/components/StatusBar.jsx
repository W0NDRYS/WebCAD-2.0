import React from "react";
import { styles } from "../constants";
import { useCad } from "../context/CadContext";
import { mmToDisplay } from "../utils/units";

export default function StatusBar() {
  const { status, tool, units, pointer, liveMetric, commandValue, setCommandValue, applyCommandValue } = useCad();

  const metricText = (() => {
    if (!liveMetric) return "";
    if (liveMetric.kind === "length") return `Délka: ${mmToDisplay(liveMetric.valueMm, units)} ${units}`;
    if (liveMetric.kind === "radius") return `Poloměr: ${mmToDisplay(liveMetric.valueMm, units)} ${units} | Průměr: ${mmToDisplay(liveMetric.diameterMm, units)} ${units}`;
    return "";
  })();

  const placeholder = liveMetric?.kind === "radius" ? `Poloměr (${units})` : `Délka (${units})`;

  return (
    <div style={styles.statusBar}>
      <div style={styles.statusInfo}>
        <span><strong>Stav:</strong> {status}</span>
        <span><strong>Nástroj:</strong> {tool}</span>
        <span><strong>Souřadnice:</strong> X {mmToDisplay(pointer.x, units)} / Y {mmToDisplay(pointer.y, units)} {units}</span>
        {metricText ? <span><strong>{metricText}</strong></span> : null}
      </div>
      <div style={styles.statusCommand}>
        <input
          type="number"
          step="0.001"
          value={commandValue}
          onChange={(e) => setCommandValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyCommandValue();
          }}
          placeholder={placeholder}
          style={{ ...styles.input, width: 180 }}
        />
        <button onClick={applyCommandValue} style={styles.primaryButton}>Použít</button>
      </div>
    </div>
  );
}
