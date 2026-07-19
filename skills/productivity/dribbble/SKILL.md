---
name: dribbble
description: >
  Navigue Dribbble via Playwright pour trouver designs, tendances UI/UX, et inspirations.
  Analyse visuelle détaillée : palettes, typo, layouts, composants, animations.
  Relie directement chaque pattern à des choix d'implémentation technique.
  Utilisation: `/dribbble chercher <query>` ou `/dribbble shot <url>`.
---

# Dribbble — Design Intelligence & Inspiration

Outil d'exploration design qui utilise le navigateur (Playwright MCP) pour parcourir Dribbble et produire des analyses visuelles exploitables pour le développement.

## Usage

/dribbble chercher <mot-clé>   — Recherche designs + analyse des tendances
/dribbble shot <url>           — Analyse approfondie d'un shot spécifique
/dribbble popular              — Tendances populaires du moment

## Workflow — Recherche par mot-clé

### Phase 1 : Navigation & Capture

1. Naviguer vers `https://dribbble.com/search/{query}` (query URL-encoded)
2. Prendre un **screenshot** de la grille de résultats
3. Lire les titres, likes, vues des premiers résultats depuis le snapshot
4. Cliquer sur les 2-3 premiers shots pertinents
5. Pour chaque shot : screenshot + snapshot de la page détail
6. Noter les tags et les infos d'auteur/collection

### Phase 2 : Analyse Design

Pour chaque shot intéressant, décoder :

#### Palette couleurs
- Couleurs dominantes (extraire depuis le screenshot)
- Contraste, ambiance (dark/light/vibrant/muted)
- Dégradés ou couleurs plates ?

#### Typographie
- Style : serif / sans-serif / display / handwritten
- Hiérarchie : tailles, graisses, espacement
- Effets : outline, gradient text, shadow

#### Layout & Structure
- Grille : colonnes, gutter, breakpoints implicites
- Hiérarchie visuelle : F-pattern / Z-pattern / asymétrique
- Espacement : dense / aéré / avec des sections distinctes
- Responsive : comment les éléments s'adaptent (si visible)

#### Composants UI
- Cartes, listes, tableaux, formulaires, navigations
- États : hover, active, focus, empty, loading (si montrés)
- Micro-interactions : transitions, animations, curseurs

#### Innovation / Signature
- Qu'est-ce qui rend ce design unique ?
- Pattern de navigation original ?
- Traitement de données original ?

### Phase 3 : Synthèse Technique

Pour chaque pattern identifié, proposer :

```
Pattern: [nom]
Stack recommandée: [librairie CSS/Tailwind/Framer Motion /...]
Extrait conceptuel: |
  [description de l'implémentation]
```

### Phase 4 : Livraison

Fournir un résumé structuré :
1. **Tendance clé** — 2-3 lignes
2. **Palette du moment** — combos de couleurs populaires
3. **Patterns UI récurrents** — ce qui revient dans les résultats
4. **Implémentations possibles** — lien direct avec le code
5. **Liens** vers les shots les plus pertinents

## Workflow — Analyse d'un shot spécifique

1. Naviguer vers l'URL du shot
2. Screenshot de la page complète
3. Snapshot pour lire la description, les tags, les commentaires
4. Analyse couche par couche : fond → conteneurs → composants → détails
5. Checklist micro-détails : coins arrondis, ombres, icônes, états vides

## Contraintes

- Dribbble charge tout en JS — utiliser **uniquement** browser_mcp (Playwright), pas WebFetch
- Si Playwright pas disponible : annoncer et proposer d'activer le MCP
- Garder les screenshots pour référence visuelle
- Privilégier les designs récents (ce mois-ci) pour être sur les tendances actuelles
- Pour le développement web/mobile : extraire les patterns directement réutilisables

## Exemples concrets

### Dashboard analytics
```
/dribbble chercher dashboard analytics dark mode
→ Navigation → screenshot grille → top shot "Analytics Dashboard" → screenshot détail
→ Palette: dark navy #0F172A, accent vert #10B981, données en cartes glassmorphism
→ Layout: sidebar réduite + content area 3-colonnes
→ Stack Tailwind: bg-slate-900, backdrop-blur pour les cartes glass
→ Lien: https://dribbble.com/shots/xxx
```

### Landing page SaaS
```
/dribbble chercher saas landing page
→ Analyse hero sections, pricing cards, testimonial layouts
→ Pattern: bento grid pour features, gradient hero, animated stats
```
