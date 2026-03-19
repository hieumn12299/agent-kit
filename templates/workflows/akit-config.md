---
description: View and modify Agent-Kit settings
---

## Configuration

1. Read `.agent/RULES.md` for global rules
2. Read `.agent/config.yaml` for language, style, and output settings
3. Respond in configured language and style.

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
