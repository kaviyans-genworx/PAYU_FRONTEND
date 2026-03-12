/**
 * A simple key-value display row for detail pages.
 */
export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">
        {value ?? "—"}
      </span>
    </div>
  );
}
