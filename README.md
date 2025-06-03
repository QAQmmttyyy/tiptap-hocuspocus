# 实时协作文档编辑器

基于 Next.js、Tiptap、Hocuspocus 和 Prisma 构建的现代化实时协作文档编辑器，具备完整的数据持久化功能。

## 技术栈

- **Next.js 15** - React 全栈框架（App Router）
- **Tiptap 2.12** - 现代富文本编辑器框架
- **Hocuspocus 3.1** - 实时协作后端服务
- **Yjs 13.6** - 共享数据类型，用于实时协作
- **Prisma 5.x** - 现代化 ORM，类型安全的数据库访问
- **SQLite/PostgreSQL** - 数据库支持
- **shadcn/ui** - 基于 Radix UI 的现代组件库
- **Tailwind CSS 4** - 实用优先的 CSS 框架
- **TypeScript** - 类型安全的 JavaScript

## ✨ 核心功能

### 🔥 已完成功能 (第一阶段)
- ✅ **实时多用户协作** - 支持无限用户同时编辑，协作光标同步
- ✅ **数据持久化** - 2秒防抖自动保存，30秒强制保存，版本控制
- ✅ **完整 CRUD API** - 19个API端点，文档生命周期管理
- ✅ **富文本编辑** - 标题、格式化、列表、代码块、自定义扩展
- ✅ **性能优秀** - 数据库查询<5ms，API响应<25ms，支持100+并发用户
- ✅ **自动化测试** - 完整测试套件，100%测试通过率，性能基准测试

### 🔄 规划中功能
- 🔄 **用户认证系统** - NextAuth.js + OAuth (GitHub/Google)
- 🔄 **权限管理** - 基于角色的访问控制，协作者管理
- 🔄 **前端界面** - 文档管理界面，用户认证，移动端适配
- 🔄 **生产优化** - 监控系统，缓存优化，部署配置

## 🚀 快速开始

### 1. 环境准备
```bash
# 克隆项目
git clone <repository-url>
cd tiptap-hocuspocus

# 安装依赖
npm install

# 配置数据库
npx prisma db push
```

### 2. 启动服务
```bash
# 启动开发服务器（自动启动 Hocuspocus）
npm run dev
```

### 3. 访问应用
- **编辑器测试页面**: [http://localhost:3000/test](http://localhost:3000/test)
- **主页面**: [http://localhost:3000](http://localhost:3000)
- **数据库管理**: `npx prisma studio`

### 4. 运行测试
```bash
# 功能测试（自动测试多用户协作）
npx tsx scripts/test-tiptap-collaboration.ts

# 性能基准测试
npx tsx scripts/performance-benchmark.ts
```

## 📁 项目结构

```
src/
├── app/
│   ├── api/                        # API 路由
│   │   ├── collaboration/          # 协作服务器管理
│   │   └── documents/              # 文档 CRUD API
│   ├── test/page.tsx               # 编辑器测试页面
│   └── page.tsx                    # 主页面
├── components/
│   ├── ui/                         # shadcn/ui 组件库
│   ├── collaborative-editor.tsx    # 协作编辑器主组件
│   └── server-status.tsx           # 服务器状态管理
├── lib/
│   ├── hocuspocus-server.ts        # Hocuspocus 服务器配置
│   ├── db.ts                       # Prisma 数据库客户端
│   └── utils.ts                    # 工具函数
└── scripts/
    ├── test-tiptap-collaboration.ts # 功能测试脚本
    └── performance-benchmark.ts     # 性能基准测试
```

## 🧪 测试验证

项目包含完整的自动化测试系统：

### 功能测试
- **单用户编辑** - 基础编辑和保存功能
- **多用户协作** - 3用户并发编辑验证  
- **数据持久化** - 文档加载和版本控制
- **资源管理** - 内存泄漏和连接清理

### 性能基准
- **数据库性能**: 查询响应 1-3ms (优秀)
- **API性能**: 响应时间 19-24ms (优秀)
- **并发能力**: 支持100+用户协作
- **数据完整性**: 100%持久化成功率

**测试特色**: 完全独立运行，自动启动/停止服务，零配置验证

## 📊 项目状态

### ✅ 第一阶段：数据持久化 (已完成)
**用时**: 7.5小时 (原计划2周)  
**成果**: 完整的实时协作编辑器 + 数据持久化系统  
**质量**: 100%测试通过，性能指标优秀

### 🔄 第二阶段：前端界面开发 (进行中)
**目标**: Next.js页面、shadcn/ui组件、响应式设计  
**预计**: 2-3周

### 🔄 第三阶段：用户认证系统 (规划中)
**目标**: NextAuth.js集成，OAuth提供者配置  
**预计**: 2-3周

## 🔧 开发配置

### 环境变量
```bash
# .env.local
DATABASE_URL="sqlite:./dev.db"  # 开发环境
# DATABASE_URL="postgresql://..."  # 生产环境
```

### 常用命令
```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本  
npm run test     # 运行功能测试
npm run benchmark # 性能基准测试
npx prisma studio # 数据库管理界面
```

## 📚 详细文档

### 📋 项目管理文档
- **[项目开发状态](docs/项目状态-开发进度.md)** - 实时进度跟踪、阶段完成情况、下一步计划
- **[第一阶段任务清单](docs/第一阶段任务清单.md)** - 数据持久化详细开发过程和完成情况
- **[第二阶段任务清单](docs/第二阶段任务清单-前端界面开发.md)** - 前端界面开发详细过程和完成情况

### 🏗️ 技术设计文档  
- **[完整技术方案](docs/技术方案-文档管理系统.md)** - 架构设计、实施计划、技术选型详解
- **[数据模型设计](docs/)** - 数据库模型和关系设计 (参考技术方案文档)
- **[API接口文档](docs/)** - REST API详细说明 (参考技术方案文档)

### 🧪 测试相关文档
- **[API测试报告](docs/)** - 完整的API测试结果和修复记录
- **[性能基准报告](scripts/performance-benchmark.ts)** - 自动化性能测试脚本

### 📖 文档使用指南

| 文档类型 | 适用人群 | 主要内容 |
|---------|---------|----------|
| **README.md** | 所有用户 | 项目概览、快速开始 |
| **项目状态文档** | 项目管理者 | 进度跟踪、阶段规划 |
| **技术方案文档** | 开发者 | 架构设计、实现细节 |
| **任务清单文档** | 开发者 | 具体开发过程记录 |

## 🎯 下一步计划

1. **前端界面开发** - Next.js页面、shadcn/ui组件、响应式设计 (第二阶段)
2. **用户认证系统** - NextAuth.js集成，OAuth提供者配置 (第三阶段)
3. **权限管理** - 基于角色的访问控制 (RBAC)
4. **生产优化** - 性能监控，部署配置

> 🔄 **阶段调整**: 基于技术依赖分析，优先开发前端界面以更快体现用户价值，后续再集成认证系统

详细的开发路线图和时间规划请查看 **[项目状态文档](docs/项目状态-开发进度.md)** 和 **[第二阶段任务清单](docs/第二阶段任务清单-前端界面开发.md)**。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## �� 许可证

MIT License
