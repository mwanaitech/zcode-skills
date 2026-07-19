---
name: professional-doc-generation
description: "Génération de documents professionnels (présentations PPTX, CV, PDF) avec vérifications qualité, workaround outils, et validation mémoire client."
version: 1.0.0
trigger:
  - créer présentation PowerPoint
  - générer modèle pptx
  - créer CV
  - mettre à jour CV
  - convertir HTML en PDF
  - document professionnel
  - slides soutenance
---

# professional-doc-generation

Génération de documents professionnels structurés : présentations PowerPoint, CV, documents PDF à partir de HTML. Ce skill encadre le workflow technique et qualité.

## 1. Vérification Préalable — NE PAS SAUTER

Avant toute génération de contenu professionnel pour un client connu :

1. **Scanner la mémoire `user`** pour détecter les exclusions spécifiques :
   - Compétences / technologies à NE PAS mentionner
   - Préférences de format, de palette, de structure
   - Versions antérieures du document
   
2. **Scanner la mémoire `memory`** pour les contraintes de style :
   - Tolérance zéro accents en français (voir skill `french-professional-writing`)
   - Règles de composition spécifiques au client

> **Pitfall critique — Session 2026-07-05** : Risque d'inclure "Active Directory", "Hyper-V", "SQL/MySQL" dans un CV alors que la mémoire client exclut explicitement ces compétences. La vérification mémoire doit précéder la génération de contenu.

## 2. Vérification Accents (contenu français obligatoire)

Si le document contient du français, effectuer un **double-pass** de vérification des accents sur les mots fréquemment oubliés :

| Mot incorrect | Correct |
|---------------|---------|
| equipe | **é**quipe |
| experience | **é**xp**é**rience |
| competences | **c**omp**é**tences |
| developpe | d**é**velopp**é** |
| securite | s**é**curit**é** |
| telephone | t**é**l**é**phone |
| reseau | r**é**seau |
| procedures | proc**é**dures |
| materiel | mat**é**riel |
| logiciel | logiciel |
| utilisateur | utilisateur |

Référence : skill `french-professional-writing` + `references/zero_tolerance_accents.md`

## 3. Génération PowerPoint (.pptx) avec PptxGenJS

### Installation
```bash
npm install pptxgenjs
```

### Pitfalls identifiés (PptxGenJS v3.12)

| Fonctionnalité | Statut | Workaround |
|----------------|--------|------------|
| Couleurs `rgba(R,G,B,A)` | ❌ Non supportée | HEX 6-digit uniquement (ex: `E8F0F8`, pas `rgba(0,0,0,0.5)`) |
| `slide.addChart()` | ❌ Buggy / plantage | Remplacer par formes natives : `addShape()`, rectangles empilés, cercles pour camemberts |
| `slide.addSlideNumber()` | ❌ N'existe pas | `slide.addText('01', {x:'90%', y:'93%', fontSize:9})` |
| Transparence de forme | ⚠️ Limitée | Utiliser des couleurs de fond claires au lieu de l'alpha |

### Template de départ

```javascript
const PptxGenJS = require('pptxgenjs');
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9';

const slide = pptx.addSlide();
slide.background = { color: 'F5F5F5' };
slide.addText('Titre', {
  x: '5%', y: '5%', w: '90%',
  fontSize: 24, color: '1E3A5F', bold: true
});

await pptx.writeFile({ fileName: 'output.pptx' });
```

### Palette conseillée pour projecteur
- Éviter les couleurs trop vives (rouge vif, jaune fluo)
- Préférer des fonds neutres (gris pâle, beige, bleu-gris)
- Contraste texte/fond minimum 4.5:1

## 4. Conversion HTML → PDF

### Méthode recommandée (déjà présente sur Linux)
```bash
libreoffice --headless --convert-to pdf input.html --outdir .
```

> **Ne PAS installer** Puppeteer, WeasyPrint, Playwright, ou Chrome headless sans demande explicite. LibreOffice headless est suffisant et léger.

### Format HTML attendu
- CSS inline ou dans `<style>` interne
- `@page { size: A4; margin: 0; }` pour contrôle des marges
- Dimensions en `mm` pour le rendu imprimable
- Polices système (`Segoe UI`, `Arial`, `sans-serif`)

## 5. Checklist de Livraison

- [ ] Vérification mémoire client pour exclusions / restrictions
- [ ] Double-pass accents français (si applicable)
- [ ] PptxGenJS : pas de rgba(), pas de addChart(), pas d'addSlideNumber()
- [ ] Noms de fichiers descriptifs avec index (ex: `01_Corporate.pptx`)
- [ ] Confirmation fichier généré (`ls -lh`)
- [ ] Récapitulatif des livrables fourni à l'utilisateur

## Références

- `references/pptxgenjs-quirks.md` — Transcript des erreurs et workarounds
- `references/libreoffice-headless.md` — Commandes de conversion HTML→PDF
