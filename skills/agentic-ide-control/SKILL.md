---
name: agentic-ide-control
description: Manage and delegate tasks to agentic IDEs (like Kiro) via their CLI interface.
trigger: kiro chat OR ide chat OR run in kiro OR agentic ide chat
---

# Agentic IDE Control

This skill is used to delegate complex coding, refactoring, or architectural tasks to an agentic IDE that provides a Command Line Interface (CLI). 

## Core Workflow

1. **Identify the Command**: Use the IDE's specific chat subcommand (e.g., `kiro chat \"[prompt]\"`).
2. **Context Alignment**: Ensure the terminal is in the correct project directory before running the command.
3. **Execution**: Run the command in the background or foreground depending on the expected duration.
4. **Verification**: Check the output/logs to confirm the agentic IDE has completed the task.

## Tool-Specific Patterns

### Kiro IDE
- **Command**: `kiro chat \"[prompt]\"`
- **Key feature**: It runs a chat session in the current working directory.
- **Pitfall**: Do NOT attempt to use `curl` against Kiro's internal web-based endpoints unless you have verified the API gateway. Always prefer the `kiro chat` CLI for reliability.
- **Advanced Integration (Bridge Pattern)**: For seamless Hermes-to-Kiro interaction, a Python-based bridge (acting as an OpenAI-compatible proxy) can be used to wrap the `kiro chat` CLI. This allows Hermes to treat Kiro as a standard LLM provider.

## Troubleshooting

- **Command not found**: Ensure the IDE is installed and its binary is in the user's PATH (e.g., check `which kiro`).
- **Permission Denied**: Some IDEs require specific permissions to access certain directories. Use `sudo` only if explicitly required by the IDE documentation.
- **Environment Mismatch**: Ensure the IDE is launched in the same environment (venv, shell) where the task requires specific dependencies.
- **No Output in Terminal**: If `kiro chat` returns successfully but without text output, the IDE may be rendering the response in its GUI. In such cases, check Kiro's internal logs or configuration for headless/output modes.

## References
- [kiro-cli-guide](references/kiro-cli-guide.md)
- [kiro-bridge-concept](references/kiro-bridge-concept.md)
