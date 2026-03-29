export const SVG_W = 1200;
export const SVG_H = 800;
export const BASE_GRID_MM = 10;
export const HANDLE_R = 8;

export const UNIT_FACTORS = {
  mm: 1,
  cm: 10,
  m: 1000,
};

export const TOOLBAR = [
  { key: "select", label: "Výběr" },
  { key: "line", label: "Čára" },
  { key: "rect", label: "Obdélník" },
  { key: "circle", label: "Kružnice" },
  { key: "polyline", label: "Polyline" },
  { key: "text", label: "Text" },
  { key: "pan", label: "Posun" },
];

export const styles = {
  rail: {
    gridColumn: "1 / 2",
    gridRow: "1 / 3",
    borderRight: "1px solid #e2e8f0",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "10px 8px",
  },
  railButton: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #dbe4ee",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  canvasArea: {
    gridColumn: "2 / 3",
    gridRow: "1 / 2",
    padding: "16px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
    overflow: "hidden",
    height: "100%",
  },
  cardHeader: {
    padding: "18px 20px 8px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
  },
  toolbarMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 500,
  },
  canvasWrap: {
    margin: 16,
    overflow: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    background: "#ffffff",
    height: "calc(100vh - 96px)",
  },
  statusBar: {
    gridColumn: "2 / 3",
    gridRow: "2 / 3",
    borderTop: "1px solid #e2e8f0",
    background: "#ffffff",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    gap: "16px",
    padding: "0 16px",
    fontSize: "13px",
    color: "#334155",
  },
  statusInfo: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  statusCommand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  input: {
    minHeight: "32px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "6px 10px",
    boxSizing: "border-box",
    background: "#ffffff",
  },
  primaryButton: {
    minHeight: "32px",
    borderRadius: "10px",
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    padding: "0 12px",
    cursor: "pointer",
  },
};
