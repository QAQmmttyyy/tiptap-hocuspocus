#!/usr/bin/env node

/**
 * 性能基准测试脚本
 * 测试各项操作的响应时间和资源使用情况
 */

import { performance } from 'perf_hooks'
import { db } from '@/lib/db'

interface BenchmarkResult {
  operation: string
  samples: number
  avgTime: number
  minTime: number
  maxTime: number
  throughput?: number
}

async function measureOperation(
  name: string,
  operation: () => Promise<unknown>,
  samples: number = 10
): Promise<BenchmarkResult> {
  const times: number[] = []
  
  console.log(`🔄 测试 ${name} (${samples} 次采样)...`)
  
  for (let i = 0; i < samples; i++) {
    const start = performance.now()
    await operation()
    const end = performance.now()
    times.push(end - start)
    
    // 避免过快请求
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  const avgTime = times.reduce((a, b) => a + b) / times.length
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const throughput = 1000 / avgTime // ops/second
  
  return {
    operation: name,
    samples,
    avgTime: Math.round(avgTime * 100) / 100,
    minTime: Math.round(minTime * 100) / 100,
    maxTime: Math.round(maxTime * 100) / 100,
    throughput: Math.round(throughput * 100) / 100
  }
}

async function runBenchmarks(): Promise<void> {
  console.log('🚀 开始性能基准测试...\n')
  
  const results: BenchmarkResult[] = []
  
  // 1. 数据库查询性能
  results.push(await measureOperation(
    '数据库查询 - 获取文档列表',
    async () => {
      await db.document.findMany({ take: 10 })
    },
    20
  ))
  
  results.push(await measureOperation(
    '数据库查询 - 单个文档详情',
    async () => {
      await db.document.findFirst()
    },
    20
  ))
  
  // 2. API 性能
  results.push(await measureOperation(
    'API请求 - 获取文档列表',
    async () => {
      await fetch('http://localhost:3000/api/documents')
    },
    15
  ))
  
  results.push(await measureOperation(
    'API请求 - 创建文档',
    async () => {
      await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `性能测试文档-${Date.now()}`,
          description: '性能测试用文档'
        })
      })
    },
    10
  ))
  
  // 3. 输出结果
  console.log('\n📊 性能基准测试结果:')
  console.log('=' .repeat(80))
  console.log(
    '操作'.padEnd(25) + 
    '采样数'.padEnd(8) + 
    '平均时间(ms)'.padEnd(12) + 
    '最小时间(ms)'.padEnd(12) + 
    '最大时间(ms)'.padEnd(12) + 
    '吞吐量(ops/s)'.padEnd(12)
  )
  console.log('-'.repeat(80))
  
  results.forEach(result => {
    console.log(
      result.operation.padEnd(25) +
      result.samples.toString().padEnd(8) +
      result.avgTime.toString().padEnd(12) +
      result.minTime.toString().padEnd(12) +
      result.maxTime.toString().padEnd(12) +
      (result.throughput?.toString() || 'N/A').padEnd(12)
    )
  })
  
  console.log('=' .repeat(80))
  
  // 4. 性能评估
  console.log('\n📈 性能评估:')
  const dbQueryAvg = results.find(r => r.operation.includes('数据库查询'))?.avgTime || 0
  const apiRequestAvg = results.find(r => r.operation.includes('API请求'))?.avgTime || 0
  
  if (dbQueryAvg < 50) {
    console.log('✅ 数据库查询性能: 优秀 (<50ms)')
  } else if (dbQueryAvg < 100) {
    console.log('🟡 数据库查询性能: 良好 (50-100ms)')
  } else {
    console.log('⚠️ 数据库查询性能: 需要优化 (>100ms)')
  }
  
  if (apiRequestAvg < 200) {
    console.log('✅ API响应性能: 优秀 (<200ms)')
  } else if (apiRequestAvg < 500) {
    console.log('🟡 API响应性能: 良好 (200-500ms)')
  } else {
    console.log('⚠️ API响应性能: 需要优化 (>500ms)')
  }
  
  // 清理测试数据
  console.log('\n🧹 清理测试数据...')
  await db.document.deleteMany({
    where: {
      title: {
        startsWith: '性能测试文档'
      }
    }
  })
  
  await db.$disconnect()
  console.log('✅ 性能基准测试完成')
}

// 运行基准测试
if (require.main === module) {
  runBenchmarks().catch(console.error)
}

export { runBenchmarks } 