export function LoadingScreen({ label = '正在加载' }: { label?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-teal-soft">
        <span className="relative flex h-9 w-9 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-teal/20" />
          <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-amber" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber" />
        </span>
        <p className="text-[11px] tracking-[0.18em]">{label}</p>
      </div>
    </div>
  );
}
