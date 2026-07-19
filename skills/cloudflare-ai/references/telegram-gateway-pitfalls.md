# Telegram Gateway Pitfalls

## The config.yaml vs .env split

The most common failure: `hermes config set platforms.telegram.token <token>` **only writes to `config.yaml`**. The gateway actually reads `TELEGRAM_BOT_TOKEN` from **`.env`**, not from `config.yaml`. You must update both.

### Correct setup sequence

1. Add platform to `config.yaml`:
   ```yaml
   platforms:
     telegram:
       enabled: true
       token: <bot-token>
   ```

2. Set env var in `.env`:
   ```
   TELEGRAM_BOT_TOKEN=<bot-token>
   ```

3. Authorize the user — add BOTH their @username AND numeric user ID:
   ```
   TELEGRAM_ALLOWED_USERS=@Gibson2528,6336259792
   TELEGRAM_HOME_CHANNEL=@Gibson2528
   ```
   The `@username` alone often doesn't match — the gateway compares against the numeric `from_user.id` from Telegram's API. Get the numeric ID from a gateway log after the blocked user tries messaging the bot.

4. Restart the gateway:
   ```bash
   hermes gateway restart
   ```

## Error messages decoded

| Error | Meaning |
|-------|---------|
| `InvalidToken` — token rejected by server | Wrong bot token. Verify via `curl -s "https://api.telegram.org/bot<token>/getMe"` |
| `Blocked unauthorized user <id>` | User messaged the bot but their ID isn't in `TELEGRAM_ALLOWED_USERS`. Add their numeric ID. |
| `Chat not found` | Bot tried to send a message to `TELEGRAM_HOME_CHANNEL` but the user hasn't messaged the bot first. Bots cannot initiate conversations — user must send `/start` first. |

## First-contact flow

1. Bot must be messaged FIRST by the user (Telegram restriction — bots cannot initiate DMs)
2. After the user messages the bot, the gateway knows the chat_id
3. Then the bot can reply and you can `deliver` messages from Hermes to Telegram
