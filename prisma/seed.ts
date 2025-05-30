import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始种子数据初始化...')
  
  // 1. 创建测试用户
  console.log('👤 创建测试用户...')
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'temp_user_001@example.com' },
      update: {},
      create: {
        id: 'temp_user_001',
        name: '张三',
        email: 'temp_user_001@example.com',
        avatar: '👨‍💻'
      }
    }),
    
    prisma.user.upsert({
      where: { email: 'temp_user_002@example.com' },
      update: {},
      create: {
        id: 'temp_user_002', 
        name: '李四',
        email: 'temp_user_002@example.com',
        avatar: '👩‍💼'
      }
    }),
    
    prisma.user.upsert({
      where: { email: 'temp_user_003@example.com' },
      update: {},
      create: {
        id: 'temp_user_003',
        name: '王五',
        email: 'temp_user_003@example.com', 
        avatar: '🧑‍🎨'
      }
    })
  ])
  
  console.log(`✅ 创建了 ${users.length} 个测试用户`)
  
  // 2. 创建示例文档
  console.log('📄 创建示例文档...')
  
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        id: 'doc_welcome',
        title: '欢迎使用协作编辑器',
        description: '这是一个示例文档，展示了实时协作编辑的功能',
        authorId: users[0].id,
        isPublic: true,
        version: 1
      }
    }),
    
    prisma.document.create({
      data: {
        id: 'doc_project_plan',
        title: '项目开发计划',
        description: '详细的项目开发计划和时间安排',
        authorId: users[0].id,
        isPublic: false,
        version: 1
      }
    }),
    
    prisma.document.create({
      data: {
        id: 'doc_meeting_notes',
        title: '团队会议纪要',
        description: '每周团队会议的记录和行动项',
        authorId: users[1].id,
        isPublic: false,
        version: 1
      }
    }),
    
    prisma.document.create({
      data: {
        id: 'doc_api_docs',
        title: 'API 接口文档',
        description: '系统 API 接口的详细说明文档',
        authorId: users[2].id,
        isPublic: true,
        version: 1
      }
    })
  ])
  
  console.log(`✅ 创建了 ${documents.length} 个示例文档`)
  
  // 3. 创建协作关系
  console.log('🤝 创建协作关系...')
  
  const collaborations = await Promise.all([
    // 张三是所有自己文档的拥有者
    prisma.documentCollaborator.create({
      data: {
        userId: users[0].id,
        documentId: documents[0].id, // 欢迎文档
        role: 'OWNER'
      }
    }),
    
    prisma.documentCollaborator.create({
      data: {
        userId: users[0].id,
        documentId: documents[1].id, // 项目计划
        role: 'OWNER'
      }
    }),
    
    // 李四是会议纪要的拥有者，同时是项目计划的编辑者
    prisma.documentCollaborator.create({
      data: {
        userId: users[1].id,
        documentId: documents[2].id, // 会议纪要
        role: 'OWNER'
      }
    }),
    
    prisma.documentCollaborator.create({
      data: {
        userId: users[1].id,
        documentId: documents[1].id, // 项目计划
        role: 'EDITOR'
      }
    }),
    
    // 王五是 API 文档的拥有者，同时是欢迎文档的查看者
    prisma.documentCollaborator.create({
      data: {
        userId: users[2].id,
        documentId: documents[3].id, // API 文档
        role: 'OWNER'
      }
    }),
    
    prisma.documentCollaborator.create({
      data: {
        userId: users[2].id,
        documentId: documents[0].id, // 欢迎文档
        role: 'VIEWER'
      }
    })
  ])
  
  console.log(`✅ 创建了 ${collaborations.length} 个协作关系`)
  
  // 4. 显示统计信息
  console.log('\n📊 种子数据统计:')
  const stats = await Promise.all([
    prisma.user.count(),
    prisma.document.count(),
    prisma.documentCollaborator.count()
  ])
  
  console.log(`  👥 用户总数: ${stats[0]}`)
  console.log(`  📄 文档总数: ${stats[1]}`)
  console.log(`  🤝 协作关系: ${stats[2]}`)
  
  console.log('\n🎉 种子数据初始化完成！')
  console.log('\n💡 提示:')
  console.log('  - 你可以使用 temp_user_001, temp_user_002, temp_user_003 作为测试用户')
  console.log('  - 文档 ID 分别为: doc_welcome, doc_project_plan, doc_meeting_notes, doc_api_docs')
  console.log('  - 运行 `npx prisma studio` 查看数据')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ 种子数据初始化失败:', e)
    await prisma.$disconnect()
    process.exit(1)
  }) 