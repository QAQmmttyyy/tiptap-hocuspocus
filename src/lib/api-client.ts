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

// API响应类型
interface APIDocumentResponse {
  id: string
  title: string
  content?: string
  createdAt: string
  updatedAt: string
}

class APIClient {
  private baseURL: string

  constructor(baseURL = '/api') {
    this.baseURL = baseURL
  }

  // 文档相关API
  async getDocuments(): Promise<Document[]> {
    const response = await fetch(`${this.baseURL}/documents`)
    if (!response.ok) {
      throw new Error('Failed to fetch documents')
    }
    const data: APIDocumentResponse[] = await response.json()
    return data.map((doc) => ({
      ...doc,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    }))
  }

  async getDocument(id: string): Promise<Document | null> {
    try {
      const response = await fetch(`${this.baseURL}/documents/${id}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch document')
      }
      const doc: APIDocumentResponse = await response.json()
      return {
        ...doc,
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
    
    const doc: APIDocumentResponse = await response.json()
    return {
      ...doc,
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
    
    const doc: APIDocumentResponse = await response.json()
    return {
      ...doc,
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