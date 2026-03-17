# Agent-Kit — Hướng Dẫn Sử Dụng Chi Tiết

> **Agent-Kit** là framework quản lý bộ nhớ AI và điều phối cho lập trình viên.
> Hỗ trợ quản lý context nhẹ, MCP server cho IDE, hệ thống plugin, và workflow dựa trên graph.

[![npm](https://img.shields.io/npm/v/agent-kit)](https://www.npmjs.com/package/agent-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

---

## Mục Lục

1. [Cài Đặt](#1-cài-đặt)
2. [Bắt Đầu Nhanh](#2-bắt-đầu-nhanh)
3. [Khởi Tạo Dự Án](#3-khởi-tạo-dự-án)
4. [Quản Lý Phiên Làm Việc](#4-quản-lý-phiên-làm-việc)
5. [Hệ Thống Bộ Nhớ](#5-hệ-thống-bộ-nhớ)
6. [Truy Xuất Context](#6-truy-xuất-context)
7. [Tính Năng AI](#7-tính-năng-ai)
8. [MCP Server (Tích Hợp IDE)](#8-mcp-server-tích-hợp-ide)
9. [Hệ Thống Plugin](#9-hệ-thống-plugin)
10. [Graph Workflow](#10-graph-workflow)
11. [Đa Agent & Khóa Tài Nguyên](#11-đa-agent--khóa-tài-nguyên)
12. [Giám Sát & Công Cụ](#12-giám-sát--công-cụ)
13. [Cấu Hình](#13-cấu-hình)
14. [Agent-Kit Skills](#14-agent-kit-skills)
15. [API Lập Trình](#15-api-lập-trình)
16. [Cấu Trúc Thư Mục](#16-cấu-trúc-thư-mục)
17. [Câu Hỏi Thường Gặp](#17-câu-hỏi-thường-gặp)

---

## 1. Cài Đặt

### Yêu Cầu Hệ Thống

- **Node.js** phiên bản 20 trở lên
- **npm** hoặc **pnpm**
- **Git** (khuyến nghị, để trích xuất insight từ commit)

### Cài Đặt Toàn Cục

```bash
npm install -g agent-kit
```

### Kiểm Tra

```bash
agent --version
```

---

## 2. Bắt Đầu Nhanh

```bash
# 1. Khởi tạo trong dự án của bạn
cd my-project
agent init

# 2. Bắt đầu phiên làm việc
agent start

# 3. Làm việc bình thường (code, commit, test...)

# 4. Thêm kiến thức thủ công
agent memory add --title "Dùng JWT cho auth" --content "JWT refresh token xoay vòng 7 ngày"

# 5. Truy xuất context
agent context --query "authentication"

# 6. Kết thúc phiên (tự động trích xuất insight)
agent end
```

---

## 3. Khởi Tạo Dự Án

### Khởi tạo tự động

```bash
agent init
```

**Agent-Kit sẽ tự động:**
- Phát hiện ngôn ngữ (TypeScript, Python, Go...)
- Phát hiện framework (Next.js, Express, Django...)
- Phát hiện Git status
- Hiển thị preview cấu hình → xác nhận → tạo `.agent/`
- Cài đặt 12 skills vào `.agent/skills/`

### Khởi tạo không tương tác (CI/CD)

```bash
agent init -y
```

### Re-initialize

```bash
agent init
# "Agent-Kit is already initialized. Re-initialize? [y/N]"
```

### Sau khi khởi tạo

```
.agent/
├── config.yaml          # Cấu hình dự án
├── project/             # Bộ nhớ dự án (git-tracked)
├── working/             # Bộ nhớ phiên (gitignored)
├── private/             # Bộ nhớ riêng tư (gitignored)
├── sessions/            # Lịch sử phiên (gitignored)
├── skills/              # 12 agent-kit skills
├── plugins/             # Plugin tùy chỉnh
└── locks/               # Khóa tài nguyên
```

---

## 4. Quản Lý Phiên Làm Việc

### Bắt đầu phiên

```bash
agent start
```

**Khi bắt đầu phiên:**
- Tạo file khóa `.agent/.session.lock`
- Tải tất cả bộ nhớ dự án + knowledge
- Bộ nhớ working bắt đầu trống
- Hiển thị: `⚡ Session started. 12 memories available.`

### Phát hiện phiên mồ côi

Nếu phiên trước chưa kết thúc:

```
⚠️ Previous session still active (started 3h ago)
[1] End previous and start new
[2] Resume
[3] Force new
```

### Kết thúc phiên

```bash
# Heuristic (nhanh, không cần AI)
agent end

# Với AI (insight phong phú hơn, cần cấu hình AI)
agent end --ai
```

**Khi kết thúc phiên:**
1. Trích xuất insight từ git diff + metadata
2. Hiển thị insight tìm được
3. Hỏi: "Save all insights as memories? [Y/n]"
4. Lưu insight → bộ nhớ dự án
5. Hiển thị: `📈 28 → 30 memories`

### Khôi phục sự cố

Nếu terminal crash giữa phiên:
```bash
agent start  # Tự phát hiện phiên chưa hoàn thành
# → "Resume previous session? [Y/n]"
```

---

## 5. Hệ Thống Bộ Nhớ

### Kiến Trúc Bộ Nhớ

```
┌─────────────────────────────────────────────────┐
│  TẦNG (nơi bộ nhớ lưu trữ)                     │
├─────────────────────────────────────────────────┤
│  knowledge  — Kiến thức phổ quát, đã chứng minh │
│  project    — Đặc thù dự án hiện tại            │
│  working    — Chỉ trong phiên hiện tại           │
│  private    — Cá nhân, không bao giờ chia sẻ     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  LOẠI (phân loại kiến thức)                     │
├─────────────────────────────────────────────────┤
│  decision    — "Chọn X vì Y"                    │
│  pattern     — "Luôn làm X theo cách này"       │
│  convention  — "Đặt tên file theo rule X"       │
│  insight     — "Tôi học được rằng X"            │
│  bug-learning— "X bị lỗi khi Y"                │
│  integration — "Service X yêu cầu Y"           │
│  preference  — "Tôi thích X hơn Y"             │
└─────────────────────────────────────────────────┘
```

### Định Dạng File

Mỗi bộ nhớ là một file Markdown với YAML frontmatter:

```markdown
---
id: jwt-refresh-rotation
title: "JWT tokens cần refresh rotation mỗi 7 ngày"
type: decision
tier: project
source: session-abc123
timestamp: "2026-03-17T10:00:00Z"
confidence: 0.95
tags: [auth, jwt, security]
---

Chúng tôi dùng JWT refresh tokens với chu kỳ xoay vòng 7 ngày.
Access tokens hết hạn sau 15 phút.
Implement trong auth-middleware.ts.
```

### Thao Tác CRUD

#### Xem danh sách bộ nhớ

```bash
# Xem tất cả
agent memory list

# Lọc theo tầng
agent memory list --tier project

# Giới hạn số lượng
agent memory list --limit 20

# Xuất JSON
agent memory list --json
```

#### Thêm bộ nhớ

```bash
# Tương tác (mở $EDITOR)
agent memory add

# Không tương tác
agent memory add --title "Dùng ESM imports" --content "Tất cả import dùng ESM syntax"

# Với AI tự động phân loại
agent memory add --title "Rate limit là per-IP" --content "API rate limit 100/min per IP, không per key" --auto
```

#### Sửa bộ nhớ

```bash
# Mở trong $EDITOR
agent memory edit jwt-refresh-rotation

# Đổi tầng (không cần mở editor)
agent memory edit jwt-refresh-rotation --tier knowledge
```

#### Xóa bộ nhớ

```bash
agent memory delete old-pattern
# → "Delete 'old-pattern'? [y/N]"
```

#### Thăng cấp bộ nhớ

```bash
# Tự động sang tầng tiếp theo
agent memory promote jwt-refresh-rotation

# Chỉ định tầng đích
agent memory promote jwt-refresh-rotation --to knowledge
```

#### Sửa inline

```bash
agent memory correct auth-pattern
# Mở editor → sửa → tự động cập nhật timestamp
```

### Đường Thăng Cấp

```
working → project → knowledge

working:   Tạm thời, trong phiên
project:   Hữu ích cho dự án này
knowledge: Kiến thức phổ quát, dùng cho mọi dự án
```

---

## 6. Truy Xuất Context

### Truy xuất thông minh

```bash
# Truy vấn theo từ khóa
agent context --query "authentication patterns"

# Xuất tất cả context
agent context

# Lọc theo tầng
agent context --tier project

# Xuất JSON
agent context --json
```

### Cách Hoạt Động

1. **Phân loại intent** — Xác định loại truy vấn (debug, architecture, howto...)
2. **Tìm kiếm từ khóa** — Grep trong nội dung + tên file
3. **Tìm kiếm ngữ nghĩa** — Cosine similarity với embeddings (nếu AI đã cấu hình)
4. **Xếp hạng** — Score = keyword_match × recency_decay × tier_weight
5. **Ưu tiên** — Working > Project > Knowledge

### Kết quả mẫu

```
## [0.92] JWT Refresh Token Rotation
*project · 2026-03-17*
JWT refresh tokens với chu kỳ xoay vòng 7 ngày...

## [0.78] API Rate Limiting
*project · 2026-03-16*
Rate limit 100/min per IP...
```

---

## 7. Tính Năng AI

### Cấu Hình AI Provider

#### Ollama (miễn phí, local, riêng tư)

```bash
# Cài Ollama
brew install ollama

# Tải model
ollama pull nomic-embed-text    # Cho embeddings
ollama pull llama3.2            # Cho completions

# Cấu hình agent-kit
agent config ai ollama
```

#### OpenAI (cloud, trả phí)

```bash
agent config ai openai --api-key sk-your-key-here
```

#### Xem cấu hình hiện tại

```bash
agent config ai
```

### Tính năng khi AI đã cấu hình

| Tính năng | Lệnh | Mô tả |
|-----------|-------|--------|
| 🔍 Tìm kiếm ngữ nghĩa | `agent context --query "..."` | Tìm theo ý nghĩa, không chỉ từ khóa |
| 🏷️ Tự động phân loại | `agent memory add --auto` | AI gợi ý type + tags |
| 💡 Insight thông minh | `agent end --ai` | LLM phân tích git commits |

### Tìm Kiếm Ngữ Nghĩa

Khi AI đã cấu hình, `agent context` tự động:
1. Embed truy vấn thành vector
2. So sánh cosine similarity với cache embeddings
3. Kết hợp kết quả semantic + keyword
4. Semantic được ưu tiên hơn keyword

### Tự Động Phân Loại

```bash
agent memory add \
  --title "Service X cần API key ở header" \
  --content "Gọi API service X phải truyền X-API-Key trong header, không phải query param" \
  --auto

# Output:
# 🤖 AI suggesting category...
#   Type: integration (92%)
#   Tags: api, service-x, authentication
# ✅ Memory 'service-x-api-key' saved.
```

### Insight Thông Minh

```bash
agent end --ai

# Output:
# 🤖 Using AI for insight extraction...
# 📝 3 insights found:
#   • Refactored auth middleware to support OAuth2
#   • Fixed race condition in session cleanup
#   • Added retry logic for external API calls
# Save all? [Y/n]
```

---

## 8. MCP Server (Tích Hợp IDE)

### Khởi động MCP Server

```bash
agent mcp start
```

### Cấu Hình IDE

**Cursor** — tạo file `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "agent-kit": {
      "command": "agent",
      "args": ["mcp", "start"]
    }
  }
}
```

**Claude Desktop** — sửa `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "agent-kit": {
      "command": "agent",
      "args": ["mcp", "start"]
    }
  }
}
```

### MCP Tools Có Sẵn

| Tool | Mô tả |
|------|--------|
| `agent_context` | Truy xuất bộ nhớ theo intent |
| `agent_memory_list` | Liệt kê bộ nhớ theo tầng |
| `agent_memory_add` | Thêm bộ nhớ mới |
| `agent_status` | Thống kê bộ nhớ |

---

## 9. Hệ Thống Plugin

### Tạo plugin mới

```bash
agent plugin init my-plugin
```

### Cấu trúc plugin

```typescript
// .agent/plugins/my-plugin/index.ts
export default {
  name: 'my-plugin',
  version: '1.0.0',

  // Hook lifecycle (tuỳ chọn)
  hooks: {
    onMemoryCreate: async (entry) => {
      console.log(`Bộ nhớ mới: ${entry.title}`);
    },
    onMemoryDelete: async (id) => {
      console.log(`Đã xóa: ${id}`);
    },
    onSessionStart: async (sessionId) => {
      console.log(`Phiên bắt đầu: ${sessionId}`);
    },
    onSessionEnd: async (sessionId) => {
      console.log(`Phiên kết thúc: ${sessionId}`);
    },
  },

  // Custom retriever (tuỳ chọn)
  retriever: {
    name: 'my-search',
    retrieve: async (query, memories) => {
      return memories
        .filter(m => m.content.includes(query))
        .map(m => ({ memory: m, score: 0.9 }));
    },
    priority: 10,
  },

  // Custom memory types (tuỳ chọn)
  memoryTypes: [
    { name: 'api-doc', description: 'Tài liệu API' },
  ],
};
```

### Quản lý plugin

```bash
# Liệt kê plugin đã cài
agent plugin list

# Xem chi tiết
agent plugin info my-plugin
```

---

## 10. Graph Workflow

### Workflow có sẵn

```bash
# Liệt kê
agent graph list

# Chạy workflow
agent graph run memory-review

# Chạy thử (xem kế hoạch)
agent graph run memory-consolidation --dry-run
```

### Tạo workflow tùy chỉnh

```typescript
import { StateGraph, END } from 'agent-kit/graph';

// Định nghĩa state
interface ReviewState {
  root: string;
  memories: any[];
  staleCount: number;
  report: string;
}

// Tạo graph
const graph = new StateGraph<ReviewState>()
  .addNode('scan', async (state) => {
    // Quét tất cả bộ nhớ
    return { ...state, memories: await loadAll(state.root) };
  })
  .addNode('analyze', async (state) => {
    // Phân tích chất lượng
    const stale = state.memories.filter(m => isStale(m));
    return { ...state, staleCount: stale.length };
  })
  .addNode('report', async (state) => {
    return { ...state, report: `Found ${state.staleCount} stale memories` };
  })
  .setEntryPoint('scan')
  .addEdge('scan', 'analyze')
  .addEdge('analyze', 'report')
  .addEdge('report', END);

// Chạy
const result = await graph.compile().invoke({ root: '/my/project' });
console.log(result.report);
```

### Conditional edges (rẽ nhánh)

```typescript
graph.addConditionalEdge('analyze', (state) => {
  return state.staleCount > 10 ? 'deep-clean' : 'quick-report';
});
```

---

## 11. Đa Agent & Điều Phối Task

### Tổng Quan Kiến Trúc

Khi nhiều agent (Cursor, Claude, Copilot...) cùng làm việc trên một dự án, agent-kit điều phối qua **3 cơ chế**:

```
┌─────────────────────────────────────────────────────────────┐
│                    DỰ ÁN CỦA BẠN                            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Cursor   │  │ Claude   │  │ Copilot  │   ← IDE Agents   │
│  │ Agent #1 │  │ Agent #2 │  │ Agent #3 │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │              │              │                        │
│       ▼              ▼              ▼                        │
│  ┌──────────────────────────────────────────┐               │
│  │           MCP SERVER (agent mcp start)    │  ← Giao diện │
│  │  agent_context | agent_memory_add | ...   │    chung      │
│  └──────────────────┬───────────────────────┘               │
│                     │                                        │
│       ┌─────────────┼─────────────┐                         │
│       ▼             ▼             ▼                         │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ LOCKS   │  │ PLUGINS  │  │ GRAPHS   │  ← Cơ chế         │
│  │ Tránh   │  │ Hooks    │  │ Pipeline │    điều phối       │
│  │ xung đột│  │ lifecycle│  │ workflow │                    │
│  └─────────┘  └──────────┘  └──────────┘                   │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────┐               │
│  │          .agent/ (Bộ nhớ chung)           │  ← Dữ liệu   │
│  │  project/ | working/ | embeddings/        │    chia sẻ    │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Luồng Khi Một Task Được Giao

**Ví dụ thực tế:** User yêu cầu "Thêm tính năng export PDF"

```
User: "Thêm tính năng export PDF"
         │
         ▼
┌─ IDE Agent (Cursor) ────────────────────────────────────────┐
│                                                              │
│  1. TRUY XUẤT CONTEXT                                        │
│     agent_context("export PDF")                              │
│     → Tìm bộ nhớ liên quan: patterns, conventions, APIs     │
│     → Kết hợp keyword + semantic search                      │
│                                                              │
│  2. ĐỌC KIẾN THỨC DỰ ÁN                                     │
│     agent_memory_list(tier="project")                        │
│     → Đọc conventions, decisions, integrations               │
│                                                              │
│  3. GIỮA KHÓA TRƯỚC KHI GHI                                  │
│     agent lock acquire "memory-write" --agent cursor-1       │
│     → Đảm bảo không agent nào khác ghi đồng thời            │
│                                                              │
│  4. IMPLEMENT + LƯU INSIGHT                                   │
│     agent_memory_add("PDF export dùng puppeteer")            │
│     → Tự động trigger plugin hooks (onMemoryCreate)          │
│     → Tự động embed nếu AI đã cấu hình                      │
│                                                              │
│  5. GIẢI PHÓNG KHÓA                                           │
│     agent lock release "memory-write" --agent cursor-1       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Cơ Chế 1: Advisory Locks (Khóa Tư Vấn)

Ngăn xung đột khi nhiều agent ghi đồng thời:

```bash
# Agent 1 giữ khóa
agent lock acquire memory-write --agent cursor-1
# → ✅ Lock acquired (expires in 5m)

# Agent 2 thử giữ cùng tài nguyên
agent lock acquire memory-write --agent claude-2
# → ❌ Resource 'memory-write' is locked by 'cursor-1' until 14:05:00

# Agent 1 hoàn thành, giải phóng
agent lock release memory-write --agent cursor-1

# Agent 2 retry → thành công
agent lock acquire memory-write --agent claude-2
# → ✅ Lock acquired
```

**Đặc điểm:**
- ⏰ **Tự hết hạn** — Mặc định 5 phút, tránh deadlock
- 🔄 **Stale cleanup** — Lock hết hạn tự động bị xóa
- ⚛️ **Atomic** — Dùng `wx` flag (exclusive create) tránh race condition
- 🔒 **Owner-only release** — Chỉ agent giữ lock mới được giải phóng
- 💪 **Force release** — `agent lock release --force` cho trường hợp khẩn cấp

### Cơ Chế 2: Coordinated Write (Ghi Phối Hợp)

API tự động xử lý lock → write → release với retry:

```typescript
import { coordinatedWrite } from 'agent-kit/coordination';

// Tự động: acquire lock → ghi memory → release lock
// Retry 3 lần với exponential backoff (200ms, 400ms, 800ms)
const result = await coordinatedWrite(root, memoryEntry, 'my-agent-id');

if (result.ok) {
  console.log('Ghi thành công!');
} else {
  console.log('Lỗi sau 3 lần retry:', result.error);
}
```

### Cơ Chế 3: Plugin Hooks (Sự Kiện Vòng Đời)

Mỗi agent có thể đăng ký plugin để phản ứng khi có thay đổi:

```typescript
registry.register({
  name: 'sync-notifier',
  version: '1.0.0',
  hooks: {
    // Khi bất kỳ agent nào tạo memory mới
    onMemoryCreate: async (entry) => {
      await notifyTeam(`Agent tạo memory: ${entry.title}`);
    },

    // Khi phiên bắt đầu
    onSessionStart: async (sessionId) => {
      await logActivity('session-start', sessionId);
    },

    // Khi phiên kết thúc
    onSessionEnd: async (sessionId) => {
      await generateReport(sessionId);
    },
  },
});
```

**Luồng sự kiện:**
```
Agent ghi memory → writeMemory() → onMemoryCreate hook → Plugin xử lý
Agent xóa memory → deleteMemory() → onMemoryDelete hook → Plugin xử lý
agent start      → startSession() → onSessionStart hook → Plugin xử lý
agent end        → endSession()   → onSessionEnd hook   → Plugin xử lý
```

### Cơ Chế 4: StateGraph Pipeline

Điều phối task phức tạp qua pipeline tự động:

```
┌──────┐    ┌──────────┐    ┌─────────┐    ┌────────┐
│ Scan │───►│ Analyze  │───►│ Decide  │───►│ Report │
│      │    │          │    │         │    │        │
│ Load │    │ Stale?   │    │ Fix or  │    │ Output │
│ all  │    │ Dupe?    │    │ Skip?   │    │ result │
│ mems │    │ Low conf?│    │         │    │        │
└──────┘    └──────────┘    └─────────┘    └────────┘
```

**Workflow có sẵn:**

| Workflow | Luồng | Mô tả |
|----------|-------|--------|
| `memory-review` | Scan → Analyze → Report | Tìm memory cũ, confidence thấp |
| `memory-consolidation` | Scan → Dedupe → Promote | Gộp trùng, thăng cấp |

```bash
# Chạy review
agent graph run memory-review

# Xem kế hoạch trước khi chạy
agent graph run memory-consolidation --dry-run
```

### Kịch Bản Thực Tế: 2 Agent Cùng Làm Việc

```
Timeline:
─────────────────────────────────────────────────────────

14:00  Cursor-1: agent context --query "auth patterns"
       → Đọc 5 memories liên quan

14:01  Claude-2: agent context --query "database models"
       → Đọc 3 memories liên quan (không xung đột, read-only)

14:05  Cursor-1: agent lock acquire memory-write --agent cursor-1
       → ✅ Khóa thành công

14:05  Claude-2: agent lock acquire memory-write --agent claude-2
       → ❌ Bị chặn, chờ...

14:06  Cursor-1: agent memory add --title "OAuth2 flow"
       → Ghi memory, trigger onMemoryCreate hook
       → agent lock release memory-write --agent cursor-1
       → ✅ Giải phóng

14:06  Claude-2: (retry tự động)
       → agent lock acquire memory-write --agent claude-2
       → ✅ Khóa thành công
       → agent memory add --title "User model schema"
       → agent lock release memory-write --agent claude-2

14:07  Cả hai agent đều thấy memories mới khi truy xuất tiếp
```

### Xem Trạng Thái Locks

```bash
agent lock status

# Output:
# Active Locks:
#   memory-write  │  cursor-1  │  acquired 14:05  │  expires 14:10
```

---

## 12. Giám Sát & Công Cụ

### Dashboard trạng thái

```bash
agent status
agent status --verbose   # Chi tiết theo category + storage
agent status --json      # Xuất JSON
```

### Kiểm tra sức khỏe

```bash
agent doctor
```

**6 kiểm tra tự động:**
1. ✅ Cấu hình hợp lệ
2. ✅ File bộ nhớ parseable
3. ✅ Không có phiên mồ côi
4. ✅ Không có bộ nhớ cũ > 30 ngày
5. ✅ Storage < 5MB
6. ✅ .gitignore đúng

**Tự sửa:** "Fix issues? [Y/n]"

### Thống kê bộ nhớ

```bash
agent stats
```

Hiển thị: số lượng theo tầng, kích thước, xu hướng tăng trưởng.

### Xuất phiên

```bash
agent export --session latest
agent export --session latest --json
```

### Audit log

Mọi thao tác CRUD đều được ghi vào `.agent/audit.log`:
```
[2026-03-17T10:00:00Z] CREATE memory/jwt-refresh OK
[2026-03-17T10:05:00Z] DELETE memory/old-pattern OK
```

Tự động xoay vòng khi file > 1MB.

---

## 13. Cấu Hình

### Quản lý cấu hình

```bash
# Xem tất cả
agent config list

# Đọc giá trị
agent config get verbosity

# Đặt giá trị
agent config set verbosity minimal

# Reset về mặc định
agent config reset

# Cấu hình AI
agent config ai                    # Xem cấu hình AI
agent config ai ollama             # Đặt provider = Ollama
agent config ai openai --api-key   # Đặt provider = OpenAI
```

### File cấu hình

`.agent/config.yaml`:

```yaml
version: "1"
userName: "hieunm"
communicationLanguage: "Vietnamese"
responseStyle: "technical"

ai:
  provider: "ollama"
  model: "llama3.2"
  embeddingModel: "nomic-embed-text"
  baseUrl: "http://localhost:11434"
```

---

## 14. Agent-Kit Skills

Agent-Kit đi kèm 12 skills theo phong cách BMAD, tự động cài khi `agent init`:

### Tier 1: Thiết Yếu

| Skill | Slash Command | Mô tả |
|-------|--------------|--------|
| Help | `/akit-help` | Trợ lý thông minh, gợi ý bước tiếp theo |
| Onboard | `/akit-onboard` | Hướng dẫn cài đặt từ đầu |
| Generate Context | `/akit-generate-context` | Tạo rules cho AI agent |
| Memory Guide | `/akit-memory-guide` | Hướng dẫn tổ chức bộ nhớ |
| Review Memories | `/akit-review-memories` | Kiểm tra chất lượng bộ nhớ |
| Session Flow | `/akit-session-flow` | Hướng dẫn phiên làm việc |

### Tier 2: Nâng Cao

| Skill | Slash Command | Mô tả |
|-------|--------------|--------|
| AI Setup | `/akit-ai-setup` | Cấu hình Ollama/OpenAI |
| Plugin Dev | `/akit-plugin-dev` | Tạo plugin tùy chỉnh |
| Create Graph | `/akit-create-graph` | Thiết kế StateGraph workflow |

### Tier 3: Lập Trình Viên

| Skill | Slash Command | Mô tả |
|-------|--------------|--------|
| Dev Story | `/akit-dev-story` | Implement story theo spec |
| Quick Spec | `/akit-quick-spec` | Tạo spec nhanh cho feature |
| Party Mode | `/akit-party-mode` | Thảo luận đa persona |

### Sử dụng Skills

Trong IDE có hỗ trợ BMAD/agent skills (Cursor, Claude Code...):

```
/akit-help
/akit-help Tôi vừa khởi tạo xong, tiếp theo làm gì?
```

---

## 15. API Lập Trình

Sử dụng agent-kit như thư viện:

```typescript
// Bộ nhớ
import { createMemory, listMemories, readMemory } from 'agent-kit/memory';

// Truy xuất thông minh
import { smartRetrieve } from 'agent-kit/retrieval';

// MCP server
import { createMcpServer } from 'agent-kit/mcp';

// Plugin registry
import { registry } from 'agent-kit/plugins';

// Graph builder
import { StateGraph, END } from 'agent-kit/graph';

// Khóa tài nguyên
import { acquireLock, releaseLock } from 'agent-kit/coordination';

// Cấu hình
import { getConfig, isInitialized } from 'agent-kit/config';

// Phiên
import { startSession, endSession } from 'agent-kit/session';
```

---

## 16. Cấu Trúc Thư Mục

```
.agent/                          # Thư mục gốc agent-kit
├── config.yaml                  # Cấu hình dự án
├── .session.lock                # Khóa phiên (khi đang active)
├── audit.log                    # Nhật ký hoạt động
├── project/                     # Bộ nhớ dự án (GIT-TRACKED)
│   ├── jwt-refresh-rotation.md
│   └── api-rate-limiting.md
├── working/                     # Bộ nhớ phiên (GITIGNORED)
├── private/                     # Bộ nhớ riêng tư (GITIGNORED)
├── sessions/                    # Lịch sử phiên (GITIGNORED)
├── skills/                      # Agent-kit skills
│   ├── akit-help/
│   ├── akit-onboard/
│   └── ...
├── plugins/                     # Plugin tùy chỉnh
├── locks/                       # File khóa tài nguyên
└── embeddings/                  # Cache embeddings AI
```

### Git tracking

| Thư mục | Git | Lý do |
|---------|-----|-------|
| `project/` | ✅ Tracked | Chia sẻ trong team |
| `working/` | ❌ Ignored | Tạm thời, theo phiên |
| `sessions/` | ❌ Ignored | Dữ liệu cá nhân |
| `private/` | ❌ Ignored | Riêng tư |
| `skills/` | ✅ Tracked | Có thể tùy chỉnh |

---

## 17. Câu Hỏi Thường Gặp

### Agent-Kit có gửi dữ liệu ra ngoài không?

**Không.** Agent-Kit hoạt động hoàn toàn local. Zero telemetry, zero data collection. Ngoại trừ khi bạn chủ động cấu hình AI provider (Ollama vẫn là local, OpenAI sẽ gửi query qua API).

### Dùng được với IDE nào?

Bất kỳ IDE nào. Agent-Kit là CLI tool, không phụ thuộc IDE. MCP server hỗ trợ tích hợp sâu với Cursor, Claude Desktop, và các IDE hỗ trợ MCP protocol.

### Bao nhiêu bộ nhớ là tối ưu?

- **50-200** bộ nhớ: Truy xuất nhanh, quản lý dễ
- **200-500**: Vẫn tốt, nên phân loại cẩn thận
- **500-1000**: Hiệu năng vẫn đảm bảo (< 10% chậm hơn)
- **> 1000**: Nên chạy `/akit-review-memories` để dọn dẹp

### Làm sao để team dùng chung?

1. Bật git tracking cho `.agent/project/` (mặc định)
2. Mỗi thành viên có `.agent/private/` riêng (gitignored)
3. Dùng `agent lock` để tránh ghi đè đồng thời
4. Bộ nhớ dạng file riêng lẻ → merge git không conflict

### Khác gì so với BMAD Method?

| | BMAD Method | Agent-Kit |
|--|-------------|-----------|
| **Focus** | Quy trình phát triển agile | Quản lý bộ nhớ & context |
| **Sử dụng** | Skills & workflows | CLI + API + MCP |
| **Mục đích** | Hướng dẫn quy trình | Lưu trữ & truy xuất kiến thức |
| **Kết hợp** | Dùng cùng nhau cho hiệu quả tối đa |

---

## Bảng Tham Chiếu Nhanh

| Lệnh | Mô tả |
|-------|--------|
| `agent init` | Khởi tạo dự án |
| `agent start` | Bắt đầu phiên |
| `agent end [--ai]` | Kết thúc phiên |
| `agent status` | Dashboard |
| `agent memory list` | Xem bộ nhớ |
| `agent memory add [--auto]` | Thêm bộ nhớ |
| `agent memory edit <id>` | Sửa bộ nhớ |
| `agent memory delete <id>` | Xóa bộ nhớ |
| `agent memory promote <id>` | Thăng cấp |
| `agent memory correct <id>` | Sửa inline |
| `agent context [--query]` | Truy xuất context |
| `agent doctor` | Kiểm tra sức khỏe |
| `agent config ai` | Cấu hình AI |
| `agent mcp start` | Khởi động MCP |
| `agent lock acquire <r>` | Giữ khóa |
| `agent graph run <name>` | Chạy workflow |
| `agent export` | Xuất dữ liệu |

---

**MIT License** · Tạo bởi [hieunm](https://github.com/hieumn12299) · [GitHub](https://github.com/hieumn12299/agent-kit)
