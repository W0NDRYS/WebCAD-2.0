import { createContext, useContext } from "react";

export const CadContext = createContext(null);

export function useCad() {
  const ctx = useContext(CadContext);
  if (!ctx) throw new Error("useCad musí být použit uvnitř CadProvider");
  return ctx;
}
