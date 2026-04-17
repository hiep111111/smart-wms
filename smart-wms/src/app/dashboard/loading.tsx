export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-900/50 dark:border-t-blue-500"></div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
          Loading Data...
        </p>
      </div>
    </div>
  );
}
