---
name: design-prototype-regeneration
title: Régénération de prototypes et maquettes pour projets web
description: |
  Régénérer rapidement des prototypes interactifs (HTML/CSS/JS) et des maquettes statiques (PNG + README) pour des projets web, en respectant les contraintes de style, de fonctionnalités et de livraison.
  
  **Cas d'usage** :
  - Recréer des livrables supprimés après une délégation Hermes.
  - Adapter un prototype existant à de nouvelles contraintes (style, fonctionnalités).
  - Générer des variantes pour des tests utilisateurs (B2C) ou des présentations B2B.
  
  **Contraintes couvertes** :
  - Style visuel (palette de couleurs, motifs culturels).
  - Fonctionnalités clés (catalogue, recherche, panier, compte utilisateur).
  - Formats de livraison (ZIP, PNG, README.md).
  - Gestion des erreurs (413 Payload Too Large).

author: Hermes Agent
version: 1.0
---


## Prérequis
- **Outils** :
  - Cloudflare Workers AI (Llama 3.1) pour le design.
  - FAL.ai pour la génération d'images (assets culturels).
  - `zip` (CLI) pour la compression.
  - `curl` pour l'envoi manuel via Telegram API.

- **Dossiers** :
  - Répertoire de travail : `/home/gibson/Documents/Work/`
  - Structure typique :
    ```
    /prototype/
      ├── index.html
      ├── product.html
      ├── cart.html
      ├── search.html
      ├── account.html
      └── assets/
          ├── css/
          ├── js/
          └── images/
    ```


## Étapes de régénération

### 1. Prototype interactif (HTML/CSS/JS)
**Objectif** : Recréer un prototype cliquable avec les pages clés du projet.

**Commandes** :
```bash
# Créer le répertoire de travail
mkdir -p /home/gibson/Documents/Work/terre_chaleur_prototype/assets/{css,js,images}
cd /home/gibson/Documents/Work/terre_chaleur_prototype

# Générer les pages HTML (exemple pour index.html)
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terre & Chaleur - Librairie Gabonaise</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <header style="background-color: #D4A574;">
    <h1>Terre & Chaleur</h1>
    <nav>
      <a href="index.html">Accueil</a>
      <a href="search.html">Recherche</a>
      <a href="cart.html">Panier</a>
      <a href="account.html">Compte</a>
    </nav>
  </header>
  <main>
    <section class="catalogue">
      <h2>Nos recommandations IA</h2>
      <div class="products">
        <!-- Placeholders pour les recommandations -->
        <div class="product-card">
          <img src="assets/images/placeholder.png" alt="Livre gabonais">
          <h3>Titre du livre</h3>
          <p>Prix: 5000 FCFA</p>
        </div>
      </div>
    </section>
  </main>
  <footer style="background-color: #2E5A47; color: #F4D03F;">
    <p>© 2026 Terre & Chaleur - Librairie en ligne</p>
  </footer>
</body>
</html>
EOF
```

**Style CSS** (exemple pour `assets/css/style.css`) :
```css
body {
  font-family: 'Arial', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

header, footer {
  padding: 1rem;
  text-align: center;
}

.product-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem;
  text-align: center;
}

.product-card img {
  max-width: 100%;
  height: auto;
}
```

**Compression** :
```bash
zip -r ../terre_chaleur_prototype.zip .
```


### 2. Maquettes statiques (PNG + README)
**Objectif** : Générer des images annotées des pages clés pour documentation B2B.

**Étapes** :
1. **Générer les images** via FAL.ai ou Cloudflare Workers AI (exemple pour la page d’accueil) :
   ```bash
   # Exemple de prompt pour FAL.ai
   echo "Crée une maquette de page d'accueil pour une librairie gabonaise nommée 'Terre & Chaleur'.
   Style : chaleureux et moderne, palette terreuse (ocre #D4A574, vert #2E5A47, doré #F4D03F).
   Éléments à inclure :
   - En-tête avec logo et navigation
   - Section 'Nos recommandations IA' avec 3 livres
   - Pied de page avec mentions légales
   Format : PNG 1920x1080." > prompt_fal.txt
   ```

2. **Annoter les images** (exemple pour `home.png`) :
   - Ajouter des notes sur les interactions (ex: "Bouton cliquable", "Lien vers la fiche produit").
   - Inclure des variantes pour les états (vide, chargement, erreur).

3. **Créer un `README.md`** :
   ```markdown
   # Maquettes Terre & Chaleur
   
   ## Pages incluses
   - `home.png` : Page d’accueil (catalogue + recommandations IA).
   - `product.png` : Fiche produit (détails, prix, ajout au panier).
   - `cart.png` : Panier (liste des articles, total, checkout).
   - `search.png` : Page de recherche (filtres, résultats).
   - `account.png` : Compte utilisateur (historique, paramètres).
   
   ## Choix de design
   - **Palette** : Terreuse (ocre #D4A574, vert #2E5A47, doré #F4D03F).
   - **Motifs** : Inspirés de l’artisanat gabonais.
   - **Cible** : B2B (libraires, éditeurs).
   
   ## Notes
   - Les boutons et liens sont cliquables dans le prototype interactif.
   - Variantes disponibles pour les états (vide, chargement, erreur).
   ```

4. **Compression** :
   ```bash
   zip -r ../terre_chaleur_maquettes.zip *.png README.md
   ```


## Gestion des erreurs

### Erreur 413 (Payload Too Large)
**Solutions prioritaires** :
1. **Découpage** : Envoyer les fichiers individuellement (ex: `index.html`, `home.png`).
2. **Envoi manuel** via Telegram API :
   ```bash
   curl -F document=@terre_chaleur_prototype.zip "https://api.telegram.org/bot<TOKEN>/sendDocument?chat_id=<CHAT_ID>"
   ```
3. **Hébergement temporaire** :
   ```bash
   # Exemple avec Transfer.sh
   curl --upload-file terre_chaleur_prototype.zip https://transfer.sh/terre_chaleur_prototype.zip
   ```

**Vérification** :
```bash
# Vérifier la taille des fichiers avant envoi
ls -lh /home/gibson/Documents/Work/*.zip
```


## Vérification des livrables

### Prototype interactif
- [ ] Navigation cliquable entre les pages.
- [ ] Placeholders pour les recommandations IA.
- [ ] Cohérence visuelle avec la palette et les motifs.
- [ ] Fichiers `index.html`, `product.html`, `cart.html`, `search.html`, `account.html` présents.

### Maquettes statiques
- [ ] Images en PNG 1920x1080.
- [ ] Annotations claires (interactions, états).
- [ ] `README.md` complet (explications, choix de design).
- [ ] Variantes pour les états (vide, chargement, erreur).


## Références
- [Palette de couleurs Terre & Chaleur](references/palette.md)
- [Exemple de prototype interactif](references/prototype-example.md)
- [Guide d'annotation des maquettes](references/maquettes-annotation.md)