interface FeaturePillProps {
  label: string;
}

export function FeaturePill({ label }: FeaturePillProps) {
  return (
    <span className="rounded-full bg-brand/20 px-2 py-1 text-xs font-medium uppercase tracking-wide text-brand-light">
      {label}
    </span>
  );
}
