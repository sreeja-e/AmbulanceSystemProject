export const AMBULANCE_TYPES = [
  { value: "basic", label: "Basic Ambulance" },
  { value: "advanced", label: "Advanced Ambulance" },
  { value: "icu", label: "ICU Ambulance" },
];

export function formatAmbulanceType(type) {
  return AMBULANCE_TYPES.find((t) => t.value === type)?.label || type;
}
