export function LoadingScreen({ label = '正在加载' }: { label?: string }) {
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <div className="flex flex-col items-center gap-4 text-moss">
        <span className="relative flex h-9 w-9 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-moss/25" />
          <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-clay" />
          <span className="h-1.5 w-1.5 rounded-full bg-clay" />
        </span>
        <p className="text-xs tracking-[0.2em]">{label}</p>
      </div>
    </div>
  );
}
