---
name: pull-and-analyze
description: 拉取GitHub PR的完整上下文信息并进行初步分析。当收到PR链接或编号时使用此技能，提取代码变更、PR描述、关联Issue和分支状态。
---

## PR拉取与分析流程

1. 使用 `gh pr view <PR编号> --json title,body,files,commits,reviews,labels,assignees` 获取PR元数据
2. 使用 `gh pr diff <PR编号>` 获取完整diff
3. 检查关联Issue：`gh pr view <PR编号> --json closingIssuesReferences`
4. 检查分支状态：`git status` 和 `git log --oneline -10`
5. 分析变更范围，列出：
   - 修改的文件清单及变更类型（新增/修改/删除）
   - 变更涉及的模块和功能域
   - 潜在影响范围（哪些下游模块可能受影响）
6. 生成结构化分析报告，格式：
   ```
   ## PR分析报告
   - **标题**: ...
   - **变更文件数**: ...
   - **核心变更**: ...
   - **影响范围**: ...
   - **建议审查重点**: ...
   ```