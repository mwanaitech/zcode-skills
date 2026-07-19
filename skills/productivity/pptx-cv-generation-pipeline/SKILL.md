---
name: pptx-cv-generation-pipeline
description: Génération de modèles PowerPoint (.pptx) et conversion CV HTML→PDF via LibreOffice headless. Pitfalls, solutions et checklist validés en production.
title: Génération PowerPoint + CV PDF via Python
version: 1.0.0
trigger: |
  L'utilisateur demande de créer des modèles PowerPoint (pptx) et/ou un CV au format PDF
  à partir d'un HTML. Usage de python-pptx et LibreOffice headless.
---

# Génération PowerPoint + CV PDF — Pitfalls & Solutions

## 1. Génération de modèles PPTX avec `python-pptx`

### Problème : Couleurs trop vives → illisible sur projecteur
- **Symptôme** : Fond `#00FF00`, texte cyan `#00FFFF` — explosion rétinienne en salle de soutenance.
- **Cause** : Choix esthétiques "default" sans calibration gamma projecteur.
- **Solution** : Privilégier les teintes "mat" (matte) : saturation < 60 %, luminosité entre 15 % et 85 %. Éviter le blanc pur `#FFFFFF` sur fond clair. Utiliser `#F0F0F0` ou gris cassé.

### Problème : Designs trop similaires entre modèles
- **Symptôme** : 5 fichiers .pptx qui se ressemblent tous (même structure de slide, même typographie).
- **Cause** : Reprise du même `slide_layouts[6]` et même classe `BasePresentation` sans variation radicale.
- **Solution** : Imposer une contrainte de design **a priori** pour chaque modèle (ex: Monochrome / Glassmorphism / Terminal / Blueprint / Brutalism). Changer :
  - Police (serif vs sans-serif vs monospace)
  - Structure de page (1 colonne vs 2 colonnes vs grille)
  - Usage des formes (rectangles pleins vs lignes fines vs bordures épaisses)
  - Palette dominante (neutre / dégradé / néon / technique / contrastée)

---

## 2. CV HTML → PDF via LibreOffice Headless

### Pipeline validé
```bash
libreoffice --headless --convert-to pdf HANS_AXEL_CV.html --outdir .
```

### Problème : HTML mal formé = PDF vide ou cassé
- **Symptôme** : PDF généré mais vide (0 octets ou 1 Ko), ou mise en page détruite.
- **Cause** : Balises non fermées, absence de `<meta charset="UTF-8">`, utilisation de CSS flexbox/grid non supporté par le moteur Writer/Web de LibreOffice.
- **Solution** :
  1. Toujours fermer toutes les balises (`<br />`, `</div>`, etc.).
  2. Ajouter `<meta charset="UTF-8">` dans `<head>`.
  3. Pour un layout deux colonnes stable : utiliser `<table>` avec `width="100%"`, PAS de flexbox/CSS grid. LibreOffice Writer/Web interprète mal les div flottantes.
  4. Valider rapidement avec `grep -c "</html>"` ou `xmllint --html` si disponible.

### Problème : Timeout conversion
- **Symptôme** : Commande bloquée, pas de PDF sorti.
- **Solution** : Timeout minimum **45 secondes** (parfois 60s sur VM chargée).

### Problème : Warning `javaldx`
- **Symptôme** : `Warning: failed to launch javaldx - java may not function correctly` dans stderr.
- **Solution** : **Non-bloquant**, ignorable. Ne pas paniquer.

### Problème : Écrasement silencieux
- **Symptôme** : LibreOffice écrase le fichier PDF existant sans poser de question (`Overwriting: ...`).
- **Solution** : C'est le comportement attendu en headless. Si backup nécessaire, renommer l'ancien PDF avant conversion.

### Checklist pré-conversion
- [ ] HTML valide (balises fermées, charset UTF-8)
- [ ] Layout tabulaire pour colonnes
- [ ] Timeout min 45s
- [ ] Vérifier taille fichier PDF > 0 octets après conversion

---

## 3. Gestion du contenu CV — règles métier spécifiques (Hans Axel)

| Élément | Règle | Statut |
|---------|-------|--------|
| Nom + titre | UNE SEULE occurrence (sidebar) | Bloquant |
| Contact | Format compact `label: valeur` | Bloquant |
| Langues / Atouts | Sections SÉPARÉES | Bloquant |
| Photo | Circulaire en base64 dans HTML | Bloquant |
| Active Directory | INTERDIT (Windows Server, Hyper-V) | Bloquant |
| Bases de données | INTERDIT (SQL, MySQL) | Bloquant |
| ESSIG | Formulation « du GABON (ESSIG) » | Bloquant |

---

## 4. Commandes clés

### Vérification rapide HTML
```bash
grep -c "</html>" HANS_AXEL_CV.html  # doit retourner 1
```

### Conversion PDF
```bash
libreoffice --headless --convert-to pdf HANS_AXEL_CV.html --outdir /chemin/sortie/
```

### Vérification post-conversion
```bash
ls -lh HANS_AXEL_CV.pdf  # taille > 0
```
