/** Grouped form section (fieldset + legend) for consistent form structure. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-3 rounded-2xl border border-border/60 bg-surface/40 p-4 sm:p-5">
      <legend className="px-2 text-xs font-bold uppercase tracking-[0.2em] text-pitch-300">
        {title}
      </legend>
      {description && <p className="-mt-1 text-xs text-muted">{description}</p>}
      {children}
    </fieldset>
  );
}
