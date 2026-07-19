---
name: formal-document-workflow
description: Automates generation, preview, and Telegram delivery of formal documents.
---

# Formal Document Workflow

Automates the end-to-end lifecycle of formal document requests: generation (Word/PDF), in-chat previewing, and automated Telegram delivery.

## Triggering Conditions
- "Convert this to Word"
- "Make a formal letter/complaint"
- "Send this document to Telegram"
- "Put this in a Word doc and send it to me"

## Workflow

1.  **Generation**:
    - Use `mcp_office_word` tools to create the document (e.g., `mcp_office_word_create_document`).
    - Populate the document step-by-step using `mcp_office_word_add_paragraph` to maintain structure.

2.  **Previewing (Mandatory)**:
    - Do not just report the file path.
    - Immediately after generation, use `mcp_office_word_get_document_text` to retrieve the content.
    - Present a clean, formatted Markdown preview in the chat so the user can verify the text instantly.

3.  **Telegram Delivery**:
    - Use `curl` via the `terminal` tool to send the file via the Telegram Bot API.
    - Command pattern:
      `export TELEGRAM_BOT_TOKEN=$(grep TELEGRAM_BOT_TOKEN ~/.hermes/.env | cut -d'=' -f2) && curl -F document=@<path_to_file> https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendDocument?chat_id=<user_chat_id>`
    - For this user, the target `chat_id` is `6336259792`.

## Pitfalls

- **Telegram 404 Error**: Often caused by an invalid or incorrectly formatted `TELEGRAM_BOT_TOKEN`. Verify the token exists in `~/.hermes/.env`.
- **Silent Failures**: If the `curl` command fails, report the specific error (e.g., 401 Unauthorized, 404 Not Found) to the user rather than just saying "it failed".
- **Verification**: Always confirm to the user once the file has been successfully sent to Telegram.

## References
- See `references/telegram-delivery-troubleshooting.md` for specific API error codes.
