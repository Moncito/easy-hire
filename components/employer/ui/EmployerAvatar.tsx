type Size = "sm" | "md" | "lg";
type Shape = "circle" | "rounded";

const sizeClasses: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-8 w-8", text: "text-[10px]" },
  md: { box: "h-9 w-9", text: "text-xs" },
  lg: { box: "h-11 w-11", text: "text-sm" },
};

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: Size;
  shape?: Shape;
  className?: string;
  fallbackClassName?: string;
};

export default function EmployerAvatar({
  name,
  imageUrl,
  size = "md",
  shape = "circle",
  className = "",
  fallbackClassName = "bg-teal/12 text-teal",
}: Props) {
  const { box, text } = sizeClasses[size];
  const radius = shape === "circle" ? "rounded-full" : "rounded-lg";

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className={`${box} shrink-0 ${radius} object-cover ring-1 ring-ink/10 ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center ${radius} font-display font-bold ${text} ${fallbackClassName} ${className}`}
      aria-hidden="true"
    >
      {initialsFromName(name || "?")}
    </div>
  );
}
