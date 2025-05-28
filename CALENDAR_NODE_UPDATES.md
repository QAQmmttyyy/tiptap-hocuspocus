# 日历节点更新日志

## 最新修改 (2025-05-27)

### 修改内容

我们对日历节点进行了以下三个重要修改：

#### 1. 移除hover时的卡片缩放效果

**问题**: 原来的日历卡片在hover时会有缩放效果，影响用户体验。

**解决方案**: 
- 移除了 `hover:scale-[1.02] transform-gpu` 类
- 保留了其他hover效果如阴影和边框颜色变化

**修改文件**: `src/components/calendar-node.tsx`

```diff
- hover:scale-[1.02] transform-gpu
+ // 移除缩放效果
```

#### 2. 选中calendar node时不显示bubble menu

**问题**: 当用户选中日历节点时，BubbleMenu仍然会显示，这会干扰日历节点的交互。

**解决方案**: 
- 在BubbleMenu组件中添加了 `shouldShow` 属性
- 检查当前选中的节点或选中范围内是否包含calendar节点
- 如果包含calendar节点，则不显示BubbleMenu

**修改文件**: `src/components/collaborative-editor.tsx`

```typescript
shouldShow={({ state, from, to }) => {
  // 如果选中的是calendar节点，不显示bubble menu
  const { selection } = state
  const { $from } = selection
  
  // 检查当前选中的节点是否是calendar节点
  if ($from.parent.type.name === 'calendar') {
    return false
  }
  
  // 检查选中范围内是否包含calendar节点
  let hasCalendarNode = false
  state.doc.nodesBetween(from, to, (node) => {
    if (node.type.name === 'calendar') {
      hasCalendarNode = true
      return false
    }
  })
  
  if (hasCalendarNode) {
    return false
  }
  
  // 默认的显示逻辑：有选中文本时显示
  return from !== to
}}
```

#### 3. 修复日期选择数据同步问题

**问题**: 在协作环境中，当其他用户修改日历节点的日期时，本地组件状态没有正确同步。

**解决方案**: 
- 添加了 `useEffect` 钩子来监听 `node.attrs.selectedDate` 的变化
- 当节点属性中的日期发生变化时，自动更新本地状态
- 确保多用户协作时日期选择能够实时同步

**修改文件**: `src/components/calendar-node.tsx`

```typescript
// 同步node.attrs中的日期到本地状态
useEffect(() => {
  if (node.attrs.selectedDate) {
    const nodeDate = new Date(node.attrs.selectedDate)
    if (!date || date.getTime() !== nodeDate.getTime()) {
      setDate(nodeDate)
    }
  } else if (date) {
    setDate(undefined)
  }
}, [node.attrs.selectedDate, date])
```

### 技术细节

#### 样式优化
- 完全使用Tailwind CSS实现样式
- 移除了自定义CSS文件中的日历节点样式
- 优化了动画效果和过渡

#### 协作同步
- 确保日历节点的所有属性（标题、日期）都能在多用户间实时同步
- 修复了本地状态与节点属性不一致的问题

#### 用户体验
- 选中日历节点时不再显示干扰性的BubbleMenu
- 移除了不必要的hover缩放效果
- 保持了其他交互反馈效果

### 测试建议

1. **基本功能测试**
   - 插入日历节点
   - 编辑标题和选择日期
   - 删除节点

2. **协作同步测试**
   - 在多个浏览器窗口中测试日期选择同步
   - 测试标题编辑的实时同步

3. **UI交互测试**
   - 验证选中日历节点时BubbleMenu不显示
   - 确认hover效果正常但无缩放
   - 测试各种动画效果

### 文件变更列表

- ✅ `src/components/calendar-node.tsx` - 主要修改
- ✅ `src/components/collaborative-editor.tsx` - BubbleMenu逻辑
- ✅ `src/styles/tiptap.css` - 移除自定义样式

### 下一步计划

这些修改完善了日历节点的基本功能，为后续扩展奠定了良好基础：

1. 可以考虑添加更多日历功能（时间选择、事件等）
2. 可以创建其他类型的自定义节点
3. 可以优化协作同步的性能 