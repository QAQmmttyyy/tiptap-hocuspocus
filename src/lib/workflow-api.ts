// 工作流API配置
// 注意：请在 .env.local 文件中设置 WORKFLOW_API_BASE 环境变量
// 例如：WORKFLOW_API_BASE=https://api.dev.workflow.basevec.com
export const WORKFLOW_API_BASE =
  process.env.WORKFLOW_API_BASE || "https://api.dev.workflow.basevec.com"

// API调用的通用函数
export async function fetchWorkflowAPI(endpoint: string, options?: RequestInit) {
  const url = `${WORKFLOW_API_BASE}${endpoint}`

  console.log(`🔄 调用工作流API: ${url}`)

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    console.error(`❌ API请求失败: ${response.status} ${response.statusText}`)
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  console.log(`✅ API响应成功:`, data)

  return data
}
