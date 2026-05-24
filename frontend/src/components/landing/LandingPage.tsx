import Image from "next/image";
import PhotoUpload from "@/components/PhotoUpload";

const FEATURES = [
  {
    title: "AI Auto Edit",
    description:
      "Upload once — our AI analyzes your photo and builds a custom edit pipeline tailored to your subject.",
    icon: "✦",
    accent: "from-violet-500/20 to-fuchsia-500/10",
    ring: "ring-violet-400/30",
    delay: "landing-delay-1",
  },
  {
    title: "Smart backgrounds",
    description:
      "Remove messy backgrounds and place your subject on a scene that matches the mood — with intelligent positioning.",
    icon: "◈",
    accent: "from-cyan-500/15 to-violet-500/10",
    ring: "ring-cyan-400/25",
    delay: "landing-delay-2",
  },
  {
    title: "Social-ready export",
    description:
      "Auto crop to 9:16, 16:9, or HD sizes so your content is ready for Reels, TikTok, YouTube, and posts.",
    icon: "▣",
    accent: "from-fuchsia-500/15 to-pink-500/10",
    ring: "ring-fuchsia-400/25",
    delay: "landing-delay-3",
  },
  {
    title: "Manual fine-tune",
    description:
      "Prefer hands-on control? Expand manual tools for background removal, enhance, crop, resize, and more.",
    icon: "◎",
    accent: "from-indigo-500/15 to-violet-500/10",
    ring: "ring-indigo-400/25",
    delay: "landing-delay-4",
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Upload your photo",
    body: "Drop a portrait, product shot, or any image you want to polish.",
  },
  {
    step: "02",
    title: "AI plans your edits",
    body: "ConteX decides the best sequence — enhance, background, crop — and shows you the plan live.",
  },
  {
    step: "03",
    title: "Compare & download",
    body: "See original vs processed side-by-side. Re-run with manual tools anytime.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07060b] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="landing-orb landing-orb-a" />
        <div className="landing-orb landing-orb-b" />
        <div className="landing-orb landing-orb-c" />
        <div className="landing-grid absolute inset-0 opacity-[0.35]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#07060b]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-3">
            <Image
              src="/subLogo.png"
              alt="ConteX"
              width={120}
              height={36}
              className="h-8 w-auto object-contain"
              priority
            />
          </a>
          <a
            href="#studio"
            className="rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white sm:hidden"
          >
            Try it
          </a>
          <div className="hidden items-center gap-8 sm:flex">
            <a
              href="#features"
              className="text-sm text-white/50 transition hover:text-white/90"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-white/50 transition hover:text-white/90"
            >
              How it works
            </a>
            <a
              href="#studio"
              className="rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90"
            >
              Try it free
            </a>
          </div>
        </div>
      </nav>

      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
          <div className="landing-fade-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-violet-200/90">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
              AI photo studio
            </p>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Your photos,{" "}
              <span className="bg-linear-to-r from-violet-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                reimagined by AI
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/55">
              ConteX analyzes your image and runs a custom edit pipeline —
              enhance colors, swap backgrounds, and frame for social — all
              automatically. No design skills required.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#studio"
                className="rounded-2xl bg-linear-to-r from-violet-500 to-fuchsia-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/30 transition hover:scale-[1.02] hover:opacity-95"
              >
                Start editing
              </a>
              <a
                href="#how-it-works"
                className="rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/10"
              >
                See how it works
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/40">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Instant AI pipeline
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Before / after
                preview
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Runs in your browser
              </li>
            </ul>
          </div>

          <div className="landing-fade-up landing-delay-1 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-4 rounded-3xl bg-linear-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/15 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0a14]/80 p-6 shadow-2xl backdrop-blur-sm">
                <Image
                  src="/subLogo.png"
                  alt="ConteX"
                  width={560}
                  height={320}
                  priority
                  className="mx-auto h-auto w-full object-contain"
                />
                <div className="mt-6 space-y-3 rounded-2xl border border-white/8 bg-black/30 p-4 font-mono text-xs">
                  <div className="flex items-center justify-between text-white/40">
                    <span>AI pipeline</span>
                    <span className="text-emerald-400/80">running</span>
                  </div>
                  <div className="space-y-2 text-white/60">
                    <p>
                      <span className="text-violet-300">→</span> adjust-enhance
                    </p>
                    <p>
                      <span className="text-violet-300">→</span> add-background
                    </p>
                    <p>
                      <span className="text-violet-300">→</span> crop-9-16
                    </p>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="landing-progress h-full rounded-full bg-linear-to-r from-violet-500 to-cyan-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/70">
            What ConteX does
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One upload. A full edit suite.
          </h2>
          <p className="mt-4 text-white/50">
            Built for creators, sellers, and anyone who wants
            professional-looking photos without opening Photoshop.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className={`landing-fade-up ${feature.delay} group rounded-2xl border border-white/8 bg-linear-to-br ${feature.accent} p-6 ring-1 ${feature.ring} transition hover:border-white/15 hover:bg-white/4`}
            >
              <span className="text-2xl text-violet-300/80">
                {feature.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl border border-white/8 bg-white/2 p-8 sm:p-12">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/70">
            How it works
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps to a better photo
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((item, i) => (
              <div
                key={item.step}
                className="relative text-center md:text-left"
              >
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-linear-to-r from-violet-500/40 to-transparent md:block" />
                )}
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/30 to-fuchsia-500/20 font-mono text-sm font-bold text-violet-200 ring-1 ring-violet-400/30">
                  {item.step}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="studio" className="mx-auto max-w-6xl px-6 py-20 pb-28">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-300/70">
            The studio
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Try it now
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/50">
            Upload a photo below. AI Auto Edit is selected by default — sit back
            and watch the pipeline run.
          </p>
        </div>
        <div className="mx-auto flex justify-center">
          <PhotoUpload />
        </div>
      </section>

      <footer className="border-t border-white/6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Image
            src="/subLogo.png"
            alt="ConteX"
            width={100}
            height={28}
            className="h-7 w-auto opacity-80"
          />
          <p className="text-sm text-white/35">
            AI-powered photo editing — enhance, composite, export.
          </p>
        </div>
      </footer>
    </div>
  );
}
