#!/usr/bin/env node

/**
 * 文档 CRUD API 测试脚本
 * 测试所有API端点的功能和边界情况
 */

const API_BASE = 'http://localhost:3000/api'

// 测试数据
const testDocument = {
  title: 'API测试文档',
  description: '这是一个通过API创建的测试文档',
  isPublic: false
}

const updateData = {
  title: 'API测试文档（已更新）',
  description: '这是一个已更新的测试文档',
  isPublic: true
}

let createdDocumentId = null

/**
 * 发送HTTP请求的辅助函数
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  
  try {
    console.log(`\n🌐 请求: ${options.method || 'GET'} ${url}`)
    if (options.body) {
      console.log('📄 请求体:', JSON.stringify(JSON.parse(options.body), null, 2))
    }
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    const data = await response.json()
    
    console.log(`📊 响应状态: ${response.status}`)
    console.log(`📋 响应数据:`, JSON.stringify(data, null, 2))
    
    return { response, data }
  } catch (error) {
    console.error(`❌ 请求失败: ${error.message}`)
    return { error }
  }
}

/**
 * 测试 1: GET /api/documents - 获取文档列表
 */
async function testGetDocuments() {
  console.log('\n🧪 === 测试 1: 获取文档列表 ===')
  
  // 1.1 基础查询
  console.log('\n📋 1.1 基础查询（无参数）')
  await apiRequest('/documents')
  
  // 1.2 分页查询
  console.log('\n📋 1.2 分页查询（page=1, limit=2）')
  await apiRequest('/documents?page=1&limit=2')
  
  // 1.3 搜索查询
  console.log('\n📋 1.3 搜索查询（search=项目）')
  await apiRequest('/documents?search=项目')
  
  // 1.4 无效参数测试
  console.log('\n📋 1.4 无效参数测试（page=0）')
  await apiRequest('/documents?page=0')
}

/**
 * 测试 2: POST /api/documents - 创建文档
 */
async function testCreateDocument() {
  console.log('\n🧪 === 测试 2: 创建文档 ===')
  
  // 2.1 成功创建
  console.log('\n📝 2.1 成功创建文档')
  const { response, data } = await apiRequest('/documents', {
    method: 'POST',
    body: JSON.stringify(testDocument)
  })
  
  if (response?.status === 201 && data.data?.document?.id) {
    createdDocumentId = data.data.document.id
    console.log(`✅ 文档创建成功，ID: ${createdDocumentId}`)
  }
  
  // 2.2 数据验证失败测试
  console.log('\n📝 2.2 数据验证失败测试（空标题）')
  await apiRequest('/documents', {
    method: 'POST',
    body: JSON.stringify({ title: '', description: '空标题测试' })
  })
  
  // 2.3 标题过长测试
  console.log('\n📝 2.3 标题过长测试（>200字符）')
  await apiRequest('/documents', {
    method: 'POST',
    body: JSON.stringify({ title: 'A'.repeat(201), description: '标题过长测试' })
  })
}

/**
 * 测试 3: GET /api/documents/[id] - 获取文档详情
 */
async function testGetDocument() {
  console.log('\n🧪 === 测试 3: 获取文档详情 ===')
  
  if (!createdDocumentId) {
    console.log('⚠️ 跳过测试：没有可用的文档ID')
    return
  }
  
  // 3.1 成功获取详情
  console.log('\n📖 3.1 成功获取文档详情')
  await apiRequest(`/documents/${createdDocumentId}`)
  
  // 3.2 不存在的文档ID
  console.log('\n📖 3.2 不存在的文档ID')
  await apiRequest('/documents/non-existent-doc-id')
  
  // 3.3 使用已知的种子数据文档ID
  console.log('\n📖 3.3 获取种子数据文档（欢迎文档）')
  await apiRequest('/documents/doc_welcome')
}

/**
 * 测试 4: PUT /api/documents/[id] - 更新文档
 */
async function testUpdateDocument() {
  console.log('\n🧪 === 测试 4: 更新文档 ===')
  
  if (!createdDocumentId) {
    console.log('⚠️ 跳过测试：没有可用的文档ID')
    return
  }
  
  // 4.1 成功更新
  console.log('\n✏️ 4.1 成功更新文档')
  await apiRequest(`/documents/${createdDocumentId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  })
  
  // 4.2 部分更新
  console.log('\n✏️ 4.2 部分更新（仅更新标题）')
  await apiRequest(`/documents/${createdDocumentId}`, {
    method: 'PUT',
    body: JSON.stringify({ title: 'API测试文档（再次更新）' })
  })
  
  // 4.3 无更新数据
  console.log('\n✏️ 4.3 无更新数据测试')
  await apiRequest(`/documents/${createdDocumentId}`, {
    method: 'PUT',
    body: JSON.stringify({})
  })
  
  // 4.4 不存在的文档ID
  console.log('\n✏️ 4.4 更新不存在的文档')
  await apiRequest('/documents/non-existent-doc-id', {
    method: 'PUT',
    body: JSON.stringify({ title: '更新不存在的文档' })
  })
}

/**
 * 测试 5: DELETE /api/documents/[id] - 删除文档
 */
async function testDeleteDocument() {
  console.log('\n🧪 === 测试 5: 删除文档 ===')
  
  // 5.1 尝试删除不存在的文档
  console.log('\n🗑️ 5.1 删除不存在的文档')
  await apiRequest('/documents/non-existent-doc-id', {
    method: 'DELETE'
  })
  
  if (!createdDocumentId) {
    console.log('⚠️ 跳过删除测试：没有可用的文档ID')
    return
  }
  
  // 5.2 成功删除
  console.log('\n🗑️ 5.2 成功删除文档')
  await apiRequest(`/documents/${createdDocumentId}`, {
    method: 'DELETE'
  })
  
  // 5.3 验证删除结果（再次获取应该失败）
  console.log('\n🗑️ 5.3 验证删除结果（文档应该不存在）')
  await apiRequest(`/documents/${createdDocumentId}`)
}

/**
 * 测试 6: 边界情况和错误处理
 */
async function testEdgeCases() {
  console.log('\n🧪 === 测试 6: 边界情况和错误处理 ===')
  
  // 6.1 无效的JSON数据
  console.log('\n⚠️ 6.1 无效的JSON数据')
  try {
    await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    }).then(res => res.json()).then(data => {
      console.log('📋 响应数据:', data)
    })
  } catch (error) {
    console.log('❌ JSON解析错误（预期行为）:', error.message)
  }
  
  // 6.2 权限测试（使用种子数据中不属于张三的文档）
  console.log('\n⚠️ 6.2 权限测试（删除不属于自己的文档）')
  await apiRequest('/documents/doc_meeting_notes', {
    method: 'DELETE'
  })
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log('🚀 开始API测试...')
  console.log(`📡 测试服务器: ${API_BASE}`)
  console.log('👤 测试用户: 张三 (temp_user_001)')
  
  try {
    // 检查服务器是否运行
    console.log('\n🔍 检查服务器状态...')
    const healthCheck = await fetch('http://localhost:3000')
    // 404是正常的，因为根路径没有页面
    if (healthCheck.status !== 404 && !healthCheck.ok) {
      throw new Error('服务器未运行，请先启动开发服务器：npm run dev')
    }
    console.log('✅ 服务器运行正常')
    
    // 运行所有测试
    await testGetDocuments()
    await testCreateDocument()
    await testGetDocument()
    await testUpdateDocument()
    await testDeleteDocument()
    await testEdgeCases()
    
    console.log('\n🎉 === 测试完成 ===')
    console.log('📊 请检查上面的测试结果，确认所有API功能正常')
    
  } catch (error) {
    console.error('\n❌ 测试执行失败:', error.message)
    process.exit(1)
  }
}

// 检查是否为直接执行
if (require.main === module) {
  runAllTests()
}

module.exports = {
  apiRequest,
  testGetDocuments,
  testCreateDocument,
  testGetDocument,
  testUpdateDocument,
  testDeleteDocument,
  testEdgeCases,
  runAllTests
} 