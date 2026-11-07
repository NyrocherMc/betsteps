"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  Sparkles,
  TrendingUp,
  Layers,
  ArrowRightLeft,
  AlertTriangle,
  Copy,
  RefreshCw,
  Zap,
  BarChart3,
  Wallet,
  Target,
  ChevronRight,
  Info,
  Check,
  Activity,
  GitBranch,
  ShieldCheck,
} from "lucide-react";

// Types
type SVec = [1, 0, 0] | [0, 1, 0] | [0, 0, 1];

function formatFixed(n: number, d: number) {
  if (!isFinite(n)) return "—";
  return n.toFixed(d);
}
function toPct(n: number) {
  if (!isFinite(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

// Tooltip component
function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px] text-white/60 hover:bg-violet-500/20 hover:text-violet-300 transition-colors"
      >
        ?
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-xl bg-[#1a1a2e] border border-white/10 px-3 py-2.5 text-xs leading-relaxed text-white/80 shadow-2xl z-50">
          {text}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-[#1a1a2e] border-r border-b border-white/10" />
        </span>
      )}
    </span>
  );
}

export default function BetStepsPage() {
  // STEP 1 states
  const [CA, setCA] = useState<number>(100);
  const [x, setX] = useState<number>(1.85);
  const [y, setY] = useState<number>(1.6);
  const [z, setZ] = useState<number>(1.8);

  // STEP 2 states
  const [a0m, setA0m] = useState<number | null>(null); // manual override, null means synced
  const [b0m, setB0m] = useState<number | null>(null);
  const [c0m, setC0m] = useState<number | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  const [S, setS] = useState<SVec>([1, 0, 0]);
  const [u, setU] = useState<number>(1.75);
  const [v, setV] = useState<number>(1.69);
  const [w, setW] = useState<number>(1.85);

  // Total logic selector: R+CA vs stakes+CA
  const [r, setR] = useState<number>(0); // ajustement NCA — complète la formule tronquée NCA = (a0·x)+r
  const [totalMode, setTotalMode] = useState<"R+CA" | "Mises+CA">("R+CA");

  const [copied, setCopied] = useState(false);

  // STEP 1 calculations
  const inv_sum = useMemo(() => {
    if (x <= 0 || y <= 0 || z <= 0) return NaN;
    return 1 / x + 1 / y + 1 / z;
  }, [x, y, z]);

  const q = useMemo(() => {
    if (!isFinite(inv_sum) || inv_sum === 0) return NaN;
    return (1 / inv_sum - 1) * 100; // in percent
  }, [inv_sum]);

  const a0 = useMemo(() => {
    if (!isFinite(inv_sum) || inv_sum === 0 || CA <= 0 || x <= 0) return NaN;
    return CA / (x * inv_sum);
  }, [CA, x, inv_sum]);
  const b0 = useMemo(() => {
    if (!isFinite(inv_sum) || inv_sum === 0 || CA <= 0 || y <= 0) return NaN;
    return CA / (y * inv_sum);
  }, [CA, y, inv_sum]);
  const c0 = useMemo(() => {
    if (!isFinite(inv_sum) || inv_sum === 0 || CA <= 0 || z <= 0) return NaN;
    return CA / (z * inv_sum);
  }, [CA, z, inv_sum]);

  // Effective a0,b0,c0 used in step2 (either synced or manual)
  const ea0 = a0m !== null ? a0m : a0;
  const eb0 = b0m !== null ? b0m : b0;
  const ec0 = c0m !== null ? c0m : c0;

  // Auto sync effect when a0 changes and autoSync on
  useEffect(() => {
    if (autoSync) {
      setA0m(null);
      setB0m(null);
      setC0m(null);
    }
  }, [a0, b0, c0, autoSync]);

  // STEP 2 intermediate
  const J = useMemo(() => {
    return {
      j1: ea0 * x,
      j2: eb0 * y,
      j3: ec0 * z,
    };
  }, [ea0, eb0, ec0, x, y, z]);

  const R = useMemo(() => {
    if (!isFinite(J.j1) || !isFinite(J.j2) || !isFinite(J.j3)) return NaN;
    if (S[0] === 1) return J.j1;
    if (S[1] === 1) return J.j2;
    return J.j3;
  }, [J, S]);

  const NCA = useMemo(() => {
    if (!isFinite(R) || !isFinite(r)) return NaN;
    return R + r; // Généralisation de "NCA = (a0·x)+r" → NCA = R + r = (J·S) + r
  }, [R, r]);

  const totalBudget = useMemo(() => {
    if (!isFinite(NCA) || !isFinite(CA)) return NaN;
    if (totalMode === "R+CA") return NCA + CA; // = R + r + CA  (strictement "NCA+CA")
    const sumStakes = ea0 + eb0 + ec0;
    if (!isFinite(sumStakes)) return NaN;
    return sumStakes + CA;
  }, [NCA, CA, totalMode, ea0, eb0, ec0]);

  // Allocation a1,b1,c1
  const allocation = useMemo(() => {
    if (!isFinite(ea0) || !isFinite(eb0) || !isFinite(ec0) || !isFinite(totalBudget) || !isFinite(R)) {
      return { a1: NaN, b1: NaN, c1: NaN };
    }
    if (u <= 0 || v <= 0 || w <= 0) return { a1: NaN, b1: NaN, c1: NaN };

    let a1 = NaN, b1 = NaN, c1 = NaN;

    if (S[0] === 1) {
      a1 = ea0;
      b1 = Math.max(eb0, (eb0 * y) / v);
      c1 = totalBudget - a1 - b1;
    } else if (S[1] === 1) {
      b1 = eb0;
      c1 = Math.max(ec0, (ec0 * z) / w);
      a1 = totalBudget - b1 - c1;
    } else {
      c1 = ec0;
      a1 = Math.max(ea0, (ea0 * x) / u);
      b1 = totalBudget - a1 - c1;
    }
    return { a1, b1, c1 };
  }, [ea0, eb0, ec0, totalBudget, R, S, u, v, w, x, y, z]);

  const fondSupp = useMemo(() => {
    if (!isFinite(allocation.a1) || !isFinite(allocation.b1) || !isFinite(allocation.c1) || !isFinite(R)) return NaN;
    return allocation.a1 + allocation.b1 + allocation.c1 - R;
  }, [allocation, R]);

  const products = useMemo(() => {
    const p1 = allocation.a1 * u;
    const p2 = allocation.b1 * v;
    const p3 = allocation.c1 * w;
    const sum = p1 + p2 + p3;
    return { p1, p2, p3, sum };
  }, [allocation, u, v, w]);

  const hasErrorS1 = x <= 0 || y <= 0 || z <= 0 || CA <= 0;
  const hasErrorS2 = u <= 0 || v <= 0 || w <= 0;

  const qColor = q < 0 ? "text-[#ff4d6a]" : q > 0 ? "text-emerald-400" : "text-amber-400";

  const copyResults = () => {
    const txt = `BetSteps — Résultats
STEP 1: CA=${CA}, x=${x}, y=${y}, z=${z}
inv_sum=${formatFixed(inv_sum, 6)}, q=${toPct(q)}
a0=${formatFixed(a0,4)}, b0=${formatFixed(b0,4)}, c0=${formatFixed(c0,4)}

STEP 2: S=(${S.join(",")}), u=${u}, v=${v}, w=${w}
a0=${formatFixed(ea0,4)}, b0=${formatFixed(eb0,4)}, c0=${formatFixed(ec0,4)}
J=(${formatFixed(J.j1,2)}, ${formatFixed(J.j2,2)}, ${formatFixed(J.j3,2)}), R=${formatFixed(R,2)}
Total=${formatFixed(totalBudget,2)} (mode ${totalMode})
a1=${formatFixed(allocation.a1,4)}, b1=${formatFixed(allocation.b1,4)}, c1=${formatFixed(allocation.c1,4)}
Fond supplémentaire=${formatFixed(fondSupp,4)}
a1·u=${formatFixed(products.p1,2)}, b1·v=${formatFixed(products.p2,2)}, c1·w=${formatFixed(products.p3,2)}, somme=${formatFixed(products.sum,2)}
`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#06060d] relative">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,_rgba(217,70,239,0.08),transparent_70%)] blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 sticky top-0 backdrop-blur-xl bg-[#06060d]/60 border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-violet flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-extrabold tracking-tight leading-none flex items-center gap-2" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
                <span className="text-white">Bet</span>
                <span className="text-gradient">Steps</span>
                <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-white/70">BETA</span>
              </h1>
              <p className="text-[11px] font-medium text-white/40 tracking-wide -mt-0.5">CALCULATEUR SÉQUENTIEL • 2 ÉTAPES</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.06] px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-white/70">Live • Synchro temps réel</span>
            </div>
            <button
              onClick={copyResults}
              className="inline-flex items-center gap-2 rounded-full bg-white text-[#0a0a12] px-4 py-1.5 text-xs font-semibold hover:bg-white/90 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copié !" : "Exporter"}
            </button>
          </div>

          <button onClick={copyResults} className="md:hidden rounded-full bg-white p-2.5 text-[#0a0a12]">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="relative z-10 mx-auto max-w-[1280px] px-4 md:px-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">

          {/* STEP 1 */}
          <div className="group relative overflow-hidden rounded-[24px] bg-[#0f0f18] border border-white/[0.07] shadow-2xl">
            <div className="absolute inset-0 opacity-60">
              <div className="absolute -top-24 -left-24 h-[320px] w-[320px] rounded-full bg-violet-600/20 blur-[60px]" />
              <div className="absolute -bottom-20 -right-20 h-[260px] w-[260px] rounded-full bg-fuchsia-600/10 blur-[60px]" />
            </div>
            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />

            <div className="relative p-5 md:p-6">
              {/* step header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-violet flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <span className="text-sm font-extrabold text-white">01</span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold leading-none text-white flex items-center gap-2">
                      ÉTAPE 1 <span className="hidden sm:inline text-white/30 font-medium">— Entrées & calculs de base</span>
                    </h3>
                    <p className="text-xs text-white/45 mt-1">Capital et cotes marché • inverse & répartition</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1.5">
                  <Calculator className="h-3.5 w-3.5 text-violet-300" />
                  <span className="text-xs font-semibold text-white/70">Calcul auto</span>
                </div>
              </div>

              {/* inputs */}
              <div className="mt-5 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-lg bg-violet-500/15 flex items-center justify-center border border-violet-500/20">
                    <Wallet className="h-3.5 w-3.5 text-violet-300" />
                  </div>
                  <p className="text-xs font-bold tracking-widest text-white/60">ENTRÉES MANUELLES</p>
                  {(hasErrorS1) && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300"><AlertTriangle className="h-3 w-3" /> Vérifie les valeurs</span>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="col-span-2 sm:col-span-1 group/label">
                    <span className="text-[11px] font-semibold tracking-widest text-white/50 flex items-center">
                      CA &nbsp;<span className="text-white/25 font-normal normal-case tracking-normal">(Capital additionnel)</span>
                      <Tooltip text="Capital de référence à répartir. Doit être > 0. Exemple par défaut: 100" />
                    </span>
                    <div className="mt-1.5 relative">
                      <input
                        type="number"
                        value={CA}
                        min={0}
                        step={1}
                        onChange={(e) => setCA(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl bg-[#0a0a12] border border-white/10 px-3.5 py-2.5 pr-10 text-sm font-mono font-semibold text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-white/30">€</span>
                    </div>
                  </label>

                  <div className="col-span-2 sm:col-span-1 grid grid-cols-3 gap-2">
                    {[
                      { label: "x", value: x, setter: setX, color: "violet" },
                      { label: "y", value: y, setter: setY, color: "fuchsia" },
                      { label: "z", value: z, setter: setZ, color: "cyan" },
                    ].map((f) => (
                      <label key={f.label}>
                        <span className="text-[11px] font-bold tracking-widest text-white/60">{f.label}</span>
                        <input
                          type="number"
                          value={f.value}
                          min={0.01}
                          step={0.01}
                          onChange={(e) => f.setter(parseFloat(e.target.value) || 0)}
                          className="mt-1.5 w-full rounded-xl bg-[#0a0a12] border border-white/10 px-2.5 py-2.5 text-sm font-mono font-semibold text-white text-center focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 via-fuchsia-600/15 to-pink-600/20 border border-violet-500/20 p-[1px]">
                  <div className="rounded-[15px] bg-[#0f0f18] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold tracking-widest text-white/70 flex items-center gap-2">
                        <GitBranch className="h-3.5 w-3.5 text-violet-300" /> TRIPLET (a0, b0, c0)
                      </p>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-mono font-semibold text-white/60">Σ = {formatFixed(a0 + b0 + c0, 2)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { k: "a0", v: a0, sub: "CA / (x·inv_sum)", col: "from-violet-500 to-purple-500" },
                        { k: "b0", v: b0, sub: "CA / (y·inv_sum)", col: "from-fuchsia-500 to-pink-500" },
                        { k: "c0", v: c0, sub: "CA / (z·inv_sum)", col: "from-cyan-500 to-blue-500" },
                      ].map((it) => (
                        <div key={it.k} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
                          <p className="text-[11px] font-bold tracking-widest text-white/50">{it.k}</p>
                          <p className="mt-1 font-mono text-[15px] font-extrabold text-white">{formatFixed(it.v, 4)}</p>
                          <p className="text-[10px] text-white/25 mt-1 leading-none">{it.sub}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-center text-[11px] text-white/30">
                      Répartition optimale du capital — synchronisée en temps réel vers l’étape 2 {autoSync ? "✅" : "⏸️"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="relative overflow-hidden rounded-[24px] bg-[#0f0f18] border border-white/[0.07] shadow-2xl">
            <div className="absolute inset-0 opacity-60">
              <div className="absolute -top-24 -right-24 h-[320px] w-[320px] rounded-full bg-cyan-600/15 blur-[60px]" />
              <div className="absolute -bottom-20 -left-20 h-[260px] w-[260px] rounded-full bg-violet-600/10 blur-[60px]" />
            </div>
            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

            <div className="relative p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    <span className="text-sm font-extrabold text-white">02</span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold leading-none text-white flex items-center gap-2">
                      ÉTAPE 2 <span className="hidden sm:inline text-white/30 font-medium">— Échelle & optimisation</span>
                    </h3>
                    <p className="text-xs text-white/45 mt-1">Vecteur S • nouvelles cotes • allocation conditionnelle</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAutoSync(!autoSync);
                    if (!autoSync) { setA0m(null); setB0m(null); setC0m(null); }
                  }}
                  className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${autoSync ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-300" : "bg-white/5 border-white/10 text-white/60"}`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${autoSync ? "animate-spin" : ""}`} style={{ animationDuration: autoSync ? "3s" : undefined }} />
                  {autoSync ? "Synchro auto" : "Manuel"}
                </button>
              </div>

              {/* Vecteur S selector */}
              <div className="mt-4">
                <p className="text-xs font-bold tracking-widest text-white/60 flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-fuchsia-300" /> VECTEUR S
                  <Tooltip text="Choisis le scénario gagnant. S=(1,0,0) signifie le pari x est gagnant. Le calcul s’adapte : on fige a1=a0 et on optimise b1, c1 pour compléter le budget." />
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { id: "1,0,0", label: "(1, 0, 0)", sub: "Favori x", icon: "X" },
                    { id: "0,1,0", label: "(0, 1, 0)", sub: "Favori y", icon: "Y" },
                    { id: "0,0,1", label: "(0, 0, 1)", sub: "Favori z", icon: "Z" },
                  ].map((opt) => {
                    const isActive = (S.join(",") === opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (opt.id === "1,0,0") setS([1, 0, 0]);
                          if (opt.id === "0,1,0") setS([0, 1, 0]);
                          if (opt.id === "0,0,1") setS([0, 0, 1]);
                        }}
                        className={`relative rounded-2xl p-3 text-left border transition-all overflow-hidden group/btn ${isActive
                          ? "bg-gradient-violet border-violet-500/30 shadow-lg shadow-violet-500/20"
                          : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
                          }`}
                      >
                        {isActive && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />}
                        <div className="relative flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-extrabold border ${isActive ? "bg-white text-violet-600 border-white" : "bg-white/5 text-white/60 border-white/10 group-hover/btn:bg-white/10"}`}>{opt.icon}</div>
                          <div>
                            <p className={`text-xs font-bold font-mono leading-none ${isActive ? "text-white" : "text-white/80"}`}>{opt.label}</p>
                            <p className={`text-[11px] ${isActive ? "text-white/80" : "text-white/40"}`}>{opt.sub}</p>
                          </div>
                          {isActive && <Check className="ml-auto h-4 w-4 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nouvelles cotes - avant Allocation */}
              <div className="mt-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/20 flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-fuchsia-300" />
                  </div>
                  <p className="text-xs font-bold tracking-widest text-white/60">NOUVELLES COTES (u, v, w)</p>
                  {hasErrorS2 && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300"><AlertTriangle className="h-3 w-3" /> &gt;0 requis</span>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { l: "u", v: u, s: setU },
                    { l: "v", v: v, s: setV },
                    { l: "w", v: w, s: setW },
                  ].map((f) => (
                    <label key={f.l}>
                      <span className="text-[11px] font-bold tracking-widest text-white/60 text-center block">{f.l}</span>
                      <input
                        type="number"
                        value={f.v}
                        min={0.01}
                        step={0.01}
                        onChange={(e) => f.s(parseFloat(e.target.value) || 0)}
                        className="mt-1.5 w-full rounded-xl bg-[#0a0a12] border border-white/10 px-2 py-2.5 text-sm font-mono font-semibold text-white text-center focus:outline-none focus:border-fuchsia-500/50 focus:ring-4 focus:ring-fuchsia-500/10 transition-all"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-3">
                <div>
                  <p className="text-[11px] font-bold tracking-widest text-emerald-300/80">FOND SUPPLÉMENTAIRE</p>
                  <p className="text-[11px] text-emerald-200/60">(a1+b1+c1) − R</p>
                </div>
                <p className="font-mono text-[18px] font-extrabold text-emerald-300">{formatFixed(fondSupp, 4)}</p>
              </div>

              {/* Allocation results */}
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-cyan-600/20 via-violet-600/15 to-fuchsia-600/15 border border-cyan-500/20 p-[1px]">
                <div className="rounded-[15px] bg-[#0f0f18] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold tracking-widest text-white/70 flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5 text-cyan-300" /> ALLOCATION (a1,b1,c1)
                    </p>
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/20 px-2.5 py-1 text-[11px] font-medium text-cyan-200">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conditionnel S
                    </span>
                  </div>

                  {/* formula explain */}
                  <div className="mt-3 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
                    <p className="text-[11px] font-semibold tracking-wide text-white/50">LOGIQUE CONDITIONNELLE</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/70 font-mono">
                      {S[0] === 1 && <>S=(1,0,0) → <span className="text-cyan-300">a1=a0</span>, b1=max(b0, b0·y/v), c1=Total−a1−b1</>}
                      {S[1] === 1 && <>S=(0,1,0) → <span className="text-cyan-300">b1=b0</span>, c1=max(c0, c0·z/w), a1=Total−b1−c1</>}
                      {S[2] === 1 && <>S=(0,0,1) → <span className="text-cyan-300">c1=c0</span>, a1=max(a0, a0·x/u), b1=Total−a1−c1</>}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { k: "a1", v: allocation.a1, color: "violet" },
                      { k: "b1", v: allocation.b1, color: "fuchsia" },
                      { k: "c1", v: allocation.c1, color: "cyan" },
                    ].map((it) => (
                      <div key={it.k} className="rounded-xl bg-[#0a0a12] border border-white/[0.06] p-3 text-center relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <p className="text-[11px] font-bold tracking-widest text-white/50">{it.k}</p>
                        <p className="mt-1 font-mono text-[15px] font-extrabold text-white">{formatFixed(it.v, 4)}</p>
                        <div className="mt-1.5 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-gradient-violet" style={{ width: `${Math.min(100, Math.max(6, (it.v / (allocation.a1 + allocation.b1 + allocation.c1)) * 100 || 0))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="rounded-2xl bg-[#0a0a12] border border-white/[0.06] p-4">
                  <p className="text-xs font-bold tracking-widest text-white/60 flex items-center gap-2">
                    <Calculator className="h-3.5 w-3.5 text-emerald-300" /> RÉSULTATS PRODUITS
                  </p>
                  <div className="mt-3 space-y-2">
                    {[
                      { k: "a1 · u", v: products.p1, c: "violet" },
                      { k: "b1 · v", v: products.p2, c: "fuchsia" },
                      { k: "c1 · w", v: products.p3, c: "cyan" },
                    ].map((r) => (
                      <div key={r.k} className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.05] px-3.5 py-2.5">
                        <span className="text-xs font-mono font-semibold text-white/60">{r.k}</span>
                        <span className="font-mono text-sm font-bold text-white">{formatFixed(r.v, 2)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-xl bg-gradient-violet px-3.5 py-3 shadow-lg shadow-violet-500/20">
                      <span className="text-xs font-bold tracking-widest text-white">SOMME TOTALE</span>
                      <span className="font-mono text-[15px] font-extrabold text-white">{formatFixed(products.sum, 2)}</span>
                    </div>
                    <p className="text-center text-[11px] text-white/30">a1·u + b1·v + c1·w</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-5 flex flex-col md:flex-row items-center justify-between gap-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl px-4 py-3">
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Prêt pour Vercel • Next.js 14 • App Router • TypeScript • Tailwind
            </span>
            <span className="sm:hidden text-center">Prêt pour Vercel • Deploy en 1 clic</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCA(100); setX(1.85); setY(1.6); setZ(1.8);
                setU(1.75); setV(1.69); setW(1.85); setR(0);
                setS([1, 0, 0]); setA0m(null); setB0m(null); setC0m(null); setAutoSync(true); setTotalMode("R+CA");
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Réinitialiser valeurs par défaut
            </button>
            <button onClick={copyResults} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-violet px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:opacity-95 transition-opacity">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copié !" : "Copier résumé"} <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          © 2026 by <a href="https://wa.me/237656005125" target="_blank" rel="noopener noreferrer" className="text-violet-300 hover:text-white underline decoration-white/20 underline-offset-4">https://wa.me/237656005125</a>
        </p>
      </div>
    </div>
  );
}
