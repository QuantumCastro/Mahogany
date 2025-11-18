type HealthCardProps = {
  service: string;
  status: "ok" | "degraded" | "down";
  timestamp: string;
};

const statusColor: Record<HealthCardProps["status"], string> = {
  ok: "bg-emerald-500/20 text-emerald-200",
  degraded: "bg-amber-500/20 text-amber-200",
  down: "bg-rose-500/20 text-rose-200",
};

export function HealthCard({ service, status, timestamp }: HealthCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{service}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[status]}`}>
          {status.toUpperCase()}
        </span>
      </header>
      <p className="text-sm text-slate-400">Última respuesta: {new Date(timestamp).toLocaleString()}</p>
    </article>
  );
}
