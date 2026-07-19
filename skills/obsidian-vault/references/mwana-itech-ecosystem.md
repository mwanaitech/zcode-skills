# Écosystème Mwana-Itech — Référence rapide

## Acteur : Hans Axel Mbina Mabicka

**Profil** : Fondateur de Mwana-Itech. Professeur d'informatique au Gabon. Formateur réseaux, cybersécurité, OSINT.

**Contacts** :
- Email personnel : hansaxel25@gmail.com
- Email business : mwanaitech@gmail.com
- Téléphones : +241 74 64 10 29 / +241 65 05 37 32
- Business : +241 065 05 37 32
- LinkedIn : linkedin.com/in/hans-axel
- Site : mwana-itech.pages.dev

## Entreprise : Mwana-Itech

**Slogan** : Jeunesse — Innovation — Impact
**Location** : Owendo / Libreville, Gabon

### Services numériques (forfaits web)

| Forfait | Prix (FCFA) | Pages | Délai | Public |
|---------|-------------|-------|-------|--------|
| Vitrine Simple | 80 000 | 3–5 | 2 sem. | Petites affaires |
| Professionnel | 130 000 | 6–12 | 2-3 sem. | PME / EPE |
| E-commerce | 199 000 | 8–15 | 3–4 sem. | Boutiques en ligne |

**Conditions** : Acompte 50 %, 3 rounds de corrections inclus, tarifs valables jusqu'au 31/12/2026.
**Paiement** : Virement bancaire, Airtel Money, Moov Money, espèces.

### Infrastructure technique
- Hébergement : Cloudflare Pages
- Backend : Cloudflare Workers
- Anti-spam : Cloudflare Turnstile
- Email : Resend API
- Frontend : HTML5/CSS3/JS vanilla

### Rapport de sécurité OWASP (juin 2026)
- Score global : 81/100 (Bon niveau)
- Priorités : Corriger CSP (`unsafe-inline`) et CORS (`*`)
- Full report dans `Rapport de S_curit_ OWASP _ mwana-itech.pages.dev_v1.md`

## Projets connexes

### Projet Jarvis
- Assistant vocal open-source
- Pipeline : Porcupine → faster-whisper → Hermes API → edge-tts
- Intégration : Kiro gateway + Telegram

### Terre & Chaleur
- Librairie en ligne
- Stack : Next.js, Neon, Drizzle, Vercel AI SDK
- Hébergement : Vercel

## Fichiers sources clés
```
/home/gibson/Documents/Work/Mwana-Itech/Perso/
├── README.md                              # Présentation entreprise
├── MWANAITECH_Grille_Tarifaire(1).docx    # Grille tarifaire Word
├── MWANAITECH_Grille_Tarifaire.pdf        # Grille tarifaire PDF
├── tarif promotionnel.md                  # Texte promo
├── Rapport de S_curit_ OWASP ... .md      # Audit sécurité
├── mwana-itech_site/                      # Site web complet (HTML/CSS/JS)
│   ├── index.html, css/style.css, js/script.js
│   └── contact-worker/                    # Cloudflare Worker
└── Medias/                                # Logos, affiches, vidéos
```

## Conventions client
- **Tolérance zéro** pour les textes français sans accents. Relire TOUS les textes français avant livraison.
- **Pas d'emojis/Unicode** dans les livrables. Texte brut uniquement pour Telegram.
- **Ordre de travail** : Design → Backend → Paiement → Frontend → IA
- **Autonomie** : sous-agents Hermes pour développer de A à Z
- **Workflow** : `hermes kanban list` et `hermes kanban logs <task_id>`

## Ressources AWS / Cloudflare
- AWS Bedrock : ~$100 crédits, quota daily "Too many tokens" indépendant des crédits
- Sonnet 4 = principal modèle délégué
- Fable 5 = orchestrateur
- Fallback : Cloudflare Workers AI (Llama 3.1)
- Mistral API : indisponible depuis le Gabon
- Erreur 413 récurrente → solutions : scripts locaux, découpage des tâches
