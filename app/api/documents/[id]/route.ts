import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// 临时硬编码用户ID（跳过认证）
const TEMP_USER_ID = 'temp_user_001' // 张三

// 文档更新数据验证Schema
const UpdateDocumentSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符').optional(),
  description: z.string().max(1000, '描述不能超过1000字符').optional(),
  isPublic: z.boolean().optional()
})

// 文档ID验证Schema
const DocumentIdSchema = z.string().min(1, '文档ID不能为空')

/**
 * GET /api/documents/[id] - 获取文档详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`📖 API调用: GET /api/documents/${id}`)

    // 验证文档ID
    const idValidation = DocumentIdSchema.safeParse(id)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: '文档ID无效' },
        { status: 400 }
      )
    }

    const documentId = idValidation.data

    // 查找文档并检查权限
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { authorId: TEMP_USER_ID }, // 我创建的文档
          { collaborators: { some: { userId: TEMP_USER_ID } } }, // 我参与的文档
          { isPublic: true } // 公开文档
        ]
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: [
            { role: 'asc' }, // OWNER 排在前面
            { createdAt: 'asc' }
          ]
        },
        _count: {
          select: { collaborators: true }
        }
      }
    })

    if (!document) {
      console.log(`❌ 文档不存在或无权限访问: ${documentId}`)
      return NextResponse.json(
        { error: '文档不存在或无权限访问' },
        { status: 404 }
      )
    }

    // 获取当前用户在此文档中的角色
    const userRole = document.collaborators.find(
      collab => collab.userId === TEMP_USER_ID
    )?.role || null

    console.log(`✅ 成功获取文档详情: ${document.title} (用户角色: ${userRole})`)

    return NextResponse.json({
      success: true,
      data: {
        document: {
          ...document,
          currentUserRole: userRole
        }
      }
    })

  } catch (error) {
    console.error('❌ 获取文档详情失败:', error)
    return NextResponse.json(
      {
        error: '获取文档详情失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/documents/[id] - 更新文档元数据
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`📝 API调用: PUT /api/documents/${id}`)

    // 验证文档ID
    const idValidation = DocumentIdSchema.safeParse(id)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: '文档ID无效' },
        { status: 400 }
      )
    }

    const documentId = idValidation.data

    // 解析和验证请求体
    const body = await request.json()
    console.log('📄 更新数据:', body)

    const validationResult = UpdateDocumentSchema.safeParse(body)
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

    // 检查文档存在和编辑权限
    const existingDocument = await db.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { authorId: TEMP_USER_ID }, // 我创建的文档
          { 
            collaborators: { 
              some: { 
                userId: TEMP_USER_ID,
                role: { in: ['OWNER', 'EDITOR'] } // 只有 OWNER 和 EDITOR 可以编辑
              } 
            } 
          }
        ]
      }
    })

    if (!existingDocument) {
      console.log(`❌ 文档不存在或无编辑权限: ${documentId}`)
      return NextResponse.json(
        { error: '文档不存在或无编辑权限' },
        { status: 403 }
      )
    }

    // 过滤出实际需要更新的字段
    const updateData = Object.fromEntries(
      Object.entries(validationResult.data).filter(([, value]) => value !== undefined)
    )

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '没有提供需要更新的数据' },
        { status: 400 }
      )
    }

    // 更新文档
    const updatedDocument = await db.document.update({
      where: { id: documentId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        },
        _count: {
          select: { collaborators: true }
        }
      }
    })

    console.log(`✅ 成功更新文档: ${updatedDocument.title}`)

    return NextResponse.json({
      success: true,
      data: {
        document: updatedDocument
      }
    })

  } catch (error) {
    console.error('❌ 更新文档失败:', error)
    return NextResponse.json(
      {
        error: '更新文档失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/documents/[id] - 删除文档
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🗑️ API调用: DELETE /api/documents/${id}`)

    // 验证文档ID
    const idValidation = DocumentIdSchema.safeParse(id)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: '文档ID无效' },
        { status: 400 }
      )
    }

    const documentId = idValidation.data

    // 检查文档存在和删除权限（只有OWNER可以删除）
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { authorId: TEMP_USER_ID }, // 我创建的文档
          { 
            collaborators: { 
              some: { 
                userId: TEMP_USER_ID,
                role: 'OWNER' // 只有 OWNER 可以删除
              } 
            } 
          }
        ]
      },
      select: {
        id: true,
        title: true,
        authorId: true
      }
    })

    if (!document) {
      console.log(`❌ 文档不存在或无删除权限: ${documentId}`)
      return NextResponse.json(
        { error: '文档不存在或无删除权限（仅文档拥有者可删除）' },
        { status: 403 }
      )
    }

    // 使用事务删除文档及相关数据
    await db.$transaction(async (tx) => {
      // 1. 删除协作关系
      await tx.documentCollaborator.deleteMany({
        where: { documentId }
      })

      // 2. 删除文档
      await tx.document.delete({
        where: { id: documentId }
      })
    })

    console.log(`✅ 成功删除文档: ${document.title}`)

    return NextResponse.json({
      success: true,
      message: '文档已删除'
    })

  } catch (error) {
    console.error('❌ 删除文档失败:', error)
    return NextResponse.json(
      {
        error: '删除文档失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
} 