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

  function focusCommandInput() {
    requestAnimationFrame(() => {
      state.commandInputRef.current?.focus();
      state.commandInputRef.current?.select?.();
    });
  }

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
    selectionActions,
    focusCommandInput
  );

  useEffect(() => {
    function isTypingTarget(el) {
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    }

    function onKeyDown(e) {
      const activeEl = document.activeElement;

      if (e.key === "Escape") {
        const canceled = pointerHandlers.cancelCurrentInteraction?.();
        if (canceled) {
          e.preventDefault();
          return;
        }
      }

      if (!isTypingTarget(activeEl)) {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          shapeActions.removeSelected();
          return;
        }

        if (e.key === "Enter") {
          const confirmed = pointerHandlers.confirmCurrentInteraction?.();
          if (confirmed) {
            e.preventDefault();
          }
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shapeActions, pointerHandlers]);

  const value = {
    ...state,
    ...historyActions,
    ...shapeActions,
    ...drawingActions,
    ...selectionActions,
    ...exportActions,
    ...inputActions,
    ...pointerHandlers,
    focusCommandInput,
  };

  return <CadContext.Provider value={value}>{children}</CadContext.Provider>;
}