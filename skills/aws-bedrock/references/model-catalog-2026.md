# AWS Bedrock Model Catalog — July 2026

18 providers, 100+ models. Source: hidekazu-konishi.com snapshot (2026-05-16) + AWS docs.

## Model Count by Provider

| Provider | GA models |
|----------|-----------|
| Stability AI | 16 (image gen/editing) |
| Amazon | 16 (Nova, Titan) |
| Mistral AI | 14 (Large, Pixtral, Ministral, Voxtral, Devstral, Magistral) |
| Meta | 12 (Llama 4, Llama 3.x) |
| Anthropic | 11 (Claude Opus 4.7/4.6/4.5/4.1, Sonnet 4.6/4.5, Haiku 4.5, Fable 5, Mythos 5) |
| Qwen | 7 (Qwen3 235B A22B, VL, Coder Next, 32B) |
| Cohere | 6 (Command legacy, Embed, Rerank) |
| OpenAI | 4 (GPT-OSS 120B/20B, Safeguard 120B/20B) |
| NVIDIA | 4 (Nemotron 3 Super 120B, Nano 30B/12B/9B) |
| Z.AI | 3 (GLM 5, GLM 4.7, GLM 4.7 Flash) |
| MiniMax | 3 (M2.5, M2.1, M2) |
| Google | 3 (Gemma 3 27B/12B/4B) |
| Writer | 3 (Palmyra X5, X4, Vision 7B) |
| TwelveLabs | 3 (Marengo Embed 3.0/v2.7, Pegasus v1.2) |
| DeepSeek | 3 (V3.2, V3, R1) |
| Moonshot AI | 2 (Kimi K2.5, K2 Thinking) |
| AI21 Labs | 2 (Jamba 1.5 Large/Mini) |
| Luma AI | 1 (Ray v2 video) |

## Best Non-Claude Models (cost vs quality)

| Model | Est. Input/M | Notes |
|-------|------------|-------|
| DeepSeek V3.2 | ~$0.50 | Excellent reasoning, very cheap |
| Mistral Large 3 (675B) | ~$2–3 | Vision, agentic, multi-lingual |
| Amazon Nova 2 Lite | ~$0.15 | 1M ctx, super cheap, big tasks |
| Qwen3 235B A22B | ~$1–2 | Multi-lingual, agentic, strong overall |
| Kimi K2.5 | ~$1–2 | 256K ctx, long reasoning |
| NVIDIA Nemotron 3 120B | ~$1.50 | Specialized for multi-agent |
| GPT-OSS 120B | ~$2 | OpenAI open-weight generalist |
| Google Gemma 3 27B | ~$0.30 | Open weight, fast |
| Z.AI GLM 5 | ~$0.50 | Agentic, tool use, very cheap |

## Inference Profile Rules

- **On-demand accounts MUST use inference profiles** — plain model IDs fail with `Invocation of model ID ... with on-demand throughput isn't supported.`
- **`global.` prefix**: `global.anthropic.claude-sonnet-4-20250514-v1:0` — routes across regions for max availability
- **`us.` prefix**: `us.anthropic.claude-sonnet-4-20250514-v1:0` — US-only cross-region
- **`eu.`/`apac.`/`jp.`/`au.` prefixes**: Available for some models
- **Legacy models (Claude 3.x, Llama 3.1/3.2, Cohere Command, Nova Gen 1) still use plain IDs** but have EOL dates
