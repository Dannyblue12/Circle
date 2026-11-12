"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PITCH_PDF, PITCH_SLIDES } from "@/lib/pitch";
import { useToast } from "./toast";
import { cx } from "./ui";

const N = PITCH_SLIDES.length;
const AUTOPLAY_MS = 6000;

/**
 * The pitch deck as a carousel: arrows, swipe, keyboard (← → Home End, F for fullscreen),
 * thumbnails, autoplay, fullscreen, and downloads for the PDF or the current slide.
 */
export function PitchDeck() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [full, setFull] = useState(false);
  const [drag, setDrag] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const toast = useToast();
  const slide = PITCH_SLIDES[index];

  const go = (n: number) => setIndex(((n % N) + N) % N);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % N), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [playing, index]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      toast("Fullscreen isn’t available here. Try the PDF instead.", { tone: "info" });
    }
  };

  return (
    <div
      ref={root}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Circle pitch deck"
      onKeyDown={(e) => {
        if (e.target instanceof HTMLElement && e.target.closest("a, input")) return;
        const keys: Record<string, () => void> = {
          ArrowRight: () => go(index + 1),
          ArrowLeft: () => go(index - 1),
          Home: () => go(0),
          End: () => go(N - 1),
          f: toggleFull,
        };
        const fn = keys[e.key];
        if (!fn) return;
        e.preventDefault();
        setPlaying(false);
        fn();
      }}
      className={cx(
        "group/deck outline-none focus-visible:ring-4 focus-visible:ring-mint/40",
        full ? "flex h-full w-full flex-col justify-center gap-4 bg-night p-4 sm:p-8" : "rounded-[28px]",
      )}
    >
      {/* Stage */}
      <div
        className="relative overflow-hidden rounded-2xl bg-night shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] ring-1 ring-white/10 select-none touch-pan-y"
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const dx = e.clientX - start.current.x;
          if (Math.abs(dx) > Math.abs(e.clientY - start.current.y)) setDrag(dx);
        }}
        onPointerUp={() => {
          if (Math.abs(drag) > 60) {
            setPlaying(false);
            go(index + (drag < 0 ? 1 : -1));
          }
          start.current = null;
          setDrag(0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDrag(0);
        }}
      >
        <div
          className={cx("flex", !drag && "transition-transform duration-500 ease-[cubic-bezier(.22,.8,.3,1)]")}
          style={{ transform: `translateX(calc(${-index * 100}% + ${drag}px))` }}
        >
          {PITCH_SLIDES.map((s, i) => (
            <div key={s.src} className="w-full shrink-0" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${N}: ${s.title}`} aria-hidden={i !== index}>
              <Image
                src={s.src}
                alt={`${s.title}. ${s.summary}`}
                width={1920}
                height={1080}
                sizes="(min-width: 1280px) 1150px, 100vw"
                priority={i === 0}
                draggable={false}
                className="aspect-video h-auto w-full"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => {
            setPlaying(false);
            go(index - 1);
          }}
          className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition hover:scale-105 hover:bg-white active:scale-95 sm:left-5 sm:grid sm:size-12 md:opacity-0 md:group-hover/deck:opacity-100 md:group-focus-within/deck:opacity-100"
        >
          <Chevron dir="left" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => {
            setPlaying(false);
            go(index + 1);
          }}
          className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition hover:scale-105 hover:bg-white active:scale-95 sm:right-5 sm:grid sm:size-12 md:opacity-0 md:group-hover/deck:opacity-100 md:group-focus-within/deck:opacity-100"
        >
          <Chevron dir="right" />
        </button>

        <p className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 font-mono text-xs font-medium tabular-nums text-white backdrop-blur sm:left-5 sm:top-5">
          {String(index + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
        </p>
        {playing && (
          <span key={index} className="progress absolute inset-x-0 bottom-0 h-1 bg-mint" style={{ animationDuration: `${AUTOPLAY_MS}ms` }} aria-hidden />
        )}
      </div>

      {/* Caption + controls */}
      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0" aria-live="polite">
          <p className="text-lg font-semibold text-white">{slide.title}</p>
          <p className="mt-0.5 max-w-2xl text-sm leading-relaxed text-white/65">{slide.summary}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="contents sm:hidden">
            <IconButton label="Previous slide" onClick={() => { setPlaying(false); go(index - 1); }}>
              <Chevron dir="left" />
            </IconButton>
            <IconButton label="Next slide" onClick={() => { setPlaying(false); go(index + 1); }}>
              <Chevron dir="right" />
            </IconButton>
          </span>
          <IconButton label={playing ? "Pause" : "Autoplay"} onClick={() => setPlaying((p) => !p)} pressed={playing}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
          <IconButton label={full ? "Exit fullscreen" : "Present (F)"} onClick={toggleFull}>
            <ExpandIcon />
          </IconButton>
          <IconButton
            label="Copy link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${window.location.origin}/pitch`);
                toast("Link to the pitch deck copied");
              } catch {
                toast("Couldn’t copy. The deck lives at /pitch.", { tone: "error" });
              }
            }}
          >
            <LinkIcon />
          </IconButton>
          <a
            href={slide.src}
            download={`circle-pitch-slide-${index + 1}.png`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3.5 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
          >
            <DownloadIcon /> Slide {index + 1} (PNG)
          </a>
          <a
            href={PITCH_PDF}
            download="Circle-pitch-deck.pdf"
            className="inline-flex items-center gap-2 rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-night transition hover:brightness-110 active:scale-95"
          >
            <DownloadIcon /> Download deck (PDF)
          </a>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="mt-5 flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:thin]" role="tablist" aria-label="Slides">
        {PITCH_SLIDES.map((s, i) => (
          <button
            key={s.thumb}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}: ${s.title}`}
            onClick={() => {
              setPlaying(false);
              go(i);
            }}
            className={cx(
              "relative w-28 shrink-0 overflow-hidden rounded-lg ring-2 transition sm:w-36",
              i === index ? "ring-mint" : "opacity-60 ring-transparent hover:opacity-100",
            )}
          >
            <Image src={s.thumb} alt="" width={480} height={270} className="aspect-video h-auto w-full" />
            <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 font-mono text-[10px] text-white">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: React.ReactNode; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cx(
        "grid size-10 place-items-center rounded-xl border text-white transition active:scale-95",
        pressed ? "border-mint bg-mint/15 text-mint" : "border-white/20 hover:border-white/40 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
function Chevron({ dir }: { dir: "left" | "right" }) {
  return <svg {...svg} className="size-5">{dir === "left" ? <path d="m15 6-6 6 6 6" /> : <path d="m9 6 6 6-6 6" />}</svg>;
}
function PlayIcon() {
  return <svg {...svg} className="size-4"><path d="M7 5v14l11-7L7 5Z" fill="currentColor" /></svg>;
}
function PauseIcon() {
  return <svg {...svg} className="size-4"><path d="M8 5v14M16 5v14" strokeWidth={3} /></svg>;
}
function ExpandIcon() {
  return <svg {...svg} className="size-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;
}
function LinkIcon() {
  return <svg {...svg} className="size-4"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>;
}
export function DownloadIcon() {
  return <svg {...svg} className="size-4"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>;
}
