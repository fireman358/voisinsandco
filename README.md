# Voisins & Co

PWA mobile-first d'économie locale, d'artisans et d'entraide de voisinage sur un périmètre
dynamique (2 à 15 km) autour d'**Arquennes (7181), Seneffe (7180), Feluy (7181), Nivelles (1400)
et Baulers (1401)** — Lillois.

## Stack

- **Next.js 15 (App Router) + TypeScript** déployé sur **Cloudflare Workers** via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) (OpenNext) — `wrangler.jsonc` avec `compatibility_flags: ["nodejs_compat"]`.
- **Tailwind CSS v4 + composants Shadcn/UI** (dans `components/ui/`), **Lucide React**.
- **Cloudflare D1 (SQLite)** via le binding `env.DB`, requêtes SQL natives : pré-filtrage par boîte englobante (`lat`/`lng` indexés) puis distance exacte par **formule de Haversine** en JS (« À 1,2 km • Arquennes »).
- **Repli automatique** sur les données de démonstration (`lib/seed-data.json`) si `env.DB` n'est pas lié : l'app fonctionne dès le premier déploiement.
- **PWA** : `public/manifest.json`, service worker `public/sw.js` (cache hors-ligne), icônes PNG/SVG.

Palette : fond `#FAFAFA`, cartes blanches, primaire **vert forêt `#15803D`**, accent **ambre `#D97706`** (badges Pro / offres flash).

## Scripts

```bash
npm install
npm run dev       # next dev (workerd via initOpenNextCloudflareDev)
npm run build     # next build (TypeScript + ESLint vérifiés)
npm run preview   # opennextjs-cloudflare build && opennextjs-cloudflare preview
npm run deploy    # opennextjs-cloudflare build && opennextjs-cloudflare deploy
npm run icons     # régénère les icônes PWA (public/icons/*.png)
npm run lint      # eslint
```

## Base D1

```bash
npx wrangler login
npx wrangler d1 create voisins-and-co-db        # copier le database_id (UUID) rendu
# coller cet UUID à la place de "REMPLACER-PAR-L-ID-D1" dans wrangler.jsonc, puis commit + push
npx wrangler d1 migrations apply voisins-and-co-db --remote   # 0001_init.sql + 0002_seed.sql
# ou manuellement : wrangler d1 execute voisins-and-co-db --remote --file=schema.sql --file=seed.sql
```

> Le Worker s'appelle `voisinsandco` (aligné sur le nom du projet Cloudflare Pages) :
> URL de prod = `https://voisinsandco.<sous-domaine>.workers.dev`.
> Sans UUID valide dans `wrangler.jsonc`, `wrangler deploy` échoue avec l'erreur 10021
> (« binding DB of type d1 must have a valid database_id ») — c'est le seul prérequis bloquant.
> Tant que la base n'existe pas encore, l'app fonctionne en mode démo (données seed en mémoire).

Sans cette étape, l'app tourne en **mode démo** (données seed en mémoire, badge « Données de démo » dans le header).

## CI/CD GitHub → Cloudflare Workers

Le workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) se déclenche sur chaque
`push` sur `main` : `npm ci` → `npm run build` → provisionnement/migration D1 → `npm run deploy`.

Secrets GitHub requis : `CLOUDFLARE_API_TOKEN` (token avec droits Workers + D1) et `CLOUDFLARE_ACCOUNT_ID`.

## Fonctionnalités

1. **Annuaire « Scrape & Claim »** — fiches Standard (bouton « C'est votre commerce ? Revendiquer »),
   Vérifiée (horaires + badge vert), Pro (mise en avant ambre, liens site/tél/itinéraire, actus).
   Filtres par catégorie + bascule Liste / Carte (carte SVG autonome, sans API externe).
2. **Bons plans & anti-gaspi** — paniers invendus réservables (code de retrait, paiement sur place)
   + agenda gratuit des assos/ASBL.
3. **Le Mur des Besoins** — publication entraide gratuite ou recherche d'artisan (alerte instantanée
   simulée aux pros du rayon).
4. **La Boîte à Outils du Quartier** — objets prêtés entre voisins, recherche instantanée, demande de prêt.

## Structure

```
app/            pages, layout, routes API (D1 + fallback seed)
components/     app-shell, header, onglets, modales, ui/ (shadcn)
lib/            types, geo (Haversine + bounding box), data (D1), seed
schema.sql      schéma D1
seed.sql        seed SQL (généré depuis lib/seed-data.json)
migrations/     0001_init.sql (schéma) + 0002_seed.sql (seed)
wrangler.jsonc  config Worker (binding DB, nodejs_compat, assets)
open-next.config.ts
scripts/        generate-icons.mjs, generate-seed-sql.mjs
```
