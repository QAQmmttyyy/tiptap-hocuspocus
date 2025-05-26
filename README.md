# 实时协作文档编辑器

基于 Next.js、Tiptap、Hocuspocus 和 shadcn/ui 构建的实时协作文档编辑器 Demo。

## 技术栈

- **Next.js 15** - React 全栈框架（包含API路由）
- **Tiptap** - 现代富文本编辑器
- **Hocuspocus** - 实时协作后端服务（集成在Next.js中）
- **Yjs** - 共享数据类型，用于实时协作
- **shadcn/ui** - 现代 UI 组件库
- **Tailwind CSS** - 实用优先的 CSS 框架

## 功能特性

- ✅ 实时多用户协作编辑
- ✅ 实时光标位置同步
- ✅ 用户在线状态显示
- ✅ 基本富文本编辑功能（粗体、斜体、标题、列表等）
- ✅ 现代化 UI 界面
- ✅ 响应式设计
- ✅ 集成式服务器管理
- ✅ 服务器状态监控

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动应用

```bash
npm run dev
```

### 3. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 4. 启动协作服务器

在应用界面中点击"启动服务器"按钮，或者通过API启动：

```bash
curl -X POST http://localhost:3000/api/collaboration
```

## 使用说明

1. **启动服务器**：在首页点击"启动服务器"按钮
2. **进入应用**：输入用户名（可选）和文档ID
3. **开始协作**：点击"开始协作编辑"按钮
4. **多用户测试**：在不同浏览器窗口或设备上使用相同的文档ID
5. **实时编辑**：所有用户的编辑内容会实时同步
6. **查看用户**：右上角显示当前在线用户
7. **监控状态**：服务器状态组件显示连接数和运行状态

## 项目结构

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── collaboration/
│   │   │       └── route.ts     # Hocuspocus服务器API路由
│   │   ├── globals.css          # 全局样式（包含 Tiptap 样式）
│   │   └── page.tsx             # 主页面
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 组件
│   │   ├── collaborative-editor.tsx  # 协作编辑器组件
│   │   └── server-status.tsx    # 服务器状态组件
│   └── lib/
│       ├── utils.ts             # 工具函数
│       └── hocuspocus-server.ts # Hocuspocus服务器管理
├── package.json
└── README.md
```

## 核心组件说明

### CollaborativeEditor

主要的协作编辑器组件，集成了：
- Tiptap 编辑器配置
- Hocuspocus 提供者连接
- 用户状态管理
- 工具栏功能

### ServerStatus

服务器状态管理组件：
- 实时显示服务器运行状态
- 启动/停止服务器控制
- 连接数监控
- 自动状态刷新

### Hocuspocus 服务器（API路由）

集成在Next.js中的WebSocket服务器：
- 端口：1234
- 支持多文档
- 用户认证（简化版）
- 连接状态监控
- RESTful API控制

## API 端点

### GET /api/collaboration
获取服务器状态
```json
{
  "running": true,
  "port": 1234,
  "connections": 2
}
```

### POST /api/collaboration
启动Hocuspocus服务器
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
停止Hocuspocus服务器
```json
{
  "success": true,
  "message": "服务器已停止"
}
```

## 开发说明

### 添加新的编辑器功能

1. 安装 Tiptap 扩展：
```bash
npm install @tiptap/extension-[extension-name]
```

2. 在 `collaborative-editor.tsx` 中导入并配置扩展

3. 添加对应的工具栏按钮

### 自定义样式

编辑器样式定义在 `src/app/globals.css` 文件中的 `.ProseMirror` 类下。

### 数据持久化

当前版本不包含数据库，文档内容仅在内存中保存。要添加持久化：

1. 在 `src/lib/hocuspocus-server.ts` 中实现 `onStoreDocument` 和 `onLoadDocument` 回调
2. 连接数据库（如 MongoDB、PostgreSQL 等）
3. 存储 Yjs 文档状态

## 部署

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

3. 通过API启动协作服务器：
```bash
curl -X POST http://localhost:3000/api/collaboration
```

## 优势

### 相比独立服务器的优势：

- ✅ **统一部署**：只需要部署一个Next.js应用
- ✅ **简化配置**：无需单独配置WebSocket服务器
- ✅ **状态管理**：通过API统一管理服务器状态
- ✅ **开发体验**：一个命令启动整个应用
- ✅ **生产就绪**：更容易部署到云平台

## 注意事项

- 服务器需要手动启动（通过界面或API）
- 多用户测试时使用相同的文档ID
- 当前版本为 Demo，不包含用户认证和数据持久化
- 生产环境需要配置 HTTPS 和 WSS

## 扩展功能建议

- [ ] 用户认证系统
- [ ] 文档权限管理
- [ ] 数据库持久化
- [ ] 文档版本历史
- [ ] 评论系统
- [ ] 文件上传
- [ ] 导出功能（PDF、Word等）
- [ ] 主题切换
- [ ] 自动启动服务器

## 许可证

MIT License
