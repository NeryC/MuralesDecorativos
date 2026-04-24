export default function AdminPanelLoading() {
  return (
    <>
      <div className="mb-6 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-full sm:w-48 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="space-y-2">
        <div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-14 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    </>
  );
}
