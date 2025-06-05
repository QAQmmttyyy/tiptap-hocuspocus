// API客户端封装，与现有后端接口集成
interface Document {
  id: string
  title: string
  content?: string
  createdAt: Date
  updatedAt: Date
  isDirty?: boolean
  lastModified?: Date
}

interface CreateDocumentRequest {
  title: string
  content?: string
}

interface User {
  id: string
  name: string
  email?: string
  avatar?: string
  color: string
}

// 嵌套的API响应格式
interface APINestedDocumentResponse {
  success: boolean
  data: {
    document: {
      id: string
      title: string
      description?: string
      createdAt: string
      updatedAt: string
    }
  }
}

// 真实API响应格式
interface APIDocumentsResponse {
  success: boolean
  data: {
    documents: {
      id: string
      title: string
      description: string
      isPublic: boolean
      version: number
      createdAt: string
      updatedAt: string
      author: {
        id: string
        name: string
        avatar: string
      }
      collaborators: Array<{
        id: string
        userId: string
        documentId: string
        role: string
        createdAt: string
        user: {
          id: string
          name: string
          avatar: string
        }
      }>
      _count: {
        collaborators: number
      }
    }[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasMore: boolean
    }
  }
}

class APIClient {
  private baseURL: string

  constructor(baseURL = '/api') {
    this.baseURL = baseURL
  }

  // 文档相关API
  async getDocuments(): Promise<Document[]> {
    console.log('📖 API调用: GET /api/documents')
    const response = await fetch(`${this.baseURL}/documents`)
    if (!response.ok) {
      throw new Error('Failed to fetch documents')
    }
    const apiResponse: APIDocumentsResponse = await response.json()
    
    // 适配真实API响应格式: { success: true, data: { documents: [...] } }
    const documents = apiResponse.success ? apiResponse.data.documents : []
    console.log(`✅ 成功获取文档列表: ${documents.length} 个文档`)
    
    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.description, // API返回的是description字段
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      isDirty: false, // 默认为false
    }))
  }

  async getDocument(id: string): Promise<Document | null> {
    try {
      const response = await fetch(`${this.baseURL}/documents/${id}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch document')
      }
      
      const apiResponse: APINestedDocumentResponse = await response.json()
      
      if (!apiResponse.success || !apiResponse.data || !apiResponse.data.document) {
        return null
      }
      
      const doc = apiResponse.data.document
      return {
        id: doc.id,
        title: doc.title,
        content: doc.description,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      }
    } catch (error) {
      console.error('Error fetching document:', error)
      return null
    }
  }

  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    const response = await fetch(`${this.baseURL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create document')
    }
    
    const apiResponse: APINestedDocumentResponse = await response.json()
    
    if (!apiResponse.success || !apiResponse.data || !apiResponse.data.document) {
      throw new Error('Invalid API response format')
    }
    
    const doc = apiResponse.data.document
    return {
      id: doc.id,
      title: doc.title,
      content: doc.description,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    }
  }

  async updateDocument(id: string, data: Partial<CreateDocumentRequest>): Promise<Document> {
    const response = await fetch(`${this.baseURL}/documents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to update document')
    }
    
    const apiResponse: APINestedDocumentResponse = await response.json()
    
    if (!apiResponse.success || !apiResponse.data || !apiResponse.data.document) {
      throw new Error('Invalid API response format')
    }
    
    const doc = apiResponse.data.document
    return {
      id: doc.id,
      title: doc.title,
      content: doc.description,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    }
  }

  async deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/documents/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete document')
    }
  }

  // 健康检查API
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      const response = await fetch(`${this.baseURL}/health`)
      if (!response.ok) {
        throw new Error('Health check failed')
      }
      const data = await response.json()
      return {
        ...data,
        timestamp: new Date(data.timestamp || Date.now()),
      }
    } catch {
      return {
        status: 'error',
        timestamp: new Date(),
      }
    }
  }
}

// 单例API客户端
export const apiClient = new APIClient()

// 导出类型
export type { Document, CreateDocumentRequest, User } 