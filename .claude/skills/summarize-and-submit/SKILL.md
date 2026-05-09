---
name: summarize-and-submit
description: 汇总所有审查和测试结果，生成最终报告并执行git提交和PR操作。在审查和测试环节完成后使用此技能。
---

## 汇总与提交流程

1. 收集所有环节的输出：
   - 代码审查发现的问题清单
   - 测试执行结果和覆盖率
   - 文档更新状态
2. 生成汇总报告：
   ```
   ## 审查总结
   ### 发现问题
   - [严重程度] 问题描述 (文件:行号)
   ### 测试结果
   - 通过/失败/跳过数量
   ### 建议操作
   - 必须修复 / 建议改进 / 可选优化
   ```
3. 如需提交代码修复：
   - `git add` 相关文件
   - 使用规范commit message: `<type>(<scope>): <description>`
   - type: feat/fix/refactor/test/docs/chore
   - `git push`
4. 在PR上添加评论：`gh pr comment <编号> --body "报告内容"`
5. 根据审查结果决定：approve / request-changes / comment