# Telegram Bot API sendDocument Error Codes

When attempting to deliver files via `curl` to the Telegram Bot API, common errors include:

| Error Code | Meaning | Resolution |
|---|---|---|
| **401 Unauthorized** | Invalid Bot Token | Check `~/.hermes/.env` for correct `TELEGRAM_BOT_TOKEN`. Ensure no extra spaces or quotes. |
| **404 Not Found** | Wrong URL or Bot ID | Check that the URL format is `https://api.telegram.org/bot<token>/sendDocument`. If the token is wrong, the endpoint won't exist. |
| **400 Bad Request** | Missing parameter or invalid chat_id | Ensure `chat_id` is correctly specified and the bot has been started by the user (`/start`). |
| **429 Too Many Requests** | Rate limit exceeded | Wait a few seconds before retrying. |

**Note for this user**: The `404 Not Found` encountered in this session likely implies an issue with the token resolution or the token itself.
