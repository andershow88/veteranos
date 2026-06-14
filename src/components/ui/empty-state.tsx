/** Consistent empty-state block (icon, title, optional description + action). */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong/60 bg-surface/40 px-6 py-16 text-center">
      {icon && (
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-pitch-700/30 text-pitch-300">
          {icon}
        </div>
      )}
      <h2 className="mt-4 font-display text-2xl tracking-wide">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
