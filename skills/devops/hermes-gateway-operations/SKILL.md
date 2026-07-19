---
name: hermes-gateway-operations
description: >-
  Diagnose, restart, and maintain the Hermes messaging gateway
  (Telegram, Discord, Slack, etc.). Covers gateway crashes caused
  by stale cron deliveries to deleted chats, dead PID files, MCP
  server storms on startup, and verification steps.
category: devops
---

# Hermes Gateway Operations

## When to Use

- Bot Telegram/Dicord/Slack ne repond plus.
- Le gateway PID est mort (`ps aux | grep <pid>` vide).
- `gateway-stderr.log` montre des erreurs `Chat not found` en boucle.
- Le processus gateway crash immédiatement au demarrage.
- Detection d'un service manuel `hermes-tg.service` en conflit avec le gateway natif (`hermes-gateway.service`).

## Diagnostic (comment verifier)

### Etape 0 — Verifier si le gateway tourne

```bash
hermes gateway status
ps aux | grep -i hermes-gateway | grep -v grep | head -5
```

Si rien ne tourne, commencer par les logs (etape 7+) et le test API direct (etape « 0.5 » ci-dessous).

### Etape « 0.5 » — Tester l'API Telegram independamment du gateway

Avant de plonger dans systemd/cron, verifier si Telegram est simplement injoignable depuis cette machine :

```bash
TOKEN=$(grep -A3 'telegram:' ~/.hermes/config.yaml | grep 'token:' | sed 's/.*token: *//' | head -1)
curl -sf --connect-timeout 10 "https://api.telegram.org/bot${TOKEN}/getMe"
```

- **HTTP 200 + `{"ok":true,...}`** → L'API Telegram est accessible. Le probleme est dans le gateway.
- **Timeout / Connection refused** → La machine ne peut pas joindre Telegram. Attendre et reessayer, ou investiguer un blocage reseau.
- **HTTP 404** → Mauvais token ou URL mal formee.

Si l'API est injoignable et les logs montrent des timeouts en boucle (cf. `references/common-logs.md` → « Telegram API timeout death spiral »), le probleme est reseau, pas configuration.

### Diagnostic systeme

1. **Verifier la persistance de session systemd** (cause #1 des arrets apres reboot) :
   ```bash
   loginctl show-user gibson | grep -i linger
   ```
   Si `Linger=no` -> a chaque reboot, systemd ferme la session utilisateur et tous les services `--user` meurent avec elle. C'est le comportement par defaut sur Ubuntu/Debian. Il faut activer `enable-linger`.

2. **Verifier les services concurrents en boucle de crash** :
   ```bash
   systemctl --user list-units --failed --no-pager
   systemctl --user status kiro-gateway --no-pager | grep -E "restart counter|Failed|FAILURE" | tail -5
   ```
   Si un service affiche `restart counter is at 59000` ou une erreur de port deja en use -> il crashe en boucle, ce qui empeche hermes-gateway de demarrer proprement.

3. **Verifier le PID du gateway natif** :
   ```bash
   cat ~/.hermes/gateway.pid
   ps aux | grep -f ~/.hermes/gateway.pid | grep -v grep
   ```
   Si vide -> gateway mort.

4. **Verifier le service natif** :
   ```bash
   hermes gateway status
   hermes gateway list
   ```
   Si `inactive (dead)` -> le service systemd natif n'est pas demarre.

5. **Verifier les services concurrents manuels** :
   ```bash
   systemctl --user list-units hermes*.service --no-pager
   systemctl --user status hermes-tg.service 2>&1 | head -20
   journalctl --user -u hermes-tg.service -n 30 --no-pager 2>&1 | grep -E "Input is not a terminal|Shutting down|Reprise session|activating"
   ```
   Si `activating (auto-restart)` + sortie immediate (exit 0/SUCCESS) avec `Warning: Input is not a terminal (fd=0)` -> probleme de service manuel concurreient.

6. **Lire les logs recents du gateway** :
   - **Log principal** (telemetrie Telegram) : `tail -100 ~/.hermes/logs/gateway.log`
   - **stderr** : `tail -100 ~/.hermes/gateway-stderr.log`
   - **stdout** : `tail -100 ~/.hermes/gateway-stdout.log`
   Le fichier `gateway.log` contient les evenements de connexion Telegram (`✓ telegram connected`, `Disconnected from Telegram`, tentatives de reconnexion). Toujours le consulter en premier pour les problemes Telegram.

7. **Verifier les crons livrant vers des chats fantomes** :
   ```bash
   grep -r "Chat not found\|last_delivery_error" ~/.hermes/cron/jobs.json
   grep "deliver.*telegram" ~/.hermes/crons.yaml
   ```

## Le piege « Linger=no » — session systemd non persistante

**Symptome** : apres chaque reboot du PC, le bot Telegram est mort. Le service `hermes-gateway.service` est `enabled` mais n'est jamais actif au demarrage.
**Cause** : par defaut, systemd ferme la session utilisateur (`user@<uid>.service`) quand l'utilisateur se deconnecte (fin de la session graphique ou fin du login). Tous les services `--user` meurent avec elle, meme s'ils sont `enabled`.

**Diagnostic** :
```bash
loginctl show-user gibson | grep -i linger
```
Si `Linger=no` -> c'est la cause.

**Solution permanente** :
```bash
sudo loginctl enable-linger gibson
```
Apres cette commande, la session utilisateur survive au reboot et les services `--user` demarrent automatiquement.

**Verification** :
```bash
loginctl show-user gibson | grep -i linger
# Doit afficher : Linger=yes
```

---

## Le piege « Service en boucle de crash » — restart storm

**Symptome** : le gateway natif ne demarre pas, ou demarre puis s'arrete immediatement. Un autre service `--user` (ex. `kiro-gateway`) affiche `restart counter is at 59000+` dans `systemctl status`.
**Cause** : un service systemd avec `Restart=always` et un bug de demarrage (ex. port deja occupe `Errno 98`, credentials manquants) crée une boucle de crash qui : (a) pollue les logs, (b) consomme du CPU, (c) peut empecher hermes-gateway de s'initialiser proprement par competition sur les ressources.

**Diagnostic** :
```bash
systemctl --user list-units --failed --no-pager
systemctl --user status kiro-gateway --no-pager | grep -E "restart counter|Failed|FAILURE"
journalctl --user -u kiro-gateway --no-pager | grep -E "address already in use|Errno 98" | tail -5
```

**Solution** :
1. Arreter et desactiver le service perturbateur :
   ```bash
   systemctl --user stop kiro-gateway
   systemctl --user disable kiro-gateway
   ```
2. (Optionnel) Si definitivement abandonne, supprimer l'unite :
   ```bash
   rm ~/.config/systemd/user/kiro-gateway.service
   systemctl --user daemon-reload
   ```
3. Redemarrer hermes-gateway :
   ```bash
   systemctl --user restart hermes-gateway
   systemctl --user status hermes-gateway --no-pager
   ```

---

## Le piege « Chat not found » — livraison cron vers un chat inaccessible

**Symptome** : gateway redemarre, puis crash peu apres, ou un job cron echoue avec `Chat not found`.
**Cause** : un ou plusieurs `cron` jobs sont configures avec `deliver: "telegram:<chat_id>"` vers un chat que l'utilisateur a supprime, bloque, ou qui n'existe plus. Chaque tentative de livraison genere une exception `telegram.error.BadRequest: Chat not found`. Apres suffisamment d'erreurs repetees, le gateway s'arrete.

**Variante `deliver: "all"` sans `origin`** : si un job a `deliver: "all"` mais `origin: null`, le routeur de livraison tombe sur une resolution par **username Telegram** (`@nom`) au lieu d'un `chat_id` numerique. Si l'utilisateur n'a jamais envoye de message au bot depuis ce username, Telegram rejette l'envoi avec `Chat not found`. Contrairement au cas precedent, ce n'est pas un chat supprime — c'est une resolution d'adresse qui echoue. **Solution** : remplacer `deliver: "all"` par `deliver: "telegram"` (ou `deliver: "telegram:<chat_id>"`) dans la configuration du job, et s'assurer que le bloc `origin` contient le `chat_id` correct.

**Nuance post-reboot** : apres un redemarrage du bot, le cache interne des chats actifs peut etre vide. Un job cron lance immediatement apres le boot peut echouer avec `Chat not found` meme si le chat existe, car le bot n'a pas encore recu de message de cet utilisateur dans cette instance. L'utilisateur doit envoyer `/start` (ou n'importe quel message) au bot pour que Telegram renvoie le `chat_id` et que le bot l'enregistre.

**Solution** :
- Identifier le `chat_id` fautif dans `~/.hermes/cron/jobs.json` (champ `last_delivery_error`).
- Verifier si le chat existe toujours cote utilisateur (conversation Telegram non supprimee).
- Envoyer `/start` au bot depuis le chat concerne pour re-enregistrer le `chat_id`.
- Modifier ou supprimer les jobs concernes dans `~/.hermes/crons.yaml` si le chat est definitivement perdu.
- Relancer le gateway.

## Le piege « Health check suicide » — timer qui tue la gateway toutes les 2 minutes

**Symptome** : la gateway se connecte a Telegram avec succes (`✓ Connected to Telegram`),
tourne ~2 minutes, puis reçoit un SIGTERM de systemd et redemarre. Cycle infini.

```
juil. 07 15:07:25 systemd[1239]: Starting hermes-gateway-health.service...
juil. 07 15:07:25 sh[949127]: Gateway API non disponible — redemarrage...
juil. 07 15:07:25 systemd[1239]: Stopping hermes-gateway.service...
juil. 07 15:07:25 python[945786]: Shutdown context: signal=SIGTERM
```

**Cause** : le timer systemd `hermes-gateway-health.timer` execute le script
`gateway-health.sh` toutes les ~2 minutes. Ce script fait :

```sh
curl -sf http://127.0.0.1:8642/    # ← HTTP 404 (pas de route sur /)
```

L'API expose la route `/health`, pas `/`. La racine `/` renvoie HTTP 404.
`curl -sf` echoue sur tout code ≥ 400 → le script croit la gateway morte →
execute `systemctl --user restart hermes-gateway` → SIGTERM → la gateway
s'arrete.

**Verification** :
```bash
curl -s http://127.0.0.1:8642/          # → 404: Not Found
curl -s http://127.0.0.1:8642/health    # → OK
systemctl --user list-timers --no-pager | grep health
journalctl --user -u hermes-gateway.service --no-pager | grep "Stopping"
```

**Solution** : dans `gateway-health.sh`, changer l'URL :
```sh
API_URL="http://127.0.0.1:8642/health"
```

**Verification post-fix** :
```bash
curl -sf --max-time 5 http://127.0.0.1:8642/health >/dev/null 2>&1 && echo "OK"
```

## Le piege « Input is not a terminal » — service manuel concurrent

**Symptome** : un service systemd `hermes-tg.service` est en etat `activating (auto-restart)` en boucle, avec un processus qui demarre puis sort immediatement (exit 0/SUCCESS). Aucun gateway natif `hermes-gateway.service` n'est actif.

**Cause** : l'utilisateur possede un script maison (`~/.hermes/scripts/hermes-tg`) qui execute `hermes --resume <session>` en ligne de commande interactive. Quand systemd lance ce script sans TTY, Hermes detecte `fd=0` non-terminal et se ferme poliment (exit 0). systemd, voyant un exit « SUCCESS », redemarre en boucle.

**Solution** :
1. Arreter et desactiver le service manuel :
   ```bash
   systemctl --user stop hermes-tg.service
   systemctl --user disable hermes-tg.service
   ```
2. (Optionnel) Supprimer l'unite obsolete :
   ```bash
   rm ~/.config/systemd/user/hermes-tg.service
   systemctl --user daemon-reload
   ```
3. Demarrer le gateway natif d'Hermes :
   ```bash
   hermes gateway start
   ```
4. Verifier :
   ```bash
   hermes gateway status
   hermes gateway list
   ```

**Contexte** : avant ~juin 2026, le gateway natif `hermes-gateway.service` n'existait pas forcement ou l'utilisateur avait mis en place un script artisanal de type `hermes-tg` pour relancer le bot. Ce pattern est desormais obsolete. Le gateway natif est un service long-courant qui ecoute les messages ; il ne s'arrete pas a la fin d'une session individuelle.

## Le piege « No user allowlists » — messages Telegram ignores silencieusement

**Symptome** : le gateway demarre, Telegram est `connected` dans `gateway_state.json`, mais les messages que vous envoyez au bot restent sans reponse. Les jobs cron arrivent bien a livrer vers votre chat. Dans `gateway-stderr.log` (ou stdout) on trouve :

```
WARNING gateway.run: No user allowlists configured. All unauthorized users will be denied.
Set GATEWAY_ALLOW_ALL_USERS=true in ~/.hermes/.env to allow open access,
or configure platform allowlists (e.g., TELEGRAM_ALLOWED_USERS=your_id).
```

**Cause** : Hermes filtre les messages entrants par allowlist. Sans `GATEWAY_ALLOW_ALL_USERS=true` dans `.env` et sans `TELEGRAM_ALLOWED_USERS` defini, aucun utilisateur n'est autorise a parler au bot. Le gateway accepte la connexion Telegram (long polling actif), mais rejette silencieusement tous les messages entrants.

**Solution** :
```bash
# Option A (recommandee) : autoriser votre chat_id Telegram
echo 'TELEGRAM_ALLOWED_USERS=6336259792' >> ~/.hermes/.env

# Option B : ouvrir completement l'acces
echo 'GATEWAY_ALLOW_ALL_USERS=true' >> ~/.hermes/.env
```

**Verification** : apres redemarrage du gateway, la ligne `WARNING gateway.run: No user allowlists configured` ne doit plus apparaitre dans les logs.

**Diagnostic rapide** : si le gateway est `connected` a Telegram mais ne repond pas a vos messages, verifier TOUJOURS la presence de ce warning dans les logs avant d'explorer d'autres causes.

## Relance du gateway

**Commande** (depuis le venv Hermes) :
```bash
~/.hermes/hermes-agent/venv/bin/python \
  ~/.hermes/hermes-agent/hermes_cli/main.py gateway run
```

**En arrière-plan** (si le shell ne supporte pas `terminal(background=true)`) :
```bash
cd ~/.hermes && nohup \
  ~/.hermes/hermes-agent/venv/bin/python \
  hermes-agent/hermes_cli/main.py gateway run \
  > /dev/null 2>&1 &
echo $! > ~/.hermes/gateway.pid
```

**Vérification post-relance** :
```bash
# Verifier le processus
ps aux | grep -f ~/.hermes/gateway.pid | grep -v grep
# Verifier la connexion Telegram dans les logs (les 3 lignes cles)
tail -20 ~/.hermes/logs/gateway.log | grep -E "Connected to Telegram|telegram connected|set_my_commands OK"
```
Doit afficher :
- `✓ telegram connected`
- `Connected to Telegram (polling mode)`
- `set_my_commands OK for scope BotCommandScopeDefault`

## Erreurs MCP au demarrage (non bloquantes)

Le gateway peut afficher des dizaines de `WARNING tools.mcp_tool: MCP server 'xxx' initial connection failed`. Ces warnings sont generalement **non bloquants** — le gateway continue de demarrer. Ne pas les confondre avec la cause du crash. Cependant, si un MCP serveur est mal configure (ex. `args` au mauvais format), cela peut ralentir le boot.

## Fichiers de reference

- `references/common-logs.md` — extraits de logs typiques et leur signification (inclut « Chat not found », « Linger=no », « No user allowlists », « restart storm », « inference config drift »).
- `references/post-reboot-checklist.md` — checklist de diagnostic systematique quand le bot est mort apres un reboot.
- `references/telegram-gateway-troubleshooting.md` — diagnostic des problemes de resolution de username Telegram (@nom vs chat_id), couvre TELEGRAM_HOME_CHANNEL et les livraisons cron.

## Notes d'implementation

- Le diagnostic doit TOUJOURS commencer par `loginctl show-user <user> | grep Linger` quand le probleme est "ca s'arrete apres un reboot". C'est la cause #1 sous-estimee.
- Un service `enabled` ne suffit PAS pour survivre au reboot sous systemd user : il faut `Linger=yes`.
- Ne jamais ignorer un autre service `--user` en boucle de crash (`restart counter > 1000`) : il empeche le gateway de demarrer proprement et pollue les logs.
- Apres un reboot, si un job cron livre vers Telegram et echoue avec `Chat not found`, demander a l'utilisateur d'envoyer `/start` au bot avant de declarer le chat perdu.
