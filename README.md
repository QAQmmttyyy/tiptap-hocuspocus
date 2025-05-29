# 实时协作文档编辑器

基于 Next.js、Tiptap、Hocuspocus 和 shadcn/ui 构建的现代化实时协作文档编辑器。

## 技术栈

- **Next.js 15** - React 全栈框架（App Router）
- **Tiptap 2.12** - 现代富文本编辑器框架
- **Hocuspocus 3.1** - 实时协作后端服务
- **Yjs 13.6** - 共享数据类型，用于实时协作
- **shadcn/ui** - 基于 Radix UI 的现代组件库
- **Tailwind CSS 4** - 实用优先的 CSS 框架
- **TypeScript** - 类型安全的 JavaScript

## 功能特性

### ✅ 核心协作功能
- **实时多用户协作编辑** - 支持无限用户同时编辑
- **协作光标同步** - 实时显示其他用户的光标位置和选中内容
- **用户在线状态** - 显示当前协作的用户列表
- **连接状态监控** - 实时显示连接状态和用户数量

### ✅ 富文本编辑功能
- **标题支持** - H1、H2、H3 多级标题
- **文本格式** - 粗体、斜体、删除线、行内代码
- **列表功能** - 有序列表、无序列表，支持嵌套
- **引用块** - 支持引用文本
- **代码块** - 语法高亮的代码块
- **自定义扩展** - 日历组件等自定义节点

### ✅ 用户界面功能
- **Bubble Menu** - 选中文本时的浮动工具栏
- **现代化设计** - 基于 shadcn/ui 的美观界面
- **响应式设计** - 适配移动端和桌面端
- **暗色主题支持** - 完整的主题切换能力
- **服务器管理界面** - 可视化的服务器启停控制

### ✅ 系统功能
- **集成式部署** - Hocuspocus 服务器集成在 Next.js 中
- **API 管理** - RESTful API 控制协作服务器
- **自动重连** - 网络中断时自动重新连接
- **文档管理** - 支持多文档切换和新建

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 4. 启动协作功能

1. 在首页点击"启动服务器"按钮
2. 输入用户名和文档ID
3. 点击"开始协作编辑"
4. 在不同浏览器窗口中使用相同文档ID进行多用户测试

## 📁 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── collaboration/
│   │       └── route.ts           # 协作服务器 API 路由
│   ├── test/
│   │   └── page.tsx               # 编辑器测试页面
│   ├── page.tsx                   # 主页面
│   ├── layout.tsx                 # 根布局
│   ├── globals.css                # 全局样式和主题
│   └── favicon.ico
├── components/
│   ├── ui/                        # shadcn/ui 组件库
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── calendar.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   └── tooltip.tsx
│   ├── collaborative-editor.tsx   # 协作编辑器主组件
│   ├── server-status.tsx          # 服务器状态管理组件
│   └── calendar-node.tsx          # 自定义日历节点组件
├── lib/
│   ├── hocuspocus-server.ts       # Hocuspocus 服务器配置
│   ├── calendar-extension.ts      # 自定义日历扩展
│   └── utils.ts                   # 工具函数
└── hooks/
    └── use-mobile.ts              # 移动端检测Hook
```

## 🔧 核心组件详解

### CollaborativeEditor 组件

主要的协作编辑器组件，包含：

- **实时协作功能**：集成 Yjs 和 Hocuspocus 提供者
- **富文本编辑**：基于 Tiptap 的扩展配置
- **Bubble Menu**：选中文本时的工具栏
- **用户状态管理**：在线用户列表和状态显示
- **自定义扩展**：日历节点等特殊功能

### ServerStatus 组件

服务器管理组件：

- **状态监控**：实时显示服务器运行状态
- **连接计数**：显示当前连接的用户数量
- **控制功能**：启动/停止协作服务器
- **自动刷新**：每3秒自动检查服务器状态

### 自定义扩展

**CalendarExtension** - 日历节点扩展：

- **React 组件渲染**：使用 ReactNodeViewRenderer
- **交互式界面**：可编辑标题和选择日期
- **持久化属性**：日期和标题数据保存
- **美观样式**：现代化的卡片设计

## 🎨 样式系统

### Tailwind CSS 4 配置

项目使用最新的 Tailwind CSS 4：

- **主题系统**：完整的明暗主题支持
- **CSS 变量**：基于 CSS 变量的颜色系统
- **组件样式**：通过扩展配置应用 Tailwind 类
- **最小化 CSS**：只保留 Tailwind 无法处理的样式

### 样式优先级

1. **扩展配置**：通过 Tiptap 扩展的 `HTMLAttributes` 配置
2. **全局样式**：在 `globals.css` 中的编辑器样式
3. **组件样式**：在 React 组件中的 Tailwind 类

## 🚀 API 接口

### GET /api/collaboration
获取协作服务器状态
```json
{
  "running": true,
  "port": 1234,
  "connections": 2
}
```

### POST /api/collaboration
启动 Hocuspocus 服务器
```json
{
  "success": true,
  "message": "Hocuspocus服务器运行中",
  "running": true,
  "port": 1234,
  "connections": 0
}
```

### DELETE /api/collaboration
停止 Hocuspocus 服务器
```json
{
  "success": true,
  "message": "服务器已停止"
}
```

## 🔧 开发配置

### 自定义脚本

```json
{
  "dev": "npm run stop-server && next dev --turbopack",
  "stop-server": "lsof -ti:1234 | xargs kill -9 2>/dev/null || true"
}
```

### 核心依赖版本

- `@tiptap/react: ^2.12.0`
- `@hocuspocus/provider: ^3.1.1` 
- `@hocuspocus/server: ^3.1.1`
- `yjs: ^13.6.27`
- `next: 15.3.2`
- `react: ^19.0.0`

## 🌟 高级功能

### 协作光标系统

- **颜色分配**：每个用户自动分配唯一颜色
- **光标标签**：显示用户名称
- **选中范围**：高亮显示用户选中的文本
- **实时同步**：光标位置实时更新

### 连接管理

- **自动重连**：网络中断时自动尝试重连
- **状态同步**：连接状态实时反馈
- **错误处理**：优雅处理连接错误

### 文档管理

- **多文档支持**：通过文档ID区分不同文档
- **动态创建**：支持动态创建新文档
- **文档切换**：无缝切换不同文档

## 📱 测试和调试

### 多用户测试

1. 打开多个浏览器窗口或使用不同设备
2. 使用相同的文档ID
3. 观察实时同步效果

### 测试页面

访问 `/test` 路径查看编辑器样式测试页面。

## 🚀 部署指南

### 开发环境

```bash
npm run dev
```

### 生产环境

1. 构建应用：
```bash
npm run build
```

2. 启动生产服务器：
```bash
npm start
```

3. 启动协作服务器：
```bash
curl -X POST http://localhost:3000/api/collaboration
```

### 环境要求

- Node.js 18+
- 支持 WebSocket 的环境
- 端口 1234 可用（用于 WebSocket 服务器）

## 🔮 扩展建议

### 即将实现的功能

- [ ] 数据持久化（数据库集成）
- [ ] 用户认证系统
- [ ] 文档权限管理
- [ ] 版本历史记录
- [ ] 评论系统
- [ ] 文件上传功能
- [ ] 导出功能（PDF、Word等）
- [ ] 更多自定义扩展

### 自定义扩展开发

1. 创建扩展文件：
```typescript
// src/lib/your-extension.ts
import { Node } from '@tiptap/core'

export const YourExtension = Node.create({
  name: 'yourNode',
  // 配置...
})
```

2. 在编辑器中注册：
```typescript
// collaborative-editor.tsx
import { YourExtension } from '@/lib/your-extension'

// 在 extensions 数组中添加
YourExtension.configure({
  HTMLAttributes: {
    class: 'your-tailwind-classes',
  },
})
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## �� 许可证

MIT License
