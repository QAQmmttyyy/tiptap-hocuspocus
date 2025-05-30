import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// 临时硬编码用户ID（跳过认证）
const TEMP_USER_ID = 'temp_user_001' // 张三

// 文档创建数据验证Schema
const CreateDocumentSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  description: z.string().max(1000, '描述不能超过1000字符').optional(),
  isPublic: z.boolean().optional().default(false)
})

/**
 * GET /api/documents - 获取文档列表
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📖 API调用: GET /api/documents')
    
    // 解析查询参数
    const { searchParams } = new URL(request.url)
    
    // 手动处理参数，支持中文搜索
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    
    // 处理搜索参数，支持中文字符
    let search: string | null = searchParams.get('search')
    if (search) {
      try {
        // 尝试解码URL编码的中文
        search = decodeURIComponent(search)
      } catch {
        // 如果解码失败，使用原始值
        console.log('搜索参数解码失败，使用原始值:', search)
      }
      // 去除空白字符
      search = search.trim()
      if (search.length === 0) {
        search = null
      }
    }

    const skip = (page - 1) * limit

    console.log(`🔍 查询参数: page=${page}, limit=${limit}, search="${search || ''}"`)

    // 构建查询条件
    const whereCondition = {
      AND: [
        // 权限过滤：用户可以访问的文档
        {
          OR: [
            { authorId: TEMP_USER_ID }, // 我创建的文档
            { collaborators: { some: { userId: TEMP_USER_ID } } }, // 我参与的文档
            { isPublic: true } // 公开文档
          ]
        },
        // 搜索过滤
        search ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } }
          ]
        } : {}
      ]
    }

    // 并行查询文档和总数
    const [documents, total] = await Promise.all([
      db.document.findMany({
        where: whereCondition,
        select: {
          id: true,
          title: true,
          description: true,
          isPublic: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: { id: true, name: true, avatar: true }
          },
          collaborators: {
            include: {
              user: { select: { id: true, name: true, avatar: true } }
            }
          },
          _count: {
            select: { collaborators: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      db.document.count({ where: whereCondition })
    ])

    const totalPages = Math.ceil(total / limit)

    console.log(`✅ 成功获取文档列表: ${documents.length}/${total} 文档`)

    return NextResponse.json({
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      }
    })

  } catch (error) {
    console.error('❌ 获取文档列表失败:', error)
    return NextResponse.json(
      { 
        error: '获取文档列表失败', 
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents - 创建新文档
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 API调用: POST /api/documents')
    
    // 解析和验证请求体
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.log('❌ JSON解析失败:', jsonError instanceof Error ? jsonError.message : '未知错误')
      return NextResponse.json(
        {
          error: '请求体格式错误',
          message: 'JSON格式无效，请检查请求数据格式'
        },
        { status: 400 }
      )
    }
    
    console.log('📄 请求数据:', body)

    const validationResult = CreateDocumentSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('❌ 数据验证失败:', validationResult.error.format())
      return NextResponse.json(
        {
          error: '数据验证失败',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { title, description, isPublic } = validationResult.data

    // 使用事务创建文档和协作关系
    const result = await db.$transaction(async (tx) => {
      // 1. 创建文档
      const document = await tx.document.create({
        data: {
          title,
          description: description || '',
          isPublic,
          authorId: TEMP_USER_ID,
          version: 1
        },
        include: {
          author: {
            select: { id: true, name: true, avatar: true }
          }
        }
      })

      // 2. 自动创建拥有者协作关系
      await tx.documentCollaborator.create({
        data: {
          userId: TEMP_USER_ID,
          documentId: document.id,
          role: 'OWNER'
        }
      })

      console.log(`✅ 成功创建文档: ${document.id} - "${title}"`)
      return document
    })

    return NextResponse.json({
      success: true,
      data: {
        document: result
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ 创建文档失败:', error)
    return NextResponse.json(
      {
        error: '创建文档失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
} 