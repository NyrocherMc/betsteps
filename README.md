# BetSteps — Calculateur séquentiel 2 étapes

Dashboard sombre/moderne (Dark Theme premium + Glassmorphism violet/magenta) — Next.js 14 App Router + TypeScript + Tailwind.

## 🚀 Démarrage local
```bash
npm install
npm run dev
# http://localhost:3000
```

## ▲ Déployer sur Vercel
1. Push ce dossier sur ton dépôt GitHub (voir ci-dessous)
2. Sur https://vercel.com → Add New → Project → Import ton repo `betsteps`
3. Framework preset: Next.js — Deploy (aucune variable d'env requise)

## 🔗 Connecter à ton dépôt GitHub existant
```bash
git init
git add .
git commit -m "feat: BetSteps v1 - calculateur 2 etapes"
git branch -M main
git remote add origin https://github.com/TON_USER/TON_REPO.git
git push -u origin main
```
Ou si ton repo existe déjà:
```bash
git remote -v
git add .
git commit -m "update: BetSteps"
git push
```

## 📐 Logique implémentée
Voir `app/page.tsx` pour l'intégralité (composant autonome copiable).

- **Step 1**: CA, x,y,z → inv_sum = 1/x+1/y+1/z, q=(1/inv_sum-1), triplet a0,b0,c0= CA/(cote*inv_sum)
- **Step 2**: S ∈ {(1,0,0),(0,1,0),(0,0,1)}, u,v,w, total = R+CA (ou Mises+CA toggle), allocation conditionnelle, Fond supplémentaire = (a1+b1+c1)-R, produits a1·u etc.
> Note: prompt maître tronqué pour Total=NCA+CA où NCA=(a0·x)+r. Implémenté en R+CA avec switch explicable en UI.

## 📁 Structure
```
app/page.tsx      → toute l'app (state, calculs, UI premium)
app/layout.tsx    → layout + fonts
app/globals.css   → design system
```

## ✅ Prêt prod
Build validé: `npm run build` OK (Next 14.2.5, 10.1kB page)
