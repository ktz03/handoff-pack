# handoff-pack

**Multi-model Agent context handoff packet CLI**

Compress OpenAI-compatible `messages[]` into a paste-ready resume pack for the next model — local-first, IDE-agnostic, with secret redaction and before/after token stats.

Repo: [github.com/ktz03/handoff-pack](https://github.com/ktz03/handoff-pack)

## Why this exists

Coding / Agent sessions are context silos. Switching models (DeepSeek ↔ OpenAI-compatible ↔ Ollama) needs a **handoff layer**, not another IDE plugin.

```
messages.json → redact secrets → priority compress → RESUME.md / JSON packet
```

### vs similar tools

| | handoff-pack | Claude-session relay tools | deterministic git handoff kits |
|--|--|--|--|
| Input | OpenAI-compatible `messages[]` | Vendor session JSONL | git / filesystem |
| Secret scan | yes | varies | yes |
| Packet fields | task_state / plans A·B·C / compressed_messages | resume prompt | markdown resume |
| Dependency | Node ≥18, zero npm deps | often agent-specific | often git-only |

## Quick start

```bash
git clone https://github.com/ktz03/handoff-pack.git
cd handoff-pack
node bin/handoff-pack.js preview examples/long.session.json --max-tokens 200
node bin/handoff-pack.js pack examples/long.session.json --max-tokens 200 --out examples/RESUME.long.md
npm test
```

## Demo metrics (reproducible)

On `examples/long.session.json` with `--max-tokens 200`:

| Metric | Value |
|--|--|
| Tokens before → after | 508 → 181 (**64.4%**) |
| Secrets redacted | ≥1 (demo key) |
| Kept signals | system + tool/error + recent turns |

```bash
npm run demo:long
```

## CLI

| Command | Description |
|--------|-------------|
| `preview <file>` | Token before/after, compression %, secrets |
| `pack <file>` | Write `RESUME.md` or `--json` packet |
| `--max-tokens N` | Budget (default 1600) |
| `--out path` | Output path |
| `--json` | Structured packet JSON |

## Compression priority

1. All `system` messages  
2. High-signal turns (`tool`, `tool_calls`, error / 429 / timeout)  
3. Most recent user/assistant turns until budget fills  

## Packet fields

- `task_state` — goal / last assistant / blockers / open questions  
- `next_actions` — continue checklist  
- `plans` — A / B / C fallback paths  
- `compressed_messages` — budget-fitted history  

## Test

```bash
npm test
```

## License

MIT
