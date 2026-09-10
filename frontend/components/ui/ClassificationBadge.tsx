import { ClassificationLabel, CLASSIFICATION_META } from "@/lib/mockData";

interface ClassificationBadgeProps {
  classification: ClassificationLabel;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function ClassificationBadge({
  classification,
  size = "md",
  showDot = false,
}: ClassificationBadgeProps) {
  const meta = CLASSIFICATION_META[classification];

  const padding = size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${padding}`}
      style={{
        color: meta.color,
        backgroundColor: meta.bg,
        border: `1px solid ${meta.color}25`,
      }}
    >
      {meta.label}
    </span>
  );
}
