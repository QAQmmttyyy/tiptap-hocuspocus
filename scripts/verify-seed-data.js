import { PrismaClient } from '@prisma/client'

async function verifySeedData() {
  const prisma = new PrismaClient()
  
  try {
    console.log('📊 验证种子数据...')
    
    const users = await prisma.user.findMany({
      include: {
        documents: true,
        collaborations: {
          include: {
            document: true
          }
        }
      }
    })
    
    console.log('\n👥 用户信息:')
    users.forEach(user => {
      console.log(`  ${user.avatar} ${user.name} (${user.id})`)
      console.log(`     📄 创建文档: ${user.documents.length} 个`)
      console.log(`     🤝 协作文档: ${user.collaborations.length} 个`)
    })
    
    const documents = await prisma.document.findMany({
      include: {
        author: true,
        collaborators: {
          include: {
            user: true
          }
        }
      }
    })
    
    console.log('\n📄 文档信息:')
    documents.forEach(doc => {
      const visibility = doc.isPublic ? '🌍 公开' : '🔒 私有'
      console.log(`  ${doc.title} (${doc.id}) - ${visibility}`)
      console.log(`     👤 作者: ${doc.author.name}`)
      console.log(`     🤝 协作者: ${doc.collaborators.length} 人`)
    })
    
    console.log('\n✅ 种子数据验证完成！')
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifySeedData() 