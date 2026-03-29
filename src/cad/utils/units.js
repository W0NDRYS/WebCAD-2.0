import { UNIT_FACTORS } from "../constants";

export function mmToDisplay(value, unit) {
  return Number((value / UNIT_FACTORS[unit]).toFixed(3));
}

export function displayToMm(value, unit) {
  const num = Number(value);
  return Number.isFinite(num) ? num * UNIT_FACTORS[unit] : 0;
}

export function snap(value, enabled, gridMm) {
  return enabled ? Math.round(value / gridMm) * gridMm : value;
}
