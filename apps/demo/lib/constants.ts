export const workTypeOptions = [
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "product", label: "Product Manager" },
  { value: "marketing", label: "Marketing" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
] as const;

export type WorkType = (typeof workTypeOptions)[number]["value"];
