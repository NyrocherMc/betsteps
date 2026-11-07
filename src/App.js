import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  PlusCircle, 
  RefreshCw,
  Zap,
  Percent,
  Sliders,
  Maximize2
} from 'lucide-react';

export default function App() {
  // ------------------------------------------------------------------
  // ÉTAPE 1 : États (Inputs)
  // ------------------------------------------------------------------
  const [ca, setCa] = useState(100);
  const [x, setX] = useState(1.85);
  const [y, setY] = useState(1.60);
  const [z, setZ] = useState(1.80);

  // ------------------------------------------------------------------
  // ÉTAPE 1 : Calculs
  // ------------------------------------------------------------------
  const step1Results = useMemo(() => {
    const numCA = parseFloat(ca) || 0;
    const numX = parseFloat(x) || 0.0001;
    const numY = parseFloat(y) || 0.0001;
    const numZ = parseFloat(z) || 0.0001;

    const invSum = (1 / numX) + (1 / numY) + (1 / numZ);
    const qMax = (1 / invSum) - 1;

    const a0 = numCA / (numX * invSum);
    const b0 = numCA / (numY * invSum);
    const c0 = numCA / (numZ * invSum);

    return {
      invSum,
      qMax,
      qPercent: (qMax * 100).toFixed(2),
      a0,
      b0,
      c0,
      isValid: numCA > 0 && numX > 0 && numY > 0 && numZ > 0
    };
  }, [ca, x, y, z]);

  // ------------------------------------------------------------------
  // ÉTAPE 2 : États (Inputs)
  // ------------------------------------------------------------------
  const [vectorS, setVectorS] = useState('1,0,0'); // '1,0,0' | '0,1,0' | '0,0,1'
  const [u, setU] = useState(1.75);
  const [v, setV] = useState(1.69);
  const [w, setW] = useState(1.85);

  // Synchronisation manuelle vs auto de (a0, b0, c0) dans l'étape 2
  const [overrideA0, setOverrideA0] = useState(null);
  const [overrideB0, setOverrideB0] = useState(null);
  const [overrideC0, setOverrideC0] = useState(null);

  const effectiveA0 = overrideA0 !== null ? parseFloat(overrideA0) || 0 : step1Results.a0;
  const effectiveB0 = overrideB0 !== null ? parseFloat(overrideB0) || 0 : step1Results.b0;
  const effectiveC0 = overrideC0 !== null ? parseFloat(overrideC0) || 0 : step1Results.c0;

  // Reset des dérogations si l'utilisateur veut réaligner sur l'étape 1
  const handleResetStep2ToStep1 = () => {
    setOverrideA0(null);
    setOverrideB0(null);
    setOverrideC0(null);
  };

  // ------------------------------------------------------------------
  // ÉTAPE 2 : Calculs & Optimisation Conditionnelle selon le Vecteur S
  // ------------------------------------------------------------------
  const step2Results = useMemo(() => {
    const numCA = parseFloat(ca) || 0;
    const numX = parseFloat(x) || 1.85;
    const numY = parseFloat(y) || 1.60;
    const numZ = parseFloat(z) || 1.80;
    const numU = parseFloat(u) || 1.75;
    const numV = parseFloat(v) || 1.69;
    const numW = parseFloat(w) || 1.85;

    const a0Val = effectiveA0;
    const b0Val = effectiveB0;
    const c0Val = effectiveC0;

    // Vecteur J = (a0*x, b0*y, c0*z)
    const J = {
      x: a0Val * numX,
      y: b0Val * numY,
      z: c0Val * numZ
    };

    // Produit scalaire R = J * S
    let R = 0;
    if (vectorS === '1,0,0') R = J.x;
    else if (vectorS === '0,1,0') R = J.y;
    else if (vectorS === '0,0,1') R = J.z;

    // Variables intermédiaires
    const r = Math.max(0, numCA - a0Val - b0Val - c0Val);
    const NCA = (a0Val * numX) + r;
    const totalRefCA = NCA + numCA; // NCA + CA

    // Allocation conditionnelle de (a1, b1, c1) selon la position de S
    let a1 = 0;
    let b1 = 0;
    let c1 = 0;

    if (vectorS === '1,0,0') {
      // 1. Quand S = (1, 0, 0) : a1 = a0
      a1 = a0Val;
      // b1 minimal pour respecter b1*v >= b0*y et b1 > b0
      const b1Min = Math.max(b0Val, (b0Val * numY) / numV);
      b1 = b1Min;
      // c1 récupère le reste du budget (NCA + CA) pour maximiser le produit
      c1 = Math.max(0, totalRefCA - a1 - b1);
    } else if (vectorS === '0,1,0') {
      // 2. Quand S = (0, 1, 0) : b1 = b0
      b1 = b0Val;
      // c1 minimal pour respecter c1*w >= c0*z et c1 > c0
      const c1Min = Math.max(c0Val, (c0Val * numZ) / numW);
      c1 = c1Min;
      // a1 récupère le reste du budget
      a1 = Math.max(0, totalRefCA - b1 - c1);
    } else if (vectorS === '0,0,1') {
      // 3. Quand S = (0, 0, 1) : c1 = c0
      c1 = c0Val;
      // a1 minimal pour respecter a1*u >= a0*x et a1 > a0
      const a1Min = Math.max(a0Val, (a0Val * numX) / numU);
      a1 = a1Min;
      // b1 récupère le reste du budget
      b1 = Math.max(0, totalRefCA - a1 - c1);
    }

    // Sommes et Produits
    const prodA1 = a1 * numU;
    const prodB1 = b1 * numV;
    const prodC1 = c1 * numW;
    const sumProducts = prodA1 + prodB1 + prodC1;

    // Taux p1 maximal résultant
    const p1Max = totalRefCA > 0 ? (sumProducts / totalRefCA) - 1 : 0;

    // Fond supplémentaire = (a1 + b1 + c1) - R
    const sumA1B1C1 = a1 + b1 + c1;
    const fondSupplementaire = sumA1B1C1 - R;

    return {
      J,
      R,
      r,
      NCA,
      totalRefCA,
      a1,
      b1,
      c1,
      prodA1,
      prodB1,
      prodC1,
      sumProducts,
      p1Max,
      p1Percent: (p1Max * 100).toFixed(2),
      sumA1B1C1,
      fondSupplementaire
    };
  }, [ca, x, y, z, u, v, w, effectiveA0, effectiveB0, effectiveC0, vectorS]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl shadow-lg shadow-violet-500/20">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              BetSteps <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">v2.0 Pro</span>
            </h1>
            <p className="text-xs text-slate-400">Calculateur Mathématique & Optimisation d'Échelle</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl backdrop-blur-md">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Modèle d'Exécution</div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Séquentiel Dynamique
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* =================================================================== */}
        {/* ÉTAPE 1 : CALCULS DE BASE                                         */}
        {/* =================================================================== */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-sm border border-violet-500/30">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Étape 1 : Initialisation & Solution Optimale (a₀, b₀, c₀)</h2>
              <p className="text-xs text-slate-400">Saisie de CA et des constantes de base (x, y, z)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulaire Entrées Étape 1 */}
            <div className="lg:col-span-5 space-y-5 bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-400" />
                Variables d'entrée
              </h3>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Chiffre d'Affaires (CA)</label>
                <input 
                  type="number"
                  value={ca}
                  onChange={(e) => setCa(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-violet-500 rounded-xl px-4 py-2.5 text-white font-mono font-bold focus:outline-none transition-all"
                  placeholder="ex: 100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">x</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={x}
                    onChange={(e) => setX(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-violet-500 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">y</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={y}
                    onChange={(e) => setY(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-violet-500 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">z</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={z}
                    onChange={(e) => setZ(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-violet-500 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Panneau de Résultats Étape 1 */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Carte q Max */}
                <div className="bg-gradient-to-br from-violet-950/40 to-slate-900 border border-violet-500/20 rounded-2xl p-4 relative">
                  <div className="text-[10px] uppercase font-bold text-violet-400 tracking-wider mb-1">Valeur Maximale q (p Max)</div>
                  <div className="text-3xl font-black text-white font-mono">
                    {step1Results.qPercent}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    Formule: <span className="font-mono text-violet-300">q = [1 / (1/x + 1/y + 1/z)] - 1</span>
                  </div>
                </div>

                {/* Carte Somme Inverses */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Somme Inverses (Σ_inv)</div>
                  <div className="text-2xl font-bold text-slate-200 font-mono">
                    {step1Results.invSum.toFixed(6)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    (1/x + 1/y + 1/z)
                  </div>
                </div>
              </div>

              {/* Résultats (a0, b0, c0) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Triplet Optimal de Départ (a₀, b₀, c₀)</span>
                  <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Somme = {ca} (100% CA)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-center">
                    <div className="text-xs text-slate-400 font-bold mb-1">a₀</div>
                    <div className="text-lg md:text-xl font-bold font-mono text-violet-400">
                      {step1Results.a0.toFixed(4)}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-center">
                    <div className="text-xs text-slate-400 font-bold mb-1">b₀</div>
                    <div className="text-lg md:text-xl font-bold font-mono text-fuchsia-400">
                      {step1Results.b0.toFixed(4)}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-center">
                    <div className="text-xs text-slate-400 font-bold mb-1">c₀</div>
                    <div className="text-lg md:text-xl font-bold font-mono text-pink-400">
                      {step1Results.c0.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* ÉTAPE 2 : ÉCHELLE & CONDITION DE OPTIMISATION                      */}
        {/* =================================================================== */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-bold text-sm border border-fuchsia-500/30">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Étape 2 : Changement d'Échelle, Produit Scalaire & Allocation (a₁, b₁, c₁)</h2>
                <p className="text-xs text-slate-400">Choix du vecteur S, constantes (u, v, w) et calculs d'échelle</p>
              </div>
            </div>

            {(overrideA0 !== null || overrideB0 !== null || overrideC0 !== null) && (
              <button
                onClick={handleResetStep2ToStep1}
                className="text-xs flex items-center gap-1.5 text-violet-400 hover:text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-xl border border-violet-500/20 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Réaligner sur Étape 1
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulaire Entrées Étape 2 */}
            <div className="lg:col-span-5 space-y-5 bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-fuchsia-400" />
                Saisies Manuel Étape 2
              </h3>

              {/* Triplet (a0, b0, c0) modifiable */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-300 font-medium">Triplet de Départ (a₀, b₀, c₀)</label>
                  <span className="text-[10px] text-slate-500">Pré-rempli auto</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={overrideA0 !== null ? overrideA0 : step1Results.a0.toFixed(4)}
                    onChange={(e) => setOverrideA0(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 focus:border-fuchsia-500 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={overrideB0 !== null ? overrideB0 : step1Results.b0.toFixed(4)}
                    onChange={(e) => setOverrideB0(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 focus:border-fuchsia-500 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={overrideC0 !== null ? overrideC0 : step1Results.c0.toFixed(4)}
                    onChange={(e) => setOverrideC0(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 focus:border-fuchsia-500 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Sélecteur de Vecteur S */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-2">Vecteur S (Sélection par bouton)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '1,0,0', label: 'S = (1, 0, 0)', condition: 'Fixe a₁ = a₀' },
                    { id: '0,1,0', label: 'S = (0, 1, 0)', condition: 'Fixe b₁ = b₀' },
                    { id: '0,0,1', label: 'S = (0, 0, 1)', condition: 'Fixe c₁ = c₀' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setVectorS(item.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        vectorS === item.id 
                          ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/10' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{item.condition}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Constantes (u, v, w) */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">Constantes d'Échelle (u, v, w)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">u</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={u}
                      onChange={(e) => setU(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80
