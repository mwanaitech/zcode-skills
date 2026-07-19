# Logo Integration — GraphicsMagick Command Recipes

Collection de commandes GM testées et fonctionnelles pour différents cas de logos.

## Cas 1 : Logo JPEG avec fond blanc opaque (le plus courant)

Source : `logo.jpg` 1280×1280, fond blanc uni, logo au centre.

```bash
# Étape 1 : Supprimer le fond blanc (tolerance 15% pour les JPEG compressés)
gm convert logo.jpg -fuzz 15% -transparent white logo_clean.png

# Étape 2 : Trim des marges transparentes résiduelles
gm convert logo_clean.png -trim +repage logo_trim.png

# Étape 3 : Redimension pro (Lanczos = meilleur anti-aliasing)
gm convert logo_trim.png -resize 300x300 -filter Lanczos logo_300.png

# Étape 4 : Glow doré subtil (adapter rgba() à la marque)
gm convert -size 360x360 xc:none \
  -fill "rgba(212,175,55,0.15)" -draw "circle 180,180 180,0" \
  -blur 0x20 glow.png

# Étape 5 : Composition finale (fond = fond_ia_genere.png)
gm composite -compose Over -gravity SouthWest -geometry +60+60 glow.png fond_ia_genere.png tmp.png
gm composite -compose Over -gravity SouthWest -geometry +80+80 logo_300.png tmp.png final.png
```

## Cas 2 : Logo PNG déjà transparent

```bash
gm convert logo.png -resize 300x300 -filter Lanczos logo_300.png
gm composite -compose Over -gravity SouthWest -geometry +80+80 logo_300.png fond.png final.png
```

## Cas 3 : Logo avec texte — besoin de lisibilité maximale

Ajouter un fond semi-transparent derrière le logo pour isoler du fond complexe :

```bash
# Créer un badge noir semi-transparent
gm convert -size 400x400 xc:"rgba(0,0,0,0.4)" -blur 0x30 badge.png

# Combiner : fond → badge → logo
gm composite -compose Over -gravity SouthWest -geometry +50+50 badge.png fond.png tmp.png
gm composite -compose Over -gravity SouthWest -geometry +80+80 logo_300.png tmp.png final.png
```

## Tableau des positions courantes

| Position | Gravity | Geometry | Usage |
|----------|---------|----------|-------|
| Bas gauche | `SouthWest` | `+80+80` | Classique corporate |
| Bas droite | `SouthEast` | `+80+80` | Équilibre alternatif |
| Haut centré | `North` | `+0+40` | Hero banner |
| Centré | `Center` | — | Focus logo |

## Erreurs GM courantes et solutions

| Erreur | Cause | Fix |
|--------|-------|-----|
| `Unrecognized option (-composite)` | Utilisé `gm convert` au lieu de `gm composite` | `gm composite` est la commande, pas un flag de convert |
| `Unable to open file (()` | Parenthèses mal échappées dans shell | Échapper avec `\( ... \)` ou utiliser `gm composite` à la place |
| Fond blanc persistant | Trop de `-fuzz` ou mauvaise couleur | Augmenter `-fuzz` à 20-25% ou utiliser `-trim` |
| Glow invisible | Trop transparent | Augmenter alpha (0.15 → 0.25) ou réduire blur |

## Test rapide de la composition

```bash
# Vérifier le résultat sans écraser
gm identify final.png
# Doit afficher : PNG 1024x576+0+0 DirectClass 8-bit
```
