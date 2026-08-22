"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useLoginModalOptional } from "@/components/auth/LoginModalProvider";
import * as THREE from "three";
import type { LandingCompany, LandingStats } from "@/lib/landing";

function LoginPrompt({ className }: { className: string }) {
  const loginModal = useLoginModalOptional();
  if (loginModal) {
    return (
      <p className={className}>
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => loginModal.openLogin()}
          className="cursor-pointer font-bold underline-offset-2 hover:underline"
        >
          Log in
        </button>
      </p>
    );
  }
  return (
    <p className={className}>
      Already have an account?{" "}
      <Link href="/login" className="font-semibold underline-offset-2 hover:underline">
        Log in
      </Link>
    </p>
  );
}

const cardShadow = "shadow-[0_14px_40px_rgba(32,36,43,0.08)]";

function HeroCards({
  stats,
  featuredCompany,
}: {
  stats?: LandingStats;
  featuredCompany?: LandingCompany | null;
}) {
  const verifiedCount = stats?.verifiedCompanies ?? 0;

  return (
    <div className="mt-16 flex w-full flex-col items-center gap-4 md:mt-20 md:flex-row md:items-end md:justify-center md:gap-5">
      <article
        className={`w-full max-w-sm rounded-3xl bg-[#F3EBE0] p-5 text-left ${cardShadow} md:max-w-[13.75rem] md:translate-y-8`}
      >
        <p className="font-body text-sm font-medium leading-relaxed text-ink/80">
          Every employer is checked before a role goes live. One profile. No spam listings.
        </p>
        <p className="mt-5 text-[11px] font-semibold tracking-wide text-ink/45">
          Verified hiring
        </p>
      </article>

      <article
        className={`w-full max-w-sm rounded-3xl bg-white p-6 text-left ${cardShadow} md:max-w-[20rem] md:-translate-y-2`}
      >
        <p className="font-data text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          $680
        </p>
        <p className="mt-1 text-xs text-ink/50">avg. monthly salary</p>
        <svg
          viewBox="0 0 240 64"
          className="mt-5 w-full"
          aria-hidden="true"
        >
          <path
            d="M4 44 C38 18, 72 52, 112 30 S176 8, 236 34"
            fill="none"
            stroke="#20242B"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
          <circle cx="176" cy="16" r="6" fill="#F2A93B" />
        </svg>
        <p className="mt-3 font-data text-xs text-ink/55">4.9 / 5.0 rating</p>
      </article>

      {featuredCompany ? (
        <Link
          href={`/companies/${featuredCompany.id}`}
          className={`block w-full max-w-sm rounded-3xl bg-marigold p-5 text-left ${cardShadow} transition-opacity hover:opacity-95 md:max-w-[14.5rem] md:translate-y-12`}
        >
          <EmployerCardBody company={featuredCompany} />
        </Link>
      ) : (
        <article
          className={`w-full max-w-sm rounded-3xl bg-marigold p-5 text-left ${cardShadow} md:max-w-[14.5rem] md:translate-y-12`}
        >
          <p className="font-data text-3xl font-semibold text-ink">
            {verifiedCount > 0 ? `${verifiedCount}` : "—"}
          </p>
          <p className="mt-2 text-sm font-medium text-ink/75">Verified employers</p>
          <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink/60">
            <BadgeCheck className="h-3.5 w-3.5" />
            Admin-reviewed
          </p>
        </article>
      )}
    </div>
  );
}

function EmployerCardBody({ company }: { company: LandingCompany }) {
  return (
    <>
      {company.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={company.logoUrl}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-white/70"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80">
          <span className="font-display text-lg font-bold text-ink">
            {company.companyName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <p className="mt-4 font-display text-lg font-bold leading-snug text-ink">
        {company.companyName}
      </p>
      {company.industry ? (
        <p className="mt-1 text-xs font-medium text-ink/60">{company.industry}</p>
      ) : null}
      <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink/70">
        <BadgeCheck className="h-3.5 w-3.5" />
        Verified employer
      </p>
    </>
  );
}

type HeroProps = {
  stats?: LandingStats;
  featuredCompany?: LandingCompany | null;
};

export default function Hero({ stats, featuredCompany = null }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let width = parent.clientWidth || window.innerWidth;
    let height = parent.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(width, height) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uStrength: { value: 0 },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uStrength;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
          for (int i = 0; i < 5; ++i) {
            v += a * noise(p);
            p = rot * p * 2.02 + 17.13;
            a *= 0.5;
          }
          return v;
        }

        // Subtle waves at the edges, cream/white field in the center.
        vec3 samplePattern(vec2 uv, float aspect) {
          vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

          vec2 w = vec2(
            fbm(p * 0.72 + vec2(0.22, 1.13)),
            fbm(p * 0.72 + vec2(3.71, 1.94))
          );
          vec2 q = p + (w - 0.5) * 0.68;
          vec2 w2 = vec2(
            fbm(q * 0.95 + w * 1.15),
            fbm(q * 0.95 + vec2(6.12, 2.41))
          );
          float n = fbm(q * 0.78 + w2 * 1.3);

          vec3 cMist = vec3(0.996, 0.992, 0.969);
          vec3 cGold = mix(cMist, vec3(0.949, 0.663, 0.231), 0.52);
          vec3 cTeal = mix(cMist, vec3(0.122, 0.502, 0.451), 0.48);

          float goldBand = smoothstep(0.55, 0.92, sin(n * 8.2));
          float tealBand = smoothstep(0.50, 0.90, sin(n * 6.6 + 1.9));

          float nx = fbm(p * 1.35 + vec2(2.1, 0.4));
          float ny = fbm(p * 1.35 + vec2(0.7, 3.2));
          vec2 pe = p + (vec2(nx, ny) - 0.5) * 0.28;
          float radial = length(vec2(pe.x * 0.52, pe.y * 1.08));
          float center = 1.0 - smoothstep(0.04, 0.68, radial);
          center = pow(center, 1.08);

          goldBand *= mix(1.0, 0.05, center);
          tealBand *= mix(1.0, 0.05, center);

          vec3 color = mix(cMist, cGold, goldBand);
          color = mix(color, cTeal, tealBand * (1.0 - goldBand * 0.65));
          color = mix(color, cMist, center * 0.88);
          return color;
        }

        void main() {
          vec2 uv = vUv;
          float aspect = uResolution.x / max(uResolution.y, 1.0);
          vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
          vec2 mouse = vec2((uMouse.x - 0.5) * aspect, uMouse.y - 0.5);

          vec2 toMouse = p - mouse;
          float dist = length(toMouse);
          float falloff = 1.0 - smoothstep(0.0, 0.58, dist);
          falloff *= falloff;

          vec2 dir = toMouse / (dist + 0.00015);
          vec2 tangent = vec2(-dir.y, dir.x);
          vec2 displace = (-dir * 0.82 + tangent * 0.18) * falloff * uStrength * 0.034;

          vec2 sampleUv = uv + vec2(displace.x / aspect, displace.y);
          gl_FragColor = vec4(samplePattern(sampleUv, aspect), 1.0);
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const mouse = new THREE.Vector2(0.5, 0.5);
    const targetMouse = new THREE.Vector2(0.5, 0.5);
    let pointerInside = false;
    let strength = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointerInside = true;
      targetMouse.x = (e.clientX - rect.left) / rect.width;
      targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
    };

    const handlePointerLeave = () => {
      pointerInside = false;
    };

    parent.addEventListener("pointermove", handlePointerMove);
    parent.addEventListener("pointerleave", handlePointerLeave);

    const handleResize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const dx = targetMouse.x - mouse.x;
      const dy = targetMouse.y - mouse.y;
      mouse.x += dx * 0.08;
      mouse.y += dy * 0.08;

      const speed = Math.hypot(dx, dy);
      const moving = pointerInside && speed > 0.0007;
      const targetStrength = moving ? 1 : 0;
      const ease = moving ? 0.11 : 0.032;
      strength += (targetStrength - strength) * ease;

      uniforms.uMouse.value.copy(mouse);
      uniforms.uStrength.value = strength;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      parent.removeEventListener("pointermove", handlePointerMove);
      parent.removeEventListener("pointerleave", handlePointerLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section
      className="relative z-10 flex min-h-screen w-full flex-col overflow-hidden bg-mist"
      aria-label="Hero"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-mist"
      />

      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-24 text-center md:py-28">
        <div className="relative flex w-full max-w-3xl flex-col items-center">
          <h1 className="mb-6 font-display text-[clamp(2.4rem,6vw,4.75rem)] font-extrabold leading-[1.12] tracking-tight text-ink">
            Find your next{" "}
            <span className="hero-flip inline-grid overflow-hidden align-bottom">
              <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
                opportunity.
              </span>
              <span className="hero-flip-a col-start-1 row-start-1 whitespace-nowrap text-left">
                opportunity.
              </span>
              <span className="hero-flip-b col-start-1 row-start-1 whitespace-nowrap text-left">
                hire.
              </span>
            </span>
            <br />
            Without the noise.
          </h1>

          <p className="mb-10 max-w-xl font-body text-base font-medium leading-[1.7] text-ink/80 md:text-lg">
            Build one profile and apply to roles from employers we verify before
            they go live — or post a job and meet your next VA.
          </p>

        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Link
            href="/signup?role=SEEKER"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-7 py-3.5 text-[0.9375rem] font-semibold text-mist transition-colors hover:bg-navy sm:w-auto"
          >
            I&apos;m looking for work
            <ArrowRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/signup?role=EMPLOYER"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink/12 bg-white px-7 py-3.5 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-mist sm:w-auto"
          >
            I&apos;m hiring
            <ArrowRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <LoginPrompt className="mt-6 text-sm font-medium text-ink/75" />
        </div>

        <HeroCards stats={stats} featuredCompany={featuredCompany} />
      </div>
      <style>{`
        .hero-flip-a {
          animation: hero-flip-a 5.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .hero-flip-b {
          animation: hero-flip-b 5.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        @keyframes hero-flip-a {
          0%, 42% { transform: translateY(0%); }
          50%, 92% { transform: translateY(-110%); }
          100% { transform: translateY(0%); }
        }
        @keyframes hero-flip-b {
          0%, 42% { transform: translateY(110%); }
          50%, 92% { transform: translateY(0%); }
          100% { transform: translateY(110%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-flip-a,
          .hero-flip-b { animation: none; }
          .hero-flip-b { transform: translateY(110%); }
        }
      `}</style>
    </section>
  );
}
