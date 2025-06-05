import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, type CreateDocumentRequest } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { useMemo } from 'react'

// 获取文档列表
export function useDocuments() {
  const { sortBy, sortOrder, searchQuery, showFavorites, showRecent } = useSidebarStore()
  
  const query = useQuery({
    queryKey: queryKeys.documents.list({ sortBy, sortOrder, searchQuery, showFavorites, showRecent }),
    queryFn: async () => {
      const documents = await apiClient.getDocuments()
      return documents
    },
    staleTime: 2 * 60 * 1000, // 2分钟内认为数据是新鲜的
  })

  // 根据筛选条件处理数据
  const filteredDocuments = useMemo(() => {
    let documents = query.data || []
    
    // 搜索过滤
    if (searchQuery.trim()) {
      const search = searchQuery.toLowerCase()
      documents = documents.filter(doc => 
        doc.title.toLowerCase().includes(search) ||
        doc.content?.toLowerCase().includes(search)
      )
    }
    
    // 收藏过滤 (暂时跳过，因为API中没有收藏字段)
    // if (showFavorites) {
    //   documents = documents.filter(doc => doc.isFavorite)
    // }
    
    // 最近访问过滤 (显示最近7天修改的文档)
    if (showRecent) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      documents = documents.filter(doc => doc.updatedAt > sevenDaysAgo)
    }
    
    // 排序
    documents.sort((a, b) => {
      let aValue: string | number, bValue: string | number
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'createdAt':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'updatedAt':
          aValue = a.updatedAt.getTime()
          bValue = b.updatedAt.getTime()
          break
        case 'lastModified':
          aValue = (a.lastModified || a.updatedAt).getTime()
          bValue = (b.lastModified || b.updatedAt).getTime()
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
    
    return documents
  }, [query.data, searchQuery, showFavorites, showRecent, sortBy, sortOrder])

  return {
    ...query,
    data: filteredDocuments,
  }
}

// 获取单个文档
export function useDocument(id: string | null) {
  return useQuery({
    queryKey: queryKeys.documents.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      return await apiClient.getDocument(id)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据是新鲜的
  })
}

// 创建文档
export function useCreateDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateDocumentRequest) => {
      return await apiClient.createDocument(data)
    },
    onSuccess: (newDocument) => {
      // 更新文档列表缓存
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.lists() })
      
      // 将新文档直接添加到缓存中
      queryClient.setQueryData(
        queryKeys.documents.detail(newDocument.id),
        newDocument
      )
    },
    onError: (error) => {
      console.error('Failed to create document:', error)
    },
  })
}

// 更新文档
export function useUpdateDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateDocumentRequest> }) => {
      return await apiClient.updateDocument(id, data)
    },
    onSuccess: (updatedDocument) => {
      // 更新文档详情缓存
      queryClient.setQueryData(
        queryKeys.documents.detail(updatedDocument.id),
        updatedDocument
      )
      
      // 更新文档列表缓存
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.lists() })
    },
    onError: (error) => {
      console.error('Failed to update document:', error)
    },
  })
}

// 删除文档
export function useDeleteDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteDocument(id)
      return id
    },
    onSuccess: (deletedId) => {
      // 从文档详情缓存中移除
      queryClient.removeQueries({ queryKey: queryKeys.documents.detail(deletedId) })
      
      // 更新文档列表缓存
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.lists() })
    },
    onError: (error) => {
      console.error('Failed to delete document:', error)
    },
  })
}

// 批量删除文档
export function useBulkDeleteDocuments() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      // 并行删除所有文档
      await Promise.all(ids.map(id => apiClient.deleteDocument(id)))
      return ids
    },
    onSuccess: (deletedIds) => {
      // 从缓存中移除所有删除的文档
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: queryKeys.documents.detail(id) })
      })
      
      // 更新文档列表缓存
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.lists() })
    },
    onError: (error) => {
      console.error('Failed to delete documents:', error)
    },
  })
}

// 预加载文档内容（用于标签页预加载）
export function usePrefetchDocument() {
  const queryClient = useQueryClient()
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.documents.detail(id),
      queryFn: () => apiClient.getDocument(id),
      staleTime: 5 * 60 * 1000,
    })
  }
}

// 搜索文档（实时搜索）
export function useSearchDocuments(query: string, enabled = true) {
  return useQuery({
    queryKey: ['documents', 'search', query],
    queryFn: async () => {
      if (!query.trim()) return []
      
      const documents = await apiClient.getDocuments()
      const search = query.toLowerCase()
      
      return documents
        .filter(doc => 
          doc.title.toLowerCase().includes(search) ||
          doc.content?.toLowerCase().includes(search)
        )
        .slice(0, 10) // 限制搜索结果数量
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 30 * 1000, // 30秒内认为搜索结果是新鲜的
  })
}

// 获取最近访问的文档
export function useRecentDocuments(limit = 5) {
  return useQuery({
    queryKey: ['documents', 'recent', limit],
    queryFn: async () => {
      const documents = await apiClient.getDocuments()
      
      // 按最后修改时间排序，获取最近的文档
      return documents
        .sort((a, b) => {
          const aTime = (a.lastModified || a.updatedAt).getTime()
          const bTime = (b.lastModified || b.updatedAt).getTime()
          return bTime - aTime
        })
        .slice(0, limit)
    },
    staleTime: 60 * 1000, // 1分钟内认为数据是新鲜的
  })
} 