---
name: agent-reach-delegation
description: Delegate internet search and content reading tasks (Twitter, Reddit, YouTube, Web, etc.) to the Agent-Reach CLI.
trigger: agent reach OR search internet OR read webpage OR search twitter OR search reddit OR search youtube OR search reddit OR search web
tags: [research, search, internet, scraping, intelligence]
---

# Agent-Reach Delegation Skill

This skill allows the agent to leverage the `Agent-Reach` CLI to perform deep internet research, read content from various platforms (Twitter, Reddit, YouTube, GitHub, etc.), and bypass common scraping barriers.

## Capabilities

### 1. Web Searching & Reading
- **General Web Search**: Search for topics across the web and read content from any URL using Jina Reader.
- **Platform-Specific Search**: Specialized search for Twitter (X), Reddit, YouTube, GitHub, Bilibili, and more.
- **Deep Reading**: Extracting full text and structure from web pages, even when they are complex.

### 2. Platform Support
- **Twitter (X)**: Search tweets and read profiles/threads.
- **Reddit**: Search subreddits and read posts/comments.
- **YouTube**: Search videos and extract transcripts/subtitles.
- **GitHub**: Search repositories and read files/issues/PRs.
- **RSS/Atom**: Monitor news feeds and blogs.

## Usage Instructions

When a user asks to "search the internet", "look up what people are saying on [Platform]", or "summarize this video/article", invoke this skill.

### Command Patterns

- **General Web Search**: `agent-reach search "query"`
- **Read a URL**: `agent-reach read "https://example.com"`
- **Platform Search** (if configured): `agent-reach search --platform [platform] "query"`

## Configuration Requirements

The agent should attempt to use the `agent-reach` command via the `terminal` tool. 

**Note**: Some platforms (Twitter, Reddit, Facebook, Instagram) may require the user to have configured their cookies or login credentials via the `OpenCLI` tool as specified in the Agent-Reach documentation.

## Workflow

1. **Identify Intent**: Determine which platform or type of search is required.
2. **Execute CLI**: Call the `agent-reach` command with the appropriate arguments.
3. **Process Output**: Parse the returned markdown/text and synthesize an answer for the user.
4. **Handle Failures**: If a platform is not configured (e.g., "requires login"), inform the user and suggest they "configure [platform]" or use the `agent-reach install` command.

## Troubleshooting

- **Command Not Found**: Ensure `~/Agent-Reach` is in the PATH or use the absolute path.
- **Permission Denied**: Ensure the agent has `exec` permissions in the Hermes configuration.
- **Empty Results**: Check if the platform requires authentication (cookies) or if the query is too specific.
