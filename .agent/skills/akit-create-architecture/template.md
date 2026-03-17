---
title: "{product_name} Architecture"
version: "1.0"
date: "{date}"
author: "{user_name}"
status: "Draft"
---

# Architecture: {product_name}

## 1. Overview
{Brief description of the system and its purpose}

## 2. Technology Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Language | {language} | {version} | {why} |
| Framework | {framework} | {version} | {why} |
| Database | {database} | {version} | {why} |
| Auth | {auth_method} | - | {why} |
| Hosting | {platform} | - | {why} |
| CI/CD | {tool} | - | {why} |

## 3. System Architecture

### 3.1 High-Level Diagram
```
{ASCII diagram of components and connections}
```

### 3.2 Components
| Component | Responsibility | Key APIs |
|-----------|---------------|----------|
| {component} | {responsibility} | {apis} |

## 4. Data Model

### 4.1 Entities
```
{Entity relationships}
```

### 4.2 Key Tables/Collections
| Entity | Fields | Relationships |
|--------|--------|--------------|
| {entity} | {key_fields} | {relationships} |

## 5. API Design

### 5.1 Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| {method} | {path} | {description} | {required?} |

## 6. Design Decisions

### Decision 1: {title}
- **Chosen:** {option}
- **Alternatives:** {other options}
- **Rationale:** {why}
- **Trade-offs:** {compromises}

## 7. Deployment

### 7.1 Environments
| Environment | URL | Purpose |
|------------|-----|---------|
| Development | localhost | Local dev |
| Staging | {url} | Testing |
| Production | {url} | Live |

### 7.2 Infrastructure
```
{Deployment diagram}
```

## 8. Security Considerations
- {security item 1}
- {security item 2}

## 9. Scalability Plan
- {scaling strategy}
