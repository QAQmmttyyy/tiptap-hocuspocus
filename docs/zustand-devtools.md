# Zustand DevTools 调试指南

## 📋 概述

项目中的 Zustand 状态管理已经集成了 Redux DevTools 支持，可以帮助开发者更好地调试和监控应用状态。

## 🚀 快速开始

### 1. 安装浏览器扩展

**Chrome：**
- 访问 [Chrome Web Store](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- 点击"添加至 Chrome"安装 Redux DevTools Extension

**Firefox：**
- 访问 [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)
- 点击"添加到 Firefox"安装

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 打开 DevTools

1. 在浏览器中打开应用 (http://localhost:3000)
2. 按 `F12` 或 `Cmd+Option+I` 打开开发者工具
3. 切换到 **"Redux"** 标签页

## 🛠️ 可用的 Store

### Tab Store (标签页管理)
- **名称**: `tab-store`
- **功能**: 管理文档标签页的打开、关闭、切换等状态
- **主要状态**:
  - `tabs`: 当前打开的标签页列表
  - `activeTabId`: 当前活跃的标签页ID
  - `maxTabs`: 最大标签页数量限制

### Sidebar Store (侧边栏管理)
- **名称**: `sidebar-store`
- **功能**: 管理侧边栏展开/收缩、搜索、筛选等状态
- **主要状态**:
  - `isOpen`: 侧边栏是否打开
  - `searchQuery`: 当前搜索关键词
  - `sortBy`: 排序方式
  - `showFavorites`: 是否显示收藏

## 📊 主要功能

### 1. 状态树查看
- 实时查看每个 store 的完整状态
- 支持展开/折叠状态节点
- 状态变化时自动高亮更新的字段

### 2. Action 历史
- 查看所有触发的 action 序列
- 每个 action 显示详细的前后状态对比
- 支持按 action 名称筛选

### 3. 时间旅行调试
- 点击任意历史 action 跳转到对应状态
- 使用 "跳过" 功能临时禁用某些 action
- "重置" 功能清空历史记录

### 4. 状态导入/导出
- 导出当前状态为 JSON 文件
- 导入状态用于测试和 Bug 复现
- 支持状态快照功能

## 🎯 调试技巧

### 1. 筛选 Action
```javascript
// 在 DevTools 中使用筛选器
// 只显示标签页相关的操作
Filter: "tab"

// 过滤掉频繁的状态更新
Filter: "!_internal"
```

### 2. 设置断点
- 在 Redux DevTools 中设置条件断点
- 当特定状态变化时暂停执行
- 结合浏览器断点调试具体代码

### 3. 性能监控
```javascript
import { debugStore } from '@/lib/devtools'

// 监控操作性能
debugStore.timeAction('openNewTab', () => {
  useTabStore.getState().openTab(document)
})

// 打印状态快照
debugStore.logState('tab-store', useTabStore.getState())
```

### 4. 状态持久化调试
- Sidebar Store 支持状态持久化
- 可以在 DevTools 中查看持久化的状态
- 清除 localStorage 观察状态恢复过程

## 🔧 开发环境配置

DevTools 仅在开发环境中启用：

```typescript
// 自动检测开发环境
{
  name: 'tab-store',
  enabled: process.env.NODE_ENV === 'development',
}
```

## 📝 常见问题

### Q: DevTools 标签页没有出现？
A: 确保已安装 Redux DevTools 扩展，并且在开发环境中运行应用。

### Q: 状态更新但 DevTools 没有显示？
A: 检查是否有控制台错误，确保状态更新通过 `set()` 函数进行。

### Q: 如何在生产环境中禁用 DevTools？
A: DevTools 已配置为仅在开发环境启用，生产构建会自动禁用。

### Q: 状态过多导致 DevTools 卡顿？
A: 可以调整 `maxAge` 参数限制历史记录数量，或使用筛选器减少显示的 action。

## 🚀 高级用法

### 自定义 Action 名称
```typescript
// 在 store 中为 action 提供描述性名称
set((state) => ({ 
  tabs: [...state.tabs, newTab] 
}), false, 'openTab/addNewTab')
```

### 状态快照测试
```typescript
// 导出特定场景的状态快照
const snapshot = useTabStore.getState()
localStorage.setItem('test-snapshot', JSON.stringify(snapshot))

// 在测试中恢复状态
const testState = JSON.parse(localStorage.getItem('test-snapshot'))
useTabStore.setState(testState)
```

---

## 📚 相关资源

- [Zustand DevTools 官方文档](https://github.com/pmndrs/zustand#redux-devtools)
- [Redux DevTools 扩展文档](https://extension.remotedev.io/)
- [状态管理最佳实践](https://github.com/pmndrs/zustand/blob/main/docs/guides/practice-with-no-store-actions.md) 