export default function UsagePage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <div className="mb-8">
          <h1 className="font-medium text-3xl tracking-tight">Usage</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            View your usage statistics
          </p>
        </div>
      </div>
    </div>
  );
}
