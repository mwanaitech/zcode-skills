# Référence : TP GABON FRAÎCHEUR SA — Août 2026

Problème de transport résolu avec PuLP/CBC. Document final : `TP_GABON_FRAICHEUR_SA.docx` (42 Ko).

## Données

| Usine | Capacité |
|-------|:--------:|
| Owendo (Libreville) | 850 |
| Lambaréné | 600 |
| Franceville | 550 |
| **Total** | **2 000** |

| Centre | Demande |
|--------|:-------:|
| Port-Gentil | 500 |
| Oyem | 450 |
| Mouila | 400 |
| Koulamoutou | 350 |
| **Total** | **1 700** |

| Usine → Centre | PG | Oyem | Mouila | Koulamoutou |
|---------------|:--:|:----:|:------:|:-----------:|
| Owendo | 1 200 | 1 500 | 1 800 | 2 600 |
| Lambaréné | 900 | 1 100 | 1 000 | 2 200 |
| Franceville | 2 500 | 2 300 | 2 100 | 800 |

**Contraintes :** X_Lam→Oyem ≤ 150, Budget ≤ 2 000 000 FCFA, variables entières.

## Solution de référence : Z* = 1 880 000 FCFA

| Origine → Destination | Caisses |
|----------------------|:-------:|
| Owendo → Port-Gentil | 450 |
| Owendo → Oyem | 300 |
| Lambaréné → Port-Gentil | 50 |
| Lambaréné → Oyem | 150 |
| Lambaréné → Mouila | 400 |
| Franceville → Koulamoutou | 350 |

## Comparaison des scénarios

| Scénario | Coût | Δ | Faisable ? |
|----------|:----:|:-:|:----------:|
| Référence | 1 880 000 | — | ✅ |
| Sans contrainte Lam→Oyem | 1 875 000 | −5 000 | ✅ |
| A (+25% carburant Lam) | 2 032 500* | +152 500 | ❌ budget |
| B (Franceville=300) | 1 965 000 | +85 000 | ✅ |
| C (Oyem=585) | — | — | ❌ budget |
| A+B combiné | — | — | ❌ budget |

*Sans contrainte budgétaire.*

## Leçons apprises

- La contrainte Lam→Oyem ≤ 150 **coûte 5 000 FCFA/mois** à l'entreprise
- Le budget de 2 000 000 FCFA est un **goulot d'étranglement** pour les scénarios de crise
- L'usine de Franceville est **indispensable** pour Koulamoutou (coût 800 FCFA/caisse vs 2 200+ depuis ailleurs)
- Marge budgétaire actuelle : seulement **120 000 FCFA (6%)**
