---
name: brand-visual-workflow
description: Pipeline complet pour créer des visuels de marque professionnels en combinant génération IA (image_generate) et traitement d'image (GraphicsMagick / ls-gm-img). Couvre la génération de fonds, l'intégration pro de logos (suppression de fond, glow, ombre), et la livraison d'assets prêts à l'emploi.
version: 1.0.0
metadata:
  hermes:
    tags: [creative, branding, image-generation, graphicsmagick, logo, design]
---

# brand-visual-workflow — Création d'Assets Visuels de Marque

Ce skill gouverne le pipeline complet : **génération IA du fond** → **préparation du logo** → **composition professionnelle** → **livrable final**.

## Quand utiliser ce skill

- L'utilisateur demande un visuel/bannière/poster pour sa marque/entreprise
- Un logo existant doit être intégré sur un fond généré ou photographique
- Besoin d'assets multi-formats (carré, paysage, portrait) pour réseaux sociaux
- Post-traitement d'images IA (redimensionnement, format conversion, ajustements)

## Prérequis

- `image_generate` disponible (backend FAL.ai ou équivalent)
- `gm` (GraphicsMagick) installé sur le système, OU le skill `ls-gm-img` chargé
- Le logo source en fichier local (JPEG/PNG)

## Pipeline en 3 phases

### Phase 1 — Génération du fond (IA)

Générer le fond visuel via `image_generate`. Construire le prompt avec :
- **Palette** harmonieuse (2-3 couleurs dominantes)
- **Style** corporate/premium adapté à la marque
- **Espace négatif** prévu pour le logo (éviter les zones trop chargées là où le logo sera posé)
- **Ratio** adapté à l'usage : `landscape` (16:9, bannières), `square` (1:1, posts), `portrait` (9:16, stories)

> Tip : demander le logo et ses couleurs AVANT de générer le fond, pour harmoniser la palette.

### Phase 2 — Préparation du logo

**JAMAIS composer un logo brut avec fond blanc sur un fond sombre.**

```bash
# 1. Identifier le logo
gm identify logo.jpg

# 2. Supprimer le fond blanc / presque blanc
gm convert logo.jpg -fuzz 15% -transparent white logo_clean.png

# 3. Si le logo a des bords irréguliers, trim les marges transparentes
gm convert logo_clean.png -trim +repage logo_trim.png

# 4. Redimensionner avec anti-aliasing Lanczos
gm convert logo_trim.png -resize 300x300 -filter Lanczos logo_300.png
```

**Flags GM importants :**
- `-fuzz 15%` : tolérance pour les blancs cassés / compression JPEG
- `-transparent white` : rend le blanc transparent
- `-filter Lanczos` : meilleure qualité de redimensionnement
- `-trim` : supprime les marges transparentes automatiquement

### Phase 3 — Composition professionnelle

#### 3a. Créer un glow/aura derrière le logo

Sur un fond sombre, un logo sans traitement disparaît. Ajouter un halo subtil :

```bash
# Glow doré flou (adapter la couleur à la marque)
gm convert -size 360x360 xc:none \
  -fill "rgba(212,175,55,0.15)" -draw "circle 180,180 180,0" \
  -blur 0x20 glow.png
```

#### 3b. Combiner fond + glow + logo

```bash
# Ordre : fond → glow → logo (Over = normal)
gm composite -compose Over -gravity SouthWest -geometry +60+60 glow.png  fond.png tmp.png
gm composite -compose Over -gravity SouthWest -geometry +80+80 logo.png tmp.png final.png
```

**Positions courantes :**
- `SouthWest` +80+80 : bas gauche (classique corporate)
- `SouthEast` +80+80 : bas droite (équilibre alternatif)
- `North` +0+40 : centré haut (hero banner)
- `Center` : centré (focus total sur le logo)

**Tailles recommandées selon le format de sortie :**

| Format sortie | Taille logo | Taille glow |
|---------------|-------------|-------------|
| 1024×576 (16:9) | 260-320px | +40px de marge |
| 1024×1024 (1:1) | 300-380px | +40px de marge |
| 576×1024 (9:16) | 200-260px | +30px de marge |

### Phase 4 — Export et livraison

Exporter en PNG pour qualité max, ou WebP/JPEG selon usage web :

```bash
gm convert final.png -quality 92 final.jpg    # web/jpeg
gm convert final.png -quality 85 final.webp   # web/modern
```

## Anti-patterns (ce qu'il ne faut PAS faire)

| ❌ Erreur | ✅ Correction |
|-----------|---------------|
| **Compositer un logo JPEG fond blanc brut sur fond sombre** — l'utilisateur verra un rectangle blanc moche | **Toujours** retirer le fond blanc d'abord via `-transparent white` ; vérifier visuellement avant livraison |
| Logo trop petit (illisible) ou trop grand (écrase le fond) | Viser 15-25% de la largeur du fond pour le logo |
| Pas d'espace négatif dans le prompt IA | Mentionner "copy space" / "negative space" dans le prompt |
| Composition brute sans glow sur fond complexe | Ajouter un glow subtil ou une ombre portée |
| Un seul format livré | Générer les 3 ratios (landscape, square, portrait) si usage réseaux sociaux |
| Livrer sans vérification visuelle | Toujours inspecter le résultat ; si le logo est "null et grave null", recommencer avec `-fuzz` plus élevé et glow ajouté |

## Références

- `references/logo-integration-examples.md` — Transcripts de commandes GM réussies pour différents styles de logo (fond blanc plein, logo transparent natif, logo avec dégradé)
