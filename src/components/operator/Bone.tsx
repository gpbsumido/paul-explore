interface BoneProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton placeholder block used in loading states across operator pages.
 * Renders a pulsing rounded rectangle sized via style or className.
 */
export default function Bone({ className, style }: BoneProps) {
  return (
    <div
      className={className}
      style={{
        background: "var(--color-surface-raised)",
        borderRadius: 6,
        animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        ...style,
      }}
    />
  );
}
