import React from "react";
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
