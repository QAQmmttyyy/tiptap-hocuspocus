import { QueryClient } from '@tanstack/react-query'

// Query Client 配置
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 减少重复请求，文档数据相对稳定
        staleTime: 5 * 60 * 1000, // 5分钟
        gcTime: 10 * 60 * 1000, // 10分钟（原cacheTime）
        retry: (failureCount, error) => {
          // API错误不重试，网络错误重试2次
          if (error instanceof Error && error.message.includes('Failed to fetch')) {
            return failureCount < 2
          }
          return false
        },
        refetchOnWindowFocus: false, // 不在窗口聚焦时自动重新获取
        refetchOnMount: true, // 组件挂载时重新获取
      },
      mutations: {
        retry: false, // 变更操作不重试
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // 服务端：每次创建新的client
    return makeQueryClient()
  } else {
    // 浏览器端：使用单例模式
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}

// Query Keys 工厂函数
export const queryKeys = {
  // 文档相关查询键
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.documents.lists(), { filters }] as const,
    details: () => [...queryKeys.documents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
  },
  
  // 系统状态相关查询键
  system: {
    all: ['system'] as const,
    health: () => [...queryKeys.system.all, 'health'] as const,
  },
} as const 