---
description: View and modify Agent-Kit settings
---

## Configuration

Read `.agent/config.yaml` for `communicationLanguage` and `responseStyle`. Respond in configured language.

### Usage
User says `/akit-config` to view or modify settings.

### Actions:

#### View Current Config
Read and display `.agent/config.yaml`:
```
⚙️ Agent-Kit Configuration

Setting              Value
───────────────────  ──────────
userName             {name}
communicationLanguage {language}
responseStyle        {style}
AI provider          {provider or "not configured"}
```

#### Modify Config
Ask: "What would you like to change?"

Options:
1. **Language** — Change `communicationLanguage` (English, Vietnamese, Japanese, etc.)
2. **Style** — Change `responseStyle` (technical, casual, formal)
3. **User name** — Update `userName`
4. **AI provider** — Run `/akit-ai-setup`

Update `.agent/config.yaml` directly.
