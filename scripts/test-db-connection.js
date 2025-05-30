const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 测试数据库连接...')
    
    // 尝试连接数据库
    await prisma.$connect()
    console.log('✅ 数据库连接成功！')
    
    // 测试查询（即使没有表也能执行）
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ 数据库查询测试成功:', result)
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 数据库连接已断开')
  }
}

testConnection() 