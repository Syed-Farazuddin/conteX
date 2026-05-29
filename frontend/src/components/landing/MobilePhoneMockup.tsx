import Image from "next/image";

type MobilePhoneMockupProps = {
  src: string;
  alt: string;
  label?: string;
  priority?: boolean;
  className?: string;
  tilt?: "left" | "right" | "none";
};

export default function MobilePhoneMockup({
  src,
  alt,
  label,
  priority = false,
  className = "",
  tilt = "none",
}: MobilePhoneMockupProps) {
  const tiltClass =
    tilt === "left" ? "-rotate-6" : tilt === "right" ? "rotate-6" : "";

  return (
    <figure className={`flex flex-col items-center ${tiltClass} ${className}`}>
      <div className="relative w-[min(100%,260px)] sm:w-[280px]">
        <div className="absolute -inset-3 rounded-[2.75rem] bg-linear-to-br from-violet-500/25 via-fuchsia-500/10 to-cyan-500/20 blur-xl" />
        <div className="relative rounded-[2.25rem] border border-white/15 bg-[#0a0a10] p-2 shadow-2xl shadow-black/50 ring-1 ring-white/10">
          <div className="absolute left-1/2 top-2.5 z-10 h-1 w-16 -translate-x-1/2 rounded-full bg-black/80" />
          <div className="overflow-hidden rounded-[1.85rem] bg-black">
            <Image
              src={src}
              alt={alt}
              width={403}
              height={874}
              priority={priority}
              className="h-auto w-full object-cover object-top"
              sizes="(max-width: 640px) 260px, 280px"
            />
          </div>
        </div>
      </div>
      {label && (
        <figcaption className="mt-4 text-center text-xs font-medium uppercase tracking-wider text-white/45">
          {label}
        </figcaption>
      )}
    </figure>
  );
}
