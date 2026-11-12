import Link from "next/link";
import { PitchDeck } from "@/components/pitch-deck";
import { PITCH_PDF, PITCH_SLIDES } from "@/lib/pitch";

export const metadata = {
  title: "Pitch deck",
  description: "Circle’s pitch: why Circle should be Stellar’s global talent hub. Seven slides, downloadable as a PDF.",
};

export default function PitchPage() {
  return (
    <div className="px-3 pt-3 pb-16 sm:px-4 sm:pt-4">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-night px-4 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
        <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-brand/40 blur-[120px]" aria-hidden />
        <div className="relative mx-auto max-w-6xl">
          <Link href="/" className="text-sm font-medium text-white/60 hover:text-white">← Circle</Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-widest text-mint">Pitch deck · {PITCH_SLIDES.length} slides · about 3 minutes</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Circle: Stellar&apos;s global talent hub</h1>
              <p className="mt-3 leading-relaxed text-white/70">Use ← → or swipe to move, F to present full screen.</p>
            </div>
            <a href={PITCH_PDF} download="Circle-pitch-deck.pdf" className="inline-flex items-center gap-2 rounded-xl bg-mint px-5 py-3 text-sm font-semibold text-night transition hover:brightness-110">
              Download PDF
            </a>
          </div>
          <div className="mt-10">
            <PitchDeck />
          </div>
        </div>
      </div>

      <section className="mx-auto mt-14 max-w-6xl px-1 sm:px-2">
        <h2 className="text-xl font-bold tracking-tight">Every slide at a glance</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PITCH_SLIDES.map((s, i) => (
            <li key={s.src} className="rounded-2xl border border-line bg-white p-5">
              <p className="font-mono text-xs text-brand">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-1 font-semibold">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.summary}</p>
              <a href={s.src} download={`circle-pitch-slide-${i + 1}.png`} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
                Download PNG
              </a>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
