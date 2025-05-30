import { PrismaClient } from '@prisma/client'

async function verifyDataModel() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 验证数据模型...')
    
    // 1. 验证所有表是否存在
    console.log('\n📊 检查表结构:')
    
    // 检查 users 表
    const userCount = await prisma.user.count()
    console.log(`✅ users 表: ${userCount} 条记录`)
    
    // 检查 documents 表
    const docCount = await prisma.document.count()
    console.log(`✅ documents 表: ${docCount} 条记录`)
    
    // 检查 document_collaborators 表
    const collabCount = await prisma.documentCollaborator.count()
    console.log(`✅ document_collaborators 表: ${collabCount} 条记录`)
    
    // 2. 测试枚举类型
    console.log('\n🎭 测试枚举类型:')
    const { CollaboratorRole } = await import('@prisma/client')
    console.log('✅ CollaboratorRole 枚举:', Object.keys(CollaboratorRole))
    
    // 3. 测试基本 CRUD 操作
    console.log('\n🧪 测试基本操作:')
    
    // 创建测试用户
    const testUser = await prisma.user.create({
      data: {
        name: '测试用户',
        email: 'test@example.com'
      }
    })
    console.log(`✅ 创建用户成功: ${testUser.name} (${testUser.id})`)
    
    // 创建测试文档
    const testDoc = await prisma.document.create({
      data: {
        title: '测试文档',
        description: '这是一个测试文档',
        authorId: testUser.id
      }
    })
    console.log(`✅ 创建文档成功: ${testDoc.title} (${testDoc.id})`)
    
    // 创建协作关系
    const testCollab = await prisma.documentCollaborator.create({
      data: {
        userId: testUser.id,
        documentId: testDoc.id,
        role: 'OWNER'
      }
    })
    console.log(`✅ 创建协作关系成功: 角色 ${testCollab.role}`)
    
    // 4. 测试关联查询
    console.log('\n🔗 测试关联查询:')
    
    const userWithDocs = await prisma.user.findFirst({
      include: {
        documents: true,
        collaborations: {
          include: {
            document: true
          }
        }
      }
    })
    
    if (userWithDocs) {
      console.log(`✅ 用户关联查询: ${userWithDocs.name}`)
      console.log(`  - 创建的文档: ${userWithDocs.documents.length} 个`)
      console.log(`  - 协作文档: ${userWithDocs.collaborations.length} 个`)
    }
    
    // 5. 清理测试数据
    console.log('\n🧹 清理测试数据:')
    await prisma.documentCollaborator.delete({ where: { id: testCollab.id } })
    await prisma.document.delete({ where: { id: testDoc.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    console.log('✅ 测试数据清理完成')
    
    console.log('\n🎉 数据模型验证完成！所有测试通过。')
    
  } catch (error) {
    console.error('❌ 数据模型验证失败:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDataModel() 