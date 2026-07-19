---
name: vercel-ai-generate-text
description: Génère du texte avec Vercel AI SDK et sauvegarde le résultat dans un fichier. Retourne uniquement le chemin du fichier.
trigger: "Génère un texte avec Vercel AI SDK pour {task} et sauvegarde-le dans {client}"
---

### Error Handling

#### **1. Payload Too Large (413)**
- **Cause** : Hermes ne peut pas transmettre les réponses volumineuses des providers (même après simplification).
- **Solutions** :
  - **Exécuter en local** : Utiliser un script Python (`scripts/generate_facture.py`) pour éviter les limites de payload.
  - **Découper la tâche** : Générer le document en plusieurs étapes (ex : en-tête, corps, pied de page).
  - **Retour minimal** : Toujours retourner uniquement le chemin du fichier (pas de résumé verbeux).

#### **2. Fallback Automatique**
- **Logique** : AWS Bedrock → Cloudflare Workers AI → Modèle local.
- **Exemple** : Si AWS Bedrock échoue (quota épuisé), basculer sur Cloudflare Workers AI.
- **Commande** : Mettre à jour la tâche pour utiliser un modèle de fallback :
  ```bash
  hermes kanban update <task_id> --model cloudflare/llama-3.1-8b-instruct
  ```

#### **3. Modèles Indisponibles**
- **Cloudflare Workers AI** : Certains modèles (ex : `llama-3.1-8b-instruct`, `gemma-7b-it`) peuvent être rejetés (erreur 400/410).
  - **Solution** : Utiliser `@hf/nousresearch/hermes-2-pro-mistral-7b` ou un modèle local.
- **AWS Bedrock** : Le modèle `fable-5` peut être inaccessible (`AccessDeniedException`).
  - **Solution** : Utiliser `sonnet-4` ou `sonnet-4.6`.

#### **4. Authentification**
- **Variables d'environnement** : Vérifier que `AWS_BEARER_TOKEN_BEDROCK` et `CLOUDFLARE_API_TOKEN` sont configurées.
- **Fallback** : Si les tokens sont absents, utiliser un modèle local ou désactiver le provider.

---

### Étapes
1. **Lire la configuration des providers** depuis `~/.hermes/config/ai-providers.json`.
2. **Choisir le provider** en fonction de la disponibilité (fallback automatique).
   - Priorité : AWS Bedrock → Cloudflare Workers AI → Modèle local.
   - Si un provider échoue (quota, modèle indisponible), basculer vers le suivant.
3. **Générer le texte** avec le modèle par défaut ou le fallback.
4. **Sauvegarder le résultat** dans `/home/gibson/Documents/Work/Mwana-Itech/Clients/{client}/facture_{date}.md`.
5. **Retourner uniquement le chemin du fichier** (pas de résumé verbeux).

### Pitfalls
- **Quota AWS Bedrock** : Le quota "Too many tokens" est indépendant des crédits AWS. Solution : utiliser Cloudflare Workers AI comme fallback.
- **Retour minimal** : Toujours retourner uniquement le chemin du fichier généré (pas de résumé verbeux).
- **Format** : Utiliser Markdown sans emojis/Unicode pour les documents générés.
- **Logs** : Logger les erreurs pour le débogage (ex : `console.error("Provider AWS Bedrock échoué :", error)`).

### Exemple d'Utilisation
```bash
hermes skill run vercel-ai-generate-text --task "Rédige une facture pour le service Vitrine à 80k XAF" --client "Centre Linguistique Farel"
```

### Fichiers de Support
- **Script Python** : [`scripts/generate_facture.py`](scripts/generate_facture.py) (génération de factures avec fallback automatique).
- **Template API** : [`templates/api-call.py`](templates/api-call.py) (exemple d'appel à Bedrock/Cloudflare).
- **Référence** : [`references/providers-cloud.md`](references/providers-cloud.md) (modèles disponibles, erreurs courantes).

### Exemple d'Utilisation
```bash
hermes skill run vercel-ai-generate-text --task "Rédige une facture pour le service Vitrine à 80k XAF" --client "Centre Linguistique Farel"
```

### Fichiers de Support
- **Script Python** : [`scripts/generate_facture.py`](scripts/generate_facture.py) (génération de factures avec fallback automatique).
- **Template API** : [`templates/api-call.py`](templates/api-call.py) (exemple d'appel à Bedrock/Cloudflare).
- **Référence** : [`references/providers-cloud.md`](references/providers-cloud.md) (modèles disponibles, erreurs courantes).