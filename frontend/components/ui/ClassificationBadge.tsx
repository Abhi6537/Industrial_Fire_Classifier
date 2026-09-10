import { ClassificationLabel, CLASSIFICATION_META } from "@/lib/mockData";

interface ClassificationBadgeProps {
  classification: ClassificationLabel;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function ClassificationBadge({
  classification,
  size = "md",
  showDot = true,
}: ClassificationBadgeProps) {
  const meta = CLASSIFICATION_META[classification];

  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-medium ${padding}`}
      style={{
        color: meta.color,
        backgroundColor: meta.bg,
        border: `1px solid ${meta.color}30`,
      }}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: meta.color }}
        />
      )}
      {meta.label}
    </span>
  );
}
