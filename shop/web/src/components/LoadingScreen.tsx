export function LoadingScreen({ label = '正在加载' }: { label?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-olive">
        <span className="relative flex h-8 w-8 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-line" />
          <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-brick" />
        </span>
        <p className="text-[10px] tracking-[0.18em]">{label}</p>
      </div>
    </div>
  );
}
