---
name: french-professional-writing
description: Protocol for drafting professional French documents (CVs, cover letters, emails, quotations) with zero-tolerance accent checking and Obsidian-first documentation.
triggers: ['lettre', 'motivation', 'CV', 'email', 'devis', 'proposition', 'candidature', 'français', 'accents']
---

# Rédaction professionnelle en français — Protocole strict

## TL;DR
- L'utilisateur a une **tolérance ZÉRO** pour les textes français sans accents.
- Avant chaque livrable : consulter le vault Obsidian, puis relire systématiquement TOUS les accents.
- En cas de limitation technique (modèle sans vision, fichier absent) : déléguer immédiatement à un sous-agent au lieu de dire "je ne peux pas".

## Pré-requis : Obsidian-first
1. **Toujours** consulter `$OBSIDIAN_VAULT_PATH` (ou `~/Obsidian`) avant de commencer.
2. Lire `/01_Profil/Profil.md` pour récupérer les coordonnées exactes (nom, email, téléphone).
3. Lire `/04_Regles/Regle_d_Or.md` pour les conventions en vigueur.
4. Ne JAMAIS inventer de coordonnées : si le vault ne les contient pas, demander à l'utilisateur de les valider.

## Workflow de livraison
1. **Collecte** des infos nécessaires (vault, image, demande).
2. **Brouillage** du document en respectant la structure demandée.
3. **Vérification des accents** : relire ligne par ligne chaque mot accentué (é, è, ê, à, â, ô, û, ù, ç, ï, ö).
4. **Validation finale** : passer le texte au crible des mots fréquemment oubliés :
   - équipe, expérience, compétences, développé, sécurité, réseau, matériel, logiciel, procédures, utilisateur, téléphone, adresse, curriculum, fonction, motivation, intéressé.
5. **Documentation** : si c'est une nouvelle offre ou une nouvelle information, créer une note dans Obsidian sous la bonne catégorie.
6. **Envoi/Livraison** : livrer sans emojis ni Unicode, directement dans Telegram.

## Règles de vérification des accents (zéro erreur)
- "rigueur" → pas "rigueur"
- "compétences" → pas "competences"
- "développé" → pas "developpe"
- "sécurité" → pas "securite"
- "expérience" → pas "experience"
- "équipe" → pas "equipe"
- "utilisateur" → pas "utilisateur"
- "matériel" → pas "materiel"
- "téléphone" → pas "telephone"
- "procédures" → pas "procedures"
- "réseau" → pas "reseau"

## Fallback technique
- Si le modèle actuel ne supporte pas `vision_analyze` : **immédiatement** déléguer via `delegate_task` à un sous-agent avec modèle (`claude-sonnet-4` ou équivalent).
- Si un fichier est absent du cache : ne pas abandonner, chercher sur disque avec `terminal` ou redemander poliment le fichier.
- Si erreur 413 (payload too large) : découper le travail en morceaux plus petits.

## Templates disponibles
- Voir `templates/lettre-motivation-base.md` pour une lettre de motivation structurée.
- Voir `templates/email-professionnel-base.md` pour un email standard.

## Pitfalls
- **Ne jamais** envoyer un texte français sans le relire pour les accents — même pour une "version rapide".
- **Ne jamais** utiliser d'emojis ou de caractères Unicode dans les livrables Telegram de l'utilisateur.
- **Ne jamais** dupliquer les mêmes responsabilités dans plusieurs paragraphes de la lettre.
- Le CV doit avoir un **titre adapté au poste** ou un titre généralisateur (ex: "Technicien Systèmes & Support IT").
