import React, { useEffect } from "react";
import { CadContext } from "./CadContext";
import { useCadState } from "../state/useCadState";
import { createHistoryActions } from "../actions/historyActions";
import { createShapeActions } from "../actions/shapeActions";
import { createDrawingActions } from "../actions/drawingActions";
import { createSelectionActions } from "../actions/selectionActions";
import { createExportActions } from "../actions/exportActions";
import { createInputActions } from "../actions/inputActions";
import { createPointerHandlers } from "../handlers/pointerHandlers";

export function CadProvider({ children }) {
  const state = useCadState();
  const historyActions = createHistoryActions(state);
  const shapeActions = createShapeActions(state, historyActions);
  const drawingActions = createDrawingActions(state, shapeActions);
  const selectionActions = createSelectionActions(state);
  const exportActions = createExportActions(state, shapeActions);
  const inputActions = createInputActions(state, shapeActions);
  const pointerHandlers = createPointerHandlers(
    state,
    historyActions,
    drawingActions,
    selectionActions
  );

  useEffect(() => {
    function isTypingTarget(el) {
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    }

    function onKeyDown(e) {
      const activeEl = document.activeElement;
      const typing = isTypingTarget(activeEl);
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === "Escape") {
        const canceled = pointerHandlers.cancelCurrentInteraction?.();
        if (canceled) {
          e.preventDefault();
        }
        return;
      }

      if (typing) return;

      if (mod && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        historyActions.undo();
        return;
      }

      if (
        (mod && (e.key === "y" || e.key === "Y")) ||
        (mod && e.shiftKey && (e.key === "z" || e.key === "Z"))
      ) {
        e.preventDefault();
        historyActions.redo();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        shapeActions.removeSelected();
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        state.setTool("select");
        state.setStatus("Nástroj: Výběr");
        return;
      }

      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        state.setTool("move");
        state.setStatus("Nástroj: Move");
        return;
      }

      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        state.setTool("hand");
        state.setStatus("Nástroj: Hand");
        return;
      }

      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        state.setTool("line");
        state.setStatus("Nástroj: Čára");
        return;
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        state.setTool("rect");
        state.setStatus("Nástroj: Obdélník");
        return;
      }

      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        state.setTool("circle");
        state.setStatus("Nástroj: Kružnice");
        return;
      }

      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        state.setTool("polyline");
        state.setStatus("Nástroj: Polyline");
        return;
      }

      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        state.setTool("text");
        state.setStatus("Nástroj: Text");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state, pointerHandlers, historyActions, shapeActions]);

  const value = {
    ...state,
    ...historyActions,
    ...shapeActions,
    ...drawingActions,
    ...selectionActions,
    ...exportActions,
    ...inputActions,
    ...pointerHandlers,
  };

  return <CadContext.Provider value={value}>{children}</CadContext.Provider>;
}