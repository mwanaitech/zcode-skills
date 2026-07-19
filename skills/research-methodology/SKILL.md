---
name: research-methodology
description: Guidelines for conducting deep, practitioner-focused research using community-driven insights (Reddit, Hacker News, etc.) to avoid purely theoretical answers.
trigger: When the user asks for "strategies", "how to", "solutions", or "what people say" about a technical or professional topic.
---

# Research Methodology: Practitioner-First Approach

When tasked with finding solutions, strategies, or "how-to" guides, do not rely solely on internal training data. Instead, prioritize finding what actual practitioners are doing in the field.

## Workflow

1.  **Identify the Practitioner Domain**: Determine if the topic is discussed in developer forums (Reddit, HN, StackOverflow), professional networks, or academic circles.
2.  **Targeted Community Search**: Use `web_search` with site-specific operators:
    *   `site:reddit.com [topic]`
    *   `site:news.ycombinator.com [topic]`
    *   `site:stackoverflow.com [topic]`
3.  **Synthesize "Real-World" Data**:
    *   Look for **consensus** (what most people agree works).
    *   Look for **debate** (where experts disagree or mention trade-offs).
    *   Identify **"hacks" or workarounds** (non-obvious solutions used in production).
4.  **Report the "Ground Truth"**: Present the findings as "What practitioners are saying" or "Real-world observations" rather than just "The solution is...".

## Pitfalls

*   **Theoretical Bias**: Avoid giving a "textbook" answer if the community consensus is different.
*   **Ignoring Trade-offs**: Practitioner discussions often highlight *why* a solution is hard or expensive. Always include these trade-offs.
*   **Treating Search as Fact**: Treat forum posts as *anecdotal evidence* and report them as such (e.g., "Users on Reddit suggest..." instead of "The solution is...").
