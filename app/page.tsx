"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Layers,
  Sparkles,
  Wallet,
  Target,
  Zap,
  BarChart3,
  Copy,
  Check,
  RefreshCw,
  Info,
  TrendingUp,
  Activity,
  ChevronRight,
  ArrowRightLeft,
  Calculator,
  ShieldCheck,
} from "lucide-react";

type SVec = [1, 0, 0] | [0, 1, 0] | [0, 0, 1] | [1, 1, 1];
const S_OPTS: { v: SVec; label: string; sub: string; letter: string }[] = [
  { v: [1, 0, 0], label: "(1, 0, 0)", sub: "x gagnant", letter: "X" },
  { v: [0, 1, 0], label: "(0, 1, 0)", sub: "y gagnant", letter: "Y" },
  { v: [0, 0, 1], label: "(0, 0, 1)", sub: "z gagnant", letter: "Z" },
  { v: [1, 1, 1], label: "(1, 1, 1)", sub: "Total cumul", letter: "Σ" },
];
const eqS = (a: SVec, b: SVec) => a.join(",") === b.join(",");

function fmt(n: number, d = 4) {
  if (!isFinite(n)) return "—";
  return n.toFixed(d);
}
function fmt2(n: number) {
  if (!isFinite(n)) return "—";
  return n.toFixed(2);
}
function pct(n: number) {
  if (!isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default function BetStepsPro() {
  // === ETAPE 1 ===
  const [CA, setCA] = useState(100);
  const [x, setX] = useState(1.85);
  const [y, setY] = useState(1.85);
  const [z, setZ] = useState(1.85);
  const [FS, setFS] = useState(100); // Fond supplémentaire
  const [S, setS] = useState<SVec>([1, 0, 0]);

  // === ETAPE 2 ===
  const [u, setU] = useState(1.75);
  const [v, setV] = useState(1.69);
  const [w, setW] = useState(1.85);

  // triplet manuel
  const [a0m, setA0m] = useState<number | null>(null);
  const [b0m, setB0m] = useState<number | null>(null);
  const [c0m, setC0m] = useState<number | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [copied, setCopied] = useState(false);

  const inv = useMemo(() => (x <= 0 || y <= 0 || z <= 0 ? NaN : 1 / x + 1 / y + 1 / z), [x, y, z]);
  const q = useMemo(() => (!isFinite(inv) || inv === 0 ? NaN : (1 / inv - 1) * 100), [inv]);

  const a0c = useMemo(() => (!isFinite(inv) || inv === 0 || CA <= 0 || x <= 0 ? NaN : CA / (x * inv)), [CA, x, inv]);
  const b0c = useMemo(() => (!isFinite(inv) || inv === 0 || CA <= 0 || y <= 0 ? NaN : CA / (y * inv)), [CA, y, inv]);
  const c0c = useMemo(() => (!isFinite(inv) || inv === 0 || CA <= 0 || z <= 0 ? NaN : CA / (z * inv)), [CA, z, inv]);

  const ea0 = a0m ?? a0c;
  const eb0 = b0m ?? b0c;
  const ec0 = c0m ?? c0c;

  useEffect(() => {
    if (autoSync) {
      setA0m(null);
      setB0m(null);
      setC0m(null);
    }
  }, [a0c, b0c, c0c, autoSync]);

  // NCA selon PDF : conditionnel sur S
  const NCA = useMemo(() => {
    if (!isFinite(ea0) || !isFinite(eb0) || !isFinite(ec0)) return NaN;
    if (eqS(S, [1, 0, 0])) return x * ea0;
    if (eqS(S, [0, 1, 0])) return y * eb0;
    if (eqS(S, [0, 0, 1])) return z * ec0;
    return x * ea0 + y * eb0 + z * ec0; // (1,1,1)
  }, [ea0, eb0, ec0, x, y, z, S]);

  const BUDGET = useMemo(() => (!isFinite(NCA) || !isFinite(FS) ? NaN : NCA + FS), [NCA, FS]);

  // Allocations
  const alloc = useMemo(() => {
    if (!isFinite(ea0) || !isFinite(eb0) || !isFinite(ec0) || !isFinite(BUDGET)) return { a1: NaN, b1: NaN, c1: NaN };
    if (u <= 0 || v <= 0 || w <= 0) return { a1: NaN, b1: NaN, c1: NaN };
    let a1 = NaN, b1 = NaN, c1 = NaN;
    if (eqS(S, [1, 0, 0])) {
      a1 = ea0;
      b1 = Math.max(eb0, (eb0 * y) / v);
      c1 = BUDGET - a1 - b1;
    } else if (eqS(S, [0, 1, 0])) {
      b1 = eb0;
      c1 = Math.max(ec0, (ec0 * z) / w);
      a1 = BUDGET - b1 - c1;
    } else if (eqS(S, [0, 0, 1])) {
      c1 = ec0;
      a1 = Math.max(ea0, (ea0 * x) / u);
      b1 = BUDGET - a1 - c1;
    } else {
      // Total
      a1 = Math.max(ea0, (ea0 * x) / u);
      b1 = Math.max(eb0, (eb0 * y) / v);
      c1 = BUDGET - a1 - b1;
    }
    return { a1, b1, c1 };
  }, [ea0, eb0, ec0, BUDGET, S, u, v, w, x, y, z]);

  const prod = useMemo(() => {
    const j1 = alloc.a1 * u, j2 = alloc.b1 * v, j3 = alloc.c1 * w;
    return { j1, j2, j3, sum: j1 + j2 + j3 };
  }, [alloc, u, v, w]);

  const qColor = q < 0 ? "text-[#ff5a6b]" : q > 0 ? "text-emerald-400" : "text-amber-400";

  const copy = () => {
    const t = `BetSteps — ${new Date().toLocaleDateString()}
CA=${CA} | x=${x} y=${y} z=${z} | S=(${S.join(",")})
a0=${fmt(a0c)} b0=${fmt(b0c)} c0=${fmt(c0c)}
NCA=${fmt2(NCA)} FS=${FS} BUDGET=${fmt2(BUDGET)}
u=${u} v=${v} w=${w}
a1=${fmt(alloc.a1)} b1=${fmt(alloc.b1)} c1=${fmt(alloc.c1)}
J1=${fmt2(prod.j1)} J2=${fmt2(prod.j2)} J3=${fmt2(prod.j3)} SUM=${fmt2(prod.sum)}`;
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08080f] relative">
      {/* bg mesh */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0"
          style={{
            background:
              "radial-gradient(700px circle at 0% 0%, rgba(139,92,246,0.14), transparent 60%), radial-gradient(800px circle at 100% 0%, rgba(217,70,239,0.10), transparent 60%), radial-gradient(600px circle at 100% 100%, rgba(236,72,153,0.07), transparent 60%)",
          }}
        />
      </div>

      {/* Header — premium, compact */}
      <header className="relative z-10 sticky top-0 backdrop-blur-xl bg-[#08080f]/70 border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1120px] px-4 md:px-6 h-[62px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20" style={{ background: "linear-gradient(135deg,#8b5cf6 0%,#d946ef 100%)" }}>
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-2 leading-none">
                <span className="text-[17px] font-extrabold tracking-tight text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Bet</span>
                <span className="text-[17px] font-extrabold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif", background: "linear-gradient(135deg,#8b5cf6 0%,#d946ef 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Steps</span>
                <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-white/60">BETA</span>
              </div>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-white/35 -mt-0.5">CALCULATEUR SÉQUENTIEL · 2 ÉTAPES</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> En direct
            </span>
            <button onClick={copy} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#0a0a12] hover:bg-white/90">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copié" : "Copier"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero minimal — essentiel seulement */}
      <div className="relative z-10 mx-auto max-w-[1120px] px-4 md:px-6 pt-6 pb-3">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h2 className="text-[26px] md:text-[32px] font-extrabold leading-[0.95] tracking-tight text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              L’essentiel,<br />
              <span style={{ background: "linear-gradient(135deg,#8b5cf6,#d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>sans le bruit.</span>
            </h2>
            <p className="mt-2 text-sm text-white/45 max-w-[520px] leading-relaxed">
              Toutes tes infos du PDF, résumées en deux cartes exploitables. Modifie, le reste suit.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/35">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Calculs validés • Temps réel
          </div>
        </div>

        {/* KPIs résumés — 4 essentiels */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "BUDGET", value: fmt2(BUDGET), unit: "unités", icon: Wallet, color: "violet" },
            { label: "NCA", value: fmt2(NCA), unit: "nouveau capital", icon: TrendingUp, color: "fuchsia" },
            { label: "MARGE Q", value: pct(q), unit: "1/inv − 1", icon: Activity, color: "amber", textColor: qColor },
            { label: "SOMME J", value: fmt2(prod.sum), unit: "u·a1+v·b1+w·c1", icon: BarChart3, color: "emerald" },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur px-4 py-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-white/[0.06] border border-white/[0.06] grid place-items-center">
                <k.icon className="h-4 w-4 text-white/70" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-white/40">{k.label}</p>
                <p className={`text-[15px] font-extrabold font-mono leading-none mt-1 ${k.textColor ?? "text-white"}`}>{k.value} <span className="text-[10px] font-sans font-medium text-white/30">{k.unit}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === 2 CARTES === */}
      <div className="relative z-10 mx-auto max-w-[1120px] px-4 md:px-6 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 01 — ETAPE DE BASE */}
        <div className="rounded-[22px] bg-[#11111d] border border-white/[0.07] overflow-hidden shadow-2xl">
          <div className="h-[1px] bg-gradient-to-r from-violet-500/40 via-fuchsia-500/30 to-transparent" />
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl grid place-items-center text-xs font-black text-white shadow" style={{ background: "linear-gradient(135deg,#8b5cf6,#d946ef)" }}>01</div>
              <div>
                <h3 className="text-[14px] font-extrabold text-white leading-none">ÉTAPE DE BASE</h3>
                <p className="text-xs text-white/40 mt-1">Capital et cotes marché</p>
              </div>
              <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.07] px-3 py-1 text-[11px] font-semibold text-white/60">
                <Calculator className="h-3.5 w-3.5" /> Essentiel
              </span>
            </div>

            {/* CA */}
            <div className="mt-4">
              <label className="text-[11px] font-bold tracking-widest text-white/50">CA — CAPITAL DE BASE</label>
              <div className="mt-1.5 relative">
                <input type="number" value={CA} onChange={e => setCA(parseFloat(e.target.value) || 0)} className="w-full h-[42px] rounded-xl bg-[#0a0a12] border border-white/10 px-3 pr-16 text-sm font-bold text-white focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/10" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-white/30">unités</span>
              </div>
            </div>

            {/* x y z */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { k: "x", v: x, set: setX },
                { k: "y", v: y, set: setY },
                { k: "z", v: z, set: setZ },
              ].map(f => (
                <label key={f.k}>
                  <span className="text-[11px] font-bold tracking-widest text-white/50">{f.k}</span>
                  <input type="number" step={0.01} value={f.v} onChange={e => f.set(parseFloat(e.target.value) || 0)} className="mt-1 w-full h-10 rounded-xl bg-[#0a0a12] border border-white/10 text-sm font-bold text-white text-center focus:outline-none focus:border-violet-500/40" />
                </label>
              ))}
            </div>

            {/* Triplet */}
            <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold tracking-widest text-white/55">TRIPLET (a0, b0, c0)</p>
                <span className="text-[11px] font-mono text-white/40">Σ {fmt2(a0c + b0c + c0c)}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { k: "a0", v: ea0, set: (n: number) => { setA0m(n); setAutoSync(false); }, ph: a0c },
                  { k: "b0", v: eb0, set: (n: number) => { setB0m(n); setAutoSync(false); }, ph: b0c },
                  { k: "c0", v: ec0, set: (n: number) => { setC0m(n); setAutoSync(false); }, ph: c0c },
                ].map(f => (
                  <div key={f.k}>
                    <p className="text-center text-[10px] font-bold tracking-widest text-white/40">{f.k}</p>
                    <input
                      type="number" step={0.0001}
                      value={isFinite(f.v) ? Number(f.v.toFixed(4)) : ""}
                      placeholder={fmt(f.ph)}
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        if (isNaN(v)) { if (f.k === "a0") setA0m(null); if (f.k === "b0") setB0m(null); if (f.k === "c0") setC0m(null); }
                        else f.set(v);
                      }}
                      className="mt-1 w-full h-10 rounded-xl bg-[#0a0a12] border border-white/10 text-sm font-bold text-white text-center focus:outline-none focus:border-violet-500/30"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-white/30">Modifiable • sync auto</span>
                <button onClick={() => { setA0m(null); setB0m(null); setC0m(null); setAutoSync(true); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-300 hover:text-white">
                  <RefreshCw className="h-3 w-3" /> Resync
                </button>
              </div>
            </div>

            {/* Vecteur S — 4 choix, design premium */}
            <div className="mt-4">
              <p className="text-[11px] font-bold tracking-widest text-white/50 flex items-center gap-1"><Target className="h-3.5 w-3.5 text-violet-300" /> VECTEUR (S)</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {S_OPTS.map(o => {
                  const active = eqS(S, o.v);
                  return (
                    <button key={o.label} onClick={() => setS(o.v)} className={`h-[64px] rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${active ? "bg-white text-[#0a0a12] border-white shadow-lg" : "bg-white/[0.06] text-white/70 border-white/[0.08] hover:bg-white/[0.10]"}`}>
                      <span className={`h-6 w-6 rounded-lg grid place-items-center text-[11px] font-black ${active ? "bg-[#0a0a12] text-white" : "bg-white/10 text-white"}`}>{o.letter}</span>
                      <span className="text-[11px] font-bold leading-none">{o.label}</span>
                      <span className="text-[10px] opacity-60">{o.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NCA + FS + BUDGET — résumé clair */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-[#0a0a12] border border-white/[0.06] p-3 text-center">
                <p className="text-[10px] font-bold tracking-widest text-white/35">NCA</p>
                <p className="mt-1 text-[14px] font-extrabold font-mono text-white">{fmt2(NCA)}</p>
                <p className="text-[10px] text-white/25">x·a0 selon S</p>
              </div>
              <label className="rounded-2xl bg-[#0a0a12] border border-white/[0.06] p-3 text-center">
                <p className="text-[10px] font-bold tracking-widest text-white/35">FS</p>
                <input type="number" value={FS} onChange={e => setFS(parseFloat(e.target.value) || 0)} className="mt-1 w-full bg-transparent text-center text-[14px] font-extrabold font-mono text-white focus:outline-none" />
                <p className="text-[10px] text-white/25">fond supp.</p>
              </label>
              <div className="rounded-2xl border p-3 text-center" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(217,70,239,0.15))", borderColor: "rgba(139,92,246,0.25)" }}>
                <p className="text-[10px] font-bold tracking-widest text-violet-200">BUDGET</p>
                <p className="mt-1 text-[14px] font-extrabold font-mono text-white">{fmt2(BUDGET)}</p>
                <p className="text-[10px] text-violet-200/70">NCA + FS</p>
              </div>
            </div>
          </div>
        </div>

        {/* 02 — ETAPE D'ECHELLE */}
        <div className="rounded-[22px] bg-[#11111d] border border-white/[0.07] overflow-hidden shadow-2xl">
          <div className="h-[1px] bg-gradient-to-r from-cyan-500/40 via-violet-500/30 to-transparent" />
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl grid place-items-center text-xs font-black text-white shadow" style={{ background: "linear-gradient(135deg,#06b6d4,#8b5cf6)" }}>02</div>
              <div>
                <h3 className="text-[14px] font-extrabold text-white leading-none">ÉTAPE D’ÉCHELLE</h3>
                <p className="text-xs text-white/40 mt-1">Incrémentation & résultats</p>
              </div>
            </div>

            {/* u v w */}
            <div className="mt-4">
              <p className="text-[11px] font-bold tracking-widest text-white/50 flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-cyan-300" /> NOUVELLES CÔTES (u, v, w)</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { k: "u", v: u, set: setU },
                  { k: "v", v: v, set: setV },
                  { k: "w", v: w, set: setW },
                ].map(f => (
                  <label key={f.k}>
                    <span className="text-[11px] font-bold tracking-widest text-white/50 text-center block">{f.k}</span>
                    <input type="number" step={0.01} value={f.v} onChange={e => f.set(parseFloat(e.target.value) || 0)} className="mt-1 w-full h-10 rounded-xl bg-[#0a0a12] border border-white/10 text-sm font-bold text-white text-center focus:outline-none focus:border-cyan-500/40" />
                  </label>
                ))}
              </div>
            </div>

            {/* Allocations */}
            <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-cyan-300" />
                <p className="text-[11px] font-bold tracking-widest text-white/60">ALLOCATIONS (a1, b1, c1)</p>
                <span className="ml-auto text-[11px] font-mono text-white/30">S=({S.join(", ")})</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { k: "a1", v: alloc.a1 },
                  { k: "b1", v: alloc.b1 },
                  { k: "c1", v: alloc.c1 },
                ].map(f => (
                  <div key={f.k} className="rounded-xl bg-[#0a0a12] border border-white/[0.06] p-3 text-center">
                    <p className="text-[10px] font-bold tracking-widest text-white/35">{f.k}</p>
                    <p className="mt-1 text-[14px] font-extrabold font-mono text-white">{fmt(f.v)}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] font-medium text-white/30">
                Logique conditionnelle • ex: S=(1,0,0) → a1=a0, b1=max(b0,…), c1=BUDGET−a1−b1
              </p>
            </div>

            {/* Résultats */}
            <div className="mt-4">
              <p className="text-[11px] font-bold tracking-widest text-white/50 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-emerald-300" /> RÉSULTATS PRODUITS</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { k: "a1·u", v: prod.j1 },
                  { k: "b1·v", v: prod.j2 },
                  { k: "c1·w", v: prod.j3 },
                ].map(f => (
                  <div key={f.k} className="rounded-xl bg-[#0a0a12] border border-white/[0.06] p-3 text-center">
                    <p className="text-[10px] font-bold tracking-widest text-white/35">{f.k}</p>
                    <p className="mt-1 text-[14px] font-extrabold font-mono text-white">{fmt2(f.v)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 rounded-xl border p-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#8b5cf6,#d946ef)", borderColor: "rgba(255,255,255,0.15)" }}>
                <span className="text-[11px] font-bold tracking-widest text-white">SOMME TOTALE</span>
                <span className="text-[16px] font-extrabold font-mono text-white">{fmt2(prod.sum)}</span>
              </div>
              <p className="mt-1 text-center text-[10px] text-white/30">u·a1 + v·b1 + w·c1</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => { setCA(100); setX(1.85); setY(1.85); setZ(1.85); setFS(100); setS([1, 0, 0]); setU(1.75); setV(1.69); setW(1.85); setA0m(null); setB0m(null); setC0m(null); }} className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-white/80">
                <RefreshCw className="h-3.5 w-3.5" /> Réinitialiser
              </button>
              <button onClick={copy} className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-extrabold text-white" style={{ background: "linear-gradient(135deg,#8b5cf6,#d946ef)" }}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copié" : "Copier résumé"} <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 mx-auto max-w-[1120px] px-4 md:px-6 pb-8 text-center">
        <p className="text-[11px] font-medium text-white/25">© 2026 BetSteps • Design épuré • By <a href="https://wa.me/237656005125" className="text-violet-300 hover:text-white">wa.me/237656005125</a></p>
      </footer>
    </div>
  );
}
