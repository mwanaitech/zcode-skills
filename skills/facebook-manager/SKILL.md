---
name: facebook-manager
description: Full management of Facebook Pages, Posts, Insights, and Ads via Graph API.
trigger: facebook OR facebook-manager OR post on facebook OR ads facebook OR facebook stats
tags: [marketing, social-media, facebook, ads, automation]
---

# Facebook Manager Skill

This skill enables the agent to interact with the Facebook Graph API to manage pages, create content, analyze engagement, and manage advertising campaigns.

## Prerequisites

The following environment variables must be present in `~/.hermes/.env`:
- `FB_USER_ACCESS_TOKEN`: Your personal user access token.
- `FB_PAGE_ACCESS_TOKEN`: Your page's access token.
- `FB_PAGE_ID`: The ID of your target Facebook page.

## Core Capabilities

### 1. Content Management (Posting)
Use `curl` via `terminal` to post content (text, images, links) to the target page.
**Command Template:**
`curl -X POST "https://graph.facebook.com/v20.0/{page_id}/feed" -d "message={message}" -d "access_token={FB_PAGE_ACCESS_TOKEN}"`

### 2. Insights & Analytics
Retrieve engagement metrics (reach, impressions, clicks) for posts or the page.
**Command Template:**
`curl -G "https://graph.facebook.com/v20.0/{page_id}/insights" -d "metric={metric_names}" -d "period={day|week|days}" -d "access_token={FB_PAGE_ACCESS_TOKEN}"`

### 3. Ad Management
Interact with the Marketing API to create/update campaigns.
**Command Template:**
`curl -X POST "https://graph.facebook.com/v20.0/act_{ad_account_id}/campaigns" -d "name={name}" -d "objective={objective}" -d "access_token={FB_USER_ACCESS_TOKEN}"`

### 4. Engagement (Comments/Messages)
Read and reply to comments on posts.

## Workflow Guidelines

- **Always verify token existence** before attempting a call.
- **Use JSON output** for all Graph API calls (`| jq` if available) to ensure structured data for analysis.
- **Check error codes**: Facebook returns detailed error messages in the JSON response.
- **Respect rate limits**: Do not perform high-frequency polling.

## Pitfalls

- **Token Expiry**: Always check if the token is still valid by calling `/me`.
- **Permission Scope**: Ensure the token has the specific permission (e.g., `pages_manage_posts`) required for the action.
- **Sandbox vs Production**: Ensure you are targeting the correct Ad Account ID.
