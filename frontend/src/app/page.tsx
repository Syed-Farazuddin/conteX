import PhotoUpload from "@/components/PhotoUpload";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0c0a12]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/30 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-fuchsia-600/25 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[100px]" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <header className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-violet-300/80">
            ConteX
          </p>
          <h1 className="bg-linear-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Share a moment
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-white/50">
            Pick an action, upload a photo, and we&apos;ll process it — starting
            with background removal.
          </p>
        </header>

        <PhotoUpload />
      </main>
    </div>
  );
}
