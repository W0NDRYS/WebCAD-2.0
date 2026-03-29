import React from "react";
import { CadProvider } from "./cad/context/CadProvider";
import Sidebar from "./cad/components/Sidebar";
import CanvasView from "./cad/components/CanvasView";
import StatusBar from "./cad/components/StatusBar";
import "./index.css";

const shell = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "64px 1fr",
  gridTemplateRows: "1fr 48px",
  background: "#f1f5f9",
  color: "#0f172a",
  fontFamily: "Inter, Arial, Helvetica, sans-serif",
};

export default function App() {
  return (
    <CadProvider>
      <div style={shell}>
        <Sidebar />
        <CanvasView />
        <StatusBar />
      </div>
    </CadProvider>
  );
}
