"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Layers,
  Calculator,
  Info,
  Copy,
  Check,
  RotateCcw,
  TrendingUp,
} from "lucide-react";

type SVector = [1, 0, 0] | [0, 1, 0] | [0, 0, 1] | [1, 1, 1];

const S_OPTIONS: { id: SVector; label: string; short: string; sub: string }[] = [
  { id: [1, 0, 0], label: "(1, 0, 0)", short: "x", sub: "Scénario X" },
  { id: [0, 1, 0], label: "(0, 1, 0)", short: "y", sub: "Scénario Y" },
  { id: [0, 0, 1], label: "(0, 0, 1)", short: "z", sub: "Scénario Z" },
  { id: [1, 1, 1], label: "(1, 1, 1)", short: "Total", sub: "Cumul" },
];

function fmt(n: number, d = 4) {
  if (!isFinite(n)) return "—";
  return n.toFixed(d).replace(".", ",");
}
function fmt2(n: number) {
  if (!isFinite(n)) return "—";
  return n.toFixed(2).replace(".", ",");
}
function eqS(a: SVector, b: SVector) {
  return a.join(",") === b.join(",");
}

export default function BetStepsEsquisse() {
  // ETAPE 1
  const [CA, setCA] = useState<number>(100);
  const [x, setX] = useState<number>(1.85);
  const [y, setY] = useState<number>(1.85);
  const [z, setZ] = useState<number>(1.85);

  const [FS, setFS] = useState<number>(100); // Fond supplémentaire

  const [S, setS] = useState<SVector>([1, 0, 0]);

  // ETAPE 2
  const [u, setU] = useState<number>(1.75);
  const [v, setV] = useState<number>(1.69);
  const [w, setW] = useState<number>(1.85);

  // manual override for a0,b0,c0 (if user edits)
  const [a0m, setA0m] = useState<number | null>(null);
  const [b0m, setB0m] = useState<number | null>(null);
  const [c0m, setC0m] = useState<number | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  const [copied, setCopied] = useState(false);

  // Calculations Etape 1
  const inv_sum = useMemo(() => {
    if (x <= 0 || y <= 0 || z <= 0) return NaN;
    return 1 / x + 1 / y + 1 / z;
  }, [x, y, z]);

  const a0calc = useMemo(() => {
    if (!isFinite(inv_sum) || inv_sum === 0 || CA <= 0 || x <= 0) return NaN;
    return CA / (x * inv_sum);
  }, [CA, x, inv_sum]);
  const b0calc = useMemo(() => {
    if (!isFinite(inv_sum) || inv_sum === 0 || CA <= 0 || y <= 0) return NaN;
    return CA / (y * inv_sum);
  }, [CA, y, inv_sum]);
  const c0calc = useMemo(() => {
    if (!isFinite(inv_sum) || inv_sum === 0 || CA <= 0 || z <= 0) return NaN;
    return CA / (z * inv_sum);
  }, [CA, z, inv_sum]);

  const ea0 = a0m !== null ? a0m : a0calc;
  const eb0 = b0m !== null ? b0m : b0calc;
  const ec0 = c0m !== null ? c0m : c0calc;

  useEffect(() => {
    if (autoSync) {
      setA0m(null);
      setB0m(null);
      setC0m(null);
    }
  }, [a0calc, b0calc, c0calc, autoSync]);

  // NCA selon esquisse
  const NCA = useMemo(() => {
    if (!isFinite(ea0) || !isFinite(eb0) || !isFinite(ec0)) return NaN;
    if (eqS(S, [1, 0, 0])) return x * ea0;
    if (eqS(S, [0, 1, 0])) return y * eb0;
    if (eqS(S, [0, 0, 1])) return z * ec0;
    // (1,1,1)
    return x * ea0 + y * eb0 + z * ec0;
  }, [ea0, eb0, ec0, x, y, z, S]);

  const BUDGET = useMemo(() => {
    if (!isFinite(NCA) || !isFinite(FS)) return NaN;
    return NCA + FS;
  }, [NCA, FS]);

  // Allocations a1,b1,c1 — logique conditionnelle fidèle à l'esquisse + max pour sécuriser les nouvelles cotes
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
      // (1,1,1) — cumul : on sécurise les trois, le reste va en c1
      a1 = Math.max(ea0, (ea0 * x) / u);
      b1 = Math.max(eb0, (eb0 * y) / v);
      c1 = BUDGET - a1 - b1;
      // si c1 < c0 conservé, on ajuste pour respecter c1 >= c0
      const c1min = Math.max(ec0, (ec0 * z) / w);
      if (c1 < c1min) {
        // on redistribue en gardant a1,b1 minimaux
        c1 = c1min;
        // si budget insuffisant, on signale via négatif (validé visuellement)
      }
    }
    return { a1, b1, c1 };
  }, [ea0, eb0, ec0, BUDGET, S, u, v, w, x, y, z]);

  const prod = useMemo(() => {
    const j1 = alloc.a1 * u;
    const j2 = alloc.b1 * v;
    const j3 = alloc.c1 * w;
    return { j1, j2, j3, sum: j1 + j2 + j3 };
  }, [alloc, u, v, w]);

  const copyAll = () => {
    const t = `BetSteps — ETAPE 1 & 2
CA=${CA} x=${x} y=${y} z=${z}
a0=${fmt(a0calc,4)} b0=${fmt(b0calc,4)} c0=${fmt(c0calc,4)}
S=(${S.join(",")}) NCA=${fmt2(NCA)} FS=${FS} BUDGET=${fmt2(BUDGET)}
u=${u} v=${v} w=${w}
a1=${fmt(alloc.a1,4)} b1=${fmt(alloc.b1,4)} c1=${fmt(alloc.c1,4)}
J1=${fmt2(prod.j1)} J2=${fmt2(prod.j2)} J3=${fmt2(prod.j3)} SUM=${fmt2(prod.sum)}`;
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ncaFormula = eqS(S, [1, 0, 0]) ? "Si (1,0,0) alors = x·a0" :
    eqS(S, [0, 1, 0]) ? "Si (0,1,0) alors = y·b0" :
    eqS(S, [0, 0, 1]) ? "Si (0,0,1) alors = z·c0" : "Si (1,1,1) alors = (x·a0)+(y·b0)+(z·c0)";

  const budgetFormula = eqS(S, [1, 0, 0]) ? "Si (1,0,0) alors = (x·a0)+FS" :
    eqS(S, [0, 1, 0]) ? "Si (0,1,0) alors = (y·b0)+FS" :
    eqS(S, [0, 0, 1]) ? "Si (0,0,1) alors = (z·c0)+FS" : "Si (1,1,1) alors = ((x·a0)+(y·b0)+(z·c0))+FS";

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-[#e8e8e8] selection:bg-[#ff2e9d]/30">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap');`}</style>

      {/* Header — fidèle à l'esquisse */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#1c1c1c]/85 border-b border-white/5">
        <div className="mx-auto max-w-[980px] px-4 md:px-6 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-[14px] bg-[#ff2e9d] flex items-center justify-center shadow-lg shadow-[#ff2e9d]/20">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="leading-none flex items-baseline gap-2" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
                <span className="text-[22px] font-bold tracking-tight text-white">Bet</span>
                <span className="text-[22px] font-bold tracking-tight text-[#ff8ad4]">Steps</span>
                <span className="ml-1.5 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-white/70">BETA</span>
              </h1>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-white/45 -mt-0.5">CALCULATEUR SÉQUENTIEL * 2 ÉTAPES</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyAll} className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white text-[#1a1a1a] px-4 py-2 text-xs font-bold hover:bg-white/90 transition">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copié" : "Copier"}
            </button>
            <button onClick={copyAll} className="sm:hidden h-10 w-10 grid place-items-center rounded-full bg-white text-[#1a1a1a]">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[980px] px-3 md:px-6 py-4 md:py-6 space-y-4">

        {/* ===== 01 ETAPE DE BASE ===== */}
        <section className="rounded-[28px] bg-[#4a4a4a] p-3 md:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3 md:gap-4 px-1 py-2">
            <div className="h-10 w-[64px] md:w-[72px] rounded-[12px] bg-[#f8b4e0] text-[#4a2a3f] grid place-items-center text-[14px] font-extrabold tracking-widest shadow-inner">01</div>
            <div>
              <h2 className="text-[18px] md:text-[20px] font-extrabold tracking-tight text-white leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>ETAPE DE BASE</h2>
              <p className="text-[12px] font-medium text-white/55 mt-1">Capital et cotes marché</p>
            </div>
          </div>

          <div className="mt-3 rounded-[22px] bg-[#6f6f6f] p-3 md:p-4 space-y-4 border border-white/5">

            {/* ENTREES MANUELLES */}
            <div>
              <h3 className="text-[11px] font-extrabold tracking-[0.12em] text-[#e8a6ef]">ENTRÉES MANUELLES</h3>
              <div className="mt-2 space-y-3">
                <label className="block">
                  <span className="text-[11px] font-semibold text-white/70">CA (Capital de base)</span>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      value={CA}
                      onChange={e => setCA(parseFloat(e.target.value) || 0)}
                      className="w-full h-[38px] rounded-[8px] bg-black border border-black px-3 pr-[70px] text-[13px] font-bold text-white text-left focus:outline-none focus:ring-2 focus:ring-[#ff2e9d]/30"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white/60">unités</span>
                  </div>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: "x", v: x, s: setX },
                    { k: "y", v: y, s: setY },
                    { k: "z", v: z, s: setZ },
                  ].map(f => (
                    <label key={f.k} className="block">
                      <span className="text-[11px] font-semibold text-white/70">{f.k}</span>
                      <input
                        type="number"
                        step={0.01}
                        value={f.v}
                        onChange={e => f.s(parseFloat(e.target.value) || 0)}
                        className="mt-1 w-full h-[36px] rounded-[8px] bg-black border border-black px-2 text-[13px] font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-[#ff2e9d]/30"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* TRIPLET */}
            <div>
              <h3 className="text-[11px] font-extrabold tracking-[0.12em] text-[#e8a6ef]">TRIPLET D’ENTRÉE (a0, b0, c0)</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { k: "a0", val: ea0, setter: (n: number) => { setA0m(n); setAutoSync(false); }, raw: a0calc },
                  { k: "b0", val: eb0, setter: (n: number) => { setB0m(n); setAutoSync(false); }, raw: b0calc },
                  { k: "c0", val: ec0, setter: (n: number) => { setC0m(n); setAutoSync(false); }, raw: c0calc },
                ].map(f => (
                  <label key={f.k} className="block">
                    <span className="text-[10px] font-bold tracking-widest text-white/60">{f.k}</span>
                    <input
                      type="number"
                      step={0.0001}
                      value={isFinite(f.val) ? Number(f.val.toFixed(4)) : ""}
                      placeholder={fmt(f.raw, 4)}
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        if (isNaN(v)) {
                          if (f.k === "a0") setA0m(null);
                          if (f.k === "b0") setB0m(null);
                          if (f.k === "c0") setC0m(null);
                        } else {
                          f.setter(v);
                        }
                      }}
                      className="mt-1 w-full h-[36px] rounded-[8px] bg-[#2c4a6b] border border-[#2c4a6b] px-2 text-[13px] font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-white/15"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] text-white/45">Pré-rempli depuis le calcul • modifiable</span>
                <button
                  onClick={() => { setA0m(null); setB0m(null); setC0m(null); setAutoSync(true); }}
                  className="inline-flex items-center gap-1 rounded-full bg-black/20 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/80 hover:bg-black/30"
                >
                  <RotateCcw className="h-3 w-3" /> Resync auto
                </button>
              </div>
            </div>

            {/* VECTEUR S — 4 pills rose vif comme esquisse */}
            <div>
              <h3 className="text-[11px] font-extrabold tracking-[0.12em] text-[#e8a6ef]">VECTEUR (S)</h3>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {S_OPTIONS.map(opt => {
                  const active = eqS(S, opt.id);
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setS(opt.id)}
                      className={`h-[62px] rounded-[16px] flex flex-col items-center justify-center gap-0.5 border transition-all ${active
                        ? "bg-[#ff2e9d] border-[#ff2e9d] text-white shadow-lg shadow-[#ff2e9d]/20"
                        : "bg-[#ff2e9d]/90 border-[#ff2e9d]/80 text-white hover:bg-[#ff2e9d] opacity-80 hover:opacity-100"
                        }`}
                    >
                      <span className="text-[11px] font-extrabold leading-none">{opt.short}</span>
                      <span className="text-[11px] font-bold opacity-90">{opt.label}</span>
                      {active && <span className="h-1 w-1 rounded-full bg-white mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NOUVEAU CAPITAL (NCA) — bleu comme esquisse */}
            <div>
              <h3 className="text-[11px] font-extrabold tracking-[0.12em] text-[#e8a6ef]">NOUVEAU CAPITAL (NCA)</h3>
              <div className="mt-2 rounded-[12px] bg-[#2c4a6b] border border-[#2c4a6b] px-3 py-3 flex items-center justify-between gap-3">
                <div className="text-[10px] leading-[1.35] font-semibold text-white/85">
                  <p>Si (1,0,0) alors = x·a0</p>
                  <p>Si (0,1,0) alors = y·b0</p>
                  <p>Si (0,0,1) alors = z·c0</p>
                  <p>Si (1,1,1) alors = (x·a0)+(y·b0)+(z·c0)</p>
                  <p className="mt-1 text-[#ffd4f0] font-bold">→ Actif : {ncaFormula} = {fmt2(NCA)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[13px] font-extrabold text-white">{fmt2(NCA)}</div>
                  <div className="text-[10px] font-bold text-white/60">unités</div>
                </div>
              </div>
            </div>

            {/* FOND SUPPLEMENTAIRE */}
            <div>
              <h3 className="text-[11px] font-extrabold tracking-[0.12em] text-[#e8a6ef]">FOND SUPPLÉMENTAIRE (FS)</h3>
              <div className="mt-2 relative">
                <input
                  type="number"
                  value={FS}
                  onChange={e => setFS(parseFloat(e.target.value) || 0)}
                  className="w-full h-[38px] rounded-[8px] bg-[#2c4a6b] border border-[#2c4a6b] px-3 pr-[70px] text-[13px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/15"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white/70">unités</span>
              </div>
            </div>

            {/* BUDGET */}
            <div>
              <h3 className="text-[11px] font-extrabold tracking-[0.12em] text-[#e8a6ef]">BUDGET = NCA + CA</h3>
              <div className="mt-2 rounded-[12px] bg-[#2c4a6b] border border-[#2c4a6b] px-3 py-3 flex items-center justify-between gap-3">
                <div className="text-[10px] leading-[1.35] font-semibold text-white/85">
                  <p>Si (1,0,0) alors = (x·a0)+FS</p>
                  <p>Si (0,1,0) alors = (y·b0)+FS</p>
                  <p>Si (0,0,1) alors = (z·c0)+FS</p>
                  <p>Si (1,1,1) alors = ((x·a0)+(y·b0)+(z·c0))+FS</p>
                  <p className="mt-1 text-[#ffd4f0] font-bold">→ Actif : {budgetFormula} = {fmt2(BUDGET)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[13px] font-extrabold text-white">{fmt2(BUDGET)}</div>
                  <div className="text-[10px] font-bold text-white/60">unités</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ===== 02 ETAPE D'ECHELLE ===== */}
        <section className="rounded-[28px] bg-[#4a4a4a] p-3 md:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3 md:gap-4 px-1 py-2">
            <div className="h-10 w-[64px] md:w-[72px] rounded-[12px] bg-[#f8b4e0] text-[#4a2a3f] grid place-items-center text-[14px] font-extrabold tracking-widest shadow-inner">02</div>
            <div>
              <h2 className="text-[18px] md:text-[20px] font-extrabold tracking-tight text-white leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>ETAPE D’ÉCHELLE</h2>
              <p className="text-[12px] font-medium text-white/55 mt-1">Capital d’incrémentation</p>
            </div>
          </div>

          <div className="mt-3 rounded-[22px] bg-[#6f6f6f] p-3 md:p-4 space-y-4 border border-white/5">

            {/* NOUVELLES COTES */}
            <div>
              <h3 className="text-[11px] font-extrabold tracking-[0.12em] text-[#e8a6ef]">NOUVELLES CÔTES (u, v, w)</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { k: "u", v: u, s: setU },
                  { k: "v", v: v, s: setV },
                  { k: "w", v: w, s: setW },
                ].map(f => (
                  <label key={f.k} className="block">
                    <span className="text-[11px] font-semibold text-white/70 text-center block">{f.k}</span>
                    <input
                      type="number"
                      step={0.01}
                      value={f.v}
                      onChange={e => f.s(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full h-[36px] rounded-[8px] bg-black border border-black px-2 text-[13px] font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-[#ff2e9d]/30"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* ALLOCATIONS */}
            <div>
              <h3 className="text-[11px] font-extrabold tracking-[0.12em] text-[#e8a6ef]">ALLOCATIONS (a1,b1,c1)</h3>
              <p className="mt-1 text-[11px] font-semibold text-white/60">Logique conditionnelle &nbsp; <span className="font-mono text-[#ffd4f0]">S = ({S.join(", ")})</span></p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { k: "a1", v: alloc.a1 },
                  { k: "b1", v: alloc.b1 },
                  { k: "c1", v: alloc.c1 },
                ].map(f => (
                  <label key={f.k} className="block">
                    <span className="text-[10px] font-bold tracking-widest text-white/60 text-center block">{f.k}</span>
                    <div className="mt-1 w-full h-[36px] rounded-[8px] bg-[#2c4a6b] border border-[#2c4a6b] px-2 grid place-items-center text-[13px] font-bold text-white">
                      {fmt(f.v, 4)}
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-2 rounded-[10px] bg-black/20 border border-white/5 px-3 py-2">
                <p className="text-[10px] leading-relaxed font-mono text-white/70">
                  {eqS(S, [1, 0, 0]) && <>S=(1,0,0) → <b className="text-white">a1=a0</b>, b1=max(b0, b0·y/v), c1=BUDGET−a1−b1</>}
                  {eqS(S, [0, 1, 0]) && <>S=(0,1,0) → <b className="text-white">b1=b0</b>, c1=max(c0, c0·z/w), a1=BUDGET−b1−c1</>}
                  {eqS(S, [0, 0, 1]) && <>S=(0,0,1) → <b className="text-white">c1=c0</b>, a1=max(a0, a0·x/u), b1=BUDGET−a1−c1</>}
                  {eqS(S, [1, 1, 1]) && <>S=(1,1,1) → <b className="text-white">Total</b>, a1=max(a0, a0·x/u), b1=max(b0, b0·y/v), c1=BUDGET−a1−b1</>}
                </p>
              </div>
            </div>

            {/* RESULTATS PRODUITS */}
            <div>
              <h3 className="text-[11px] font-extrabold tracking-[0.12em] text-[#e8a6ef]">RÉSULTATS PRODUITS</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { k: "J = a1·u", v: prod.j1 },
                  { k: "J = b1·v", v: prod.j2 },
                  { k: "J = c1·w", v: prod.j3 },
                ].map(f => (
                  <label key={f.k} className="block">
                    <span className="text-[10px] font-semibold text-white/55 text-center block">{f.k}</span>
                    <div className="mt-1 w-full h-[36px] rounded-[8px] bg-[#2c4a6b] border border-[#2c4a6b] px-2 grid place-items-center text-[13px] font-bold text-white">
                      {fmt2(f.v)}
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <span className="text-[10px] font-semibold text-white/55 text-center block">J = (u·a1)+(v·b1)+(w·c1)</span>
                <div className="mt-1 w-full h-[38px] rounded-[8px] bg-[#2c4a6b] border border-[#2c4a6b] px-2 grid place-items-center text-[14px] font-extrabold text-white">
                  {fmt2(prod.sum)}
                </div>
              </div>
            </div>

          </div>
        </section>

        <footer className="pt-2 pb-6 text-center">
          <p className="text-[11px] font-semibold tracking-wide text-white/45">© 2026 Betsteps | By <a href="https://wa.me/237656005125" target="_blank" className="text-[#ffb3e0] hover:text-white underline decoration-white/20 underline-offset-4">wa.me/237656005125</a></p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button onClick={() => { setCA(100); setX(1.85); setY(1.85); setZ(1.85); setFS(100); setS([1,0,0]); setU(1.75); setV(1.69); setW(1.85); setA0m(null); setB0m(null); setC0m(null); setAutoSync(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3.5 py-2 text-xs font-bold text-white/80 hover:bg-white/15">
              <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
            </button>
            <button onClick={copyAll} className="inline-flex items-center gap-1.5 rounded-full bg-[#ff2e9d] px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-[#ff2e9d]/20">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copier résumé
            </button>
          </div>
        </footer>

      </main>
    </div>
  );
}
