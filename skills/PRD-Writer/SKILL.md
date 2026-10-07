---
name: prd-writer
description: Write strategy-oriented Product Requirements Documents (PRDs) for AI product managers. Use when: (1) drafting a new PRD or strategy doc, (2) structuring a feature proposal with strategy rationale, (3) writing requirement docs that emphasize "why" over "how", (4) turning raw product ideas into structured requirement documents. NOT for: purely technical specs, engineering tickets, or UI copy.
---

# PRD Writer

Produce structured, strategy-first PRDs for AI product managers.

## Core Philosophy

Strategy PRDs answer **why before what**. Every section should connect features back to business goals and user outcomes. Avoid feature laundry lists; prioritize decision rationale.

## Standard PRD Structure

Use this structure unless the user specifies otherwise:

### 1. 背景与目标 (Background & Goals)
- 产品背景：当前现状和痛点
- 战略目标：本需求解决什么业务问题
- 成功指标：可量化的 KPI / OKR

### 2. 用户与场景 (Users & Scenarios)
- 目标用户群体（细分）
- 核心使用场景（用户故事格式）
- 用户旅程关键节点

### 3. 产品方案 (Solution)
- 核心功能列表（MoSCoW 优先级）
- 关键交互逻辑
- 边界与限制（Not in scope）

### 4. 策略设计 (Strategy Design)
- 算法/策略说明（AI 产品重点）
- 数据依赖与冷启动策略
- A/B 测试方案

### 5. 技术依赖 (Technical Dependencies)
- 依赖系统/接口
- 数据需求
- 性能要求

### 6. 风险与降级 (Risks & Fallback)
- 主要风险点
- 降级方案

### 7. 里程碑 (Milestones)
- 分阶段交付计划

## Writing Guidelines

- 用中文撰写，除非用户指定英文
- 策略逻辑要显式说明，不要隐含在功能描述里
- 每个功能点标注优先级：P0/P1/P2 或 Must/Should/Could
- AI 策略类需求必须包含：输入信号、模型/策略逻辑、输出形式、兜底规则

## Reference Files

- **references/prd-template.md** — 完整 PRD 模板（Markdown）
- **references/strategy-patterns.md** — 常见 AI 产品策略模式（推荐、排序、召回、意图识别等）

Read references when: user asks for a full template, or when the PRD involves AI/ML strategy components.

# PRD Writer - 产品需求文档撰写助手

将产品需求转化为专业、结构化的 PRD 文档。

## 工作流程

### 步骤 1：需求分析

在开始撰写 PRD 之前，必须充分理解需求：

**需要收集的信息：**
- [ ] 功能背景：为什么要做这个功能？解决什么问题？
- [ ] 目标用户：这个功能为谁而做？
- [ ] 核心场景：用户在什么场景下使用？
- [ ] 业务目标：期望达到什么效果？（数据指标）
- [ ] 竞品参考：有竞品参考吗？差异化点是什么？
- [ ] 约束条件：有什么技术/资源/时间限制？

**分析输出：**
```markdown

## 需求摘要
- 功能名称：
- 功能背景：
- 目标用户：
- 核心场景：
- 业务目标：
- 优先级：P0/P1/P2
- 期望上线时间：
```

### 步骤 2：PRD 文档输出

基于需求分析，输出完整的 PRD 文档：

---

## PRD 文档模板

```markdown

# PRD：{功能名称}

## 1. 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | YYYY-MM-DD |
| 作者 | |
| 评审人 | |
| 状态 | 草稿/评审中/已确认 |

## 2. 背景与目标

### 2.1 背景
{描述为什么要做这个功能，当前存在的问题或机会}

### 2.2 目标
{描述期望达到的业务目标和用户价值}

### 2.3 成功指标
- 指标1：{具体指标}，目标值：{数值}
- 指标2：{具体指标}，目标值：{数值}

## 3. 用户场景

### 3.1 目标用户
{描述目标用户画像}

### 3.2 用户故事
作为 {用户角色}，我希望 {需求}，以便 {价值}。

### 3.3 使用场景
**场景1：** {场景描述}
- 触发条件：
- 用户行为：
- 预期结果：

## 4. 功能需求

### 4.1 功能清单

| 功能模块 | 功能点 | 优先级 | 备注 |
|---------|--------|--------|------|
| 模块A | 功能点1 | P0 | |
| 模块A | 功能点2 | P1 | |
| 模块B | 功能点3 | P0 | |

### 4.2 功能详情

#### 4.2.1 {功能点名称}

**需求描述：**
{详细描述功能需求}

**交互流程：**
1. 步骤1：
2. 步骤2：
3. 步骤3：

**页面元素：**

| 元素 | 类型 | 说明 | 校验规则 |
|------|------|------|---------|
| | | | |

**异常处理：**
- 异常场景1：{处理方式}
- 异常场景2：{处理方式}

**埋点需求：**
- 事件1：{事件名称}，{触发时机}
- 事件2：{事件名称}，{触发时机}

## 5. 非功能需求

### 5.1 性能需求
- {性能指标要求}

### 5.2 安全需求
- {安全要求}

### 5.3 兼容性需求
- {兼容性要求}

## 6. 界面原型

### 6.1 页面流程图
{描述页面流转}

### 6.2 关键页面
{描述关键页面的布局和内容}

## 7. 数据需求

### 7.1 数据埋点
{列出需要埋点的事件和属性}

### 7.2 数据报表
{列出需要的数据报表}

## 8. 风险评估

| 风险类型 | 风险描述 | 影响程度 | 应对措施 |
|---------|---------|---------|---------|
| 技术风险 | | 高/中/低 | |
| 业务风险 | | 高/中/低 | |
| 资源风险 | | 高/中/低 | |

## 9. 项目计划

### 9.1 里程碑

| 阶段 | 交付物 | 截止日期 | 负责人 |
|------|--------|---------|--------|
| 需求评审 | PRD定稿 | | |
| 设计阶段 | 设计稿 | | |
| 开发阶段 | 功能上线 | | |
| 验收阶段 | 验收通过 | | |

### 9.2 依赖项
- {列出项目依赖的其他团队或功能}

## 10. 附录

### 10.1 术语表
- {术语}：{解释}

### 10.2 参考文档
- {文档链接}

### 10.3 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | | 初稿 | |
```

---

## 使用示例

### 示例 1：新功能 PRD

**用户输入：**
> 我们要做一个"智能股价提醒"功能，让用户可以设置股价提醒，当股价达到设定价位时通过飞书通知用户。

**步骤 1 - 需求分析：**
- 功能背景：用户需要实时监控股价，及时获取交易信号
- 目标用户：个人投资者
- 核心场景：设置提醒价位 → 系统监控 → 触发通知
- 业务目标：提升用户交易效率，增加用户粘性

**步骤 2 - PRD 输出：**
[按照模板输出完整 PRD]

### 示例 2：功能优化 PRD

**用户输入：**
> 优化现有的股价监控功能，增加批量设置和智能推荐价位功能。

**步骤 1 - 需求分析：**
- 功能背景：现有功能只能单只股票设置，效率低
- 目标用户：持仓多只股票的用户
- 核心场景：批量导入股票 → 智能推荐价位 → 一键设置

**步骤 2 - PRD 输出：**
[按照模板输出完整 PRD]

## 注意事项

1. **先分析，后输出** - 不要跳过需求分析直接写 PRD
2. **保持简洁** - PRD 不是越厚越好，关键信息清晰即可
3. **可验证** - 每个需求都应该是可测试、可验证的
4. **及时同步** - PRD 是协作工具，需要与团队同步评审
5. **版本管理** - 重大变更需要记录变更历史

## 输出格式

- 使用 Markdown 格式
- 表格用于结构化信息
- 列表用于枚举项
- 代码块用于示例数据
