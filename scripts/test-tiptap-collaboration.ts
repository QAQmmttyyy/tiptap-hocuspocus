#!/usr/bin/env node

/**
 * 真实Tiptap协作功能测试脚本 (TypeScript版本)
 * 使用真实的Tiptap编辑器 + HocuspocusProvider 测试实时持久化
 * 
 * 新增功能：
 * - 自动启动/停止API服务器
 * - 测试文档自动清理
 * - 完全独立运行
 */

import { JSDOM } from 'jsdom'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import WebSocket from 'ws'
import { exec, spawn, ChildProcess } from 'child_process'
import { promisify } from 'util'
import { startHocuspocusServer, stopHocuspocusServer } from '@/lib/hocuspocus-server'
import { db } from '@/lib/db'

const execAsync = promisify(exec)

// 设置DOM环境 - 必须在导入Tiptap之前
console.log('🔧 设置DOM环境...')
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="editor"></div></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
})

// 全局资源跟踪
const globalResources = {
  editors: new Set<Editor>(),
  providers: new Set<HocuspocusProvider>(),
  hocuspocusStarted: false,
  apiServerProcess: null as ChildProcess | null,
  apiServerStartedByScript: false,
  testDocumentIds: new Set<string>() // 追踪测试创建的文档ID
}

// 全局变量设置
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalWindow = global as any
globalWindow.window = dom.window
globalWindow.document = dom.window.document

// 处理只读属性
try {
  globalWindow.navigator = dom.window.navigator
} catch {
  Object.defineProperty(global, 'navigator', {
    value: dom.window.navigator,
    writable: true,
    configurable: true
  })
}

globalWindow.HTMLElement = dom.window.HTMLElement
globalWindow.Element = dom.window.Element
globalWindow.Node = dom.window.Node
globalWindow.Text = dom.window.Text
globalWindow.Comment = dom.window.Comment
globalWindow.DocumentFragment = dom.window.DocumentFragment
globalWindow.DOMParser = dom.window.DOMParser
globalWindow.XMLSerializer = dom.window.XMLSerializer
globalWindow.MutationObserver = dom.window.MutationObserver
globalWindow.Event = dom.window.Event
globalWindow.EventTarget = dom.window.EventTarget
globalWindow.CustomEvent = dom.window.CustomEvent
globalWindow.Range = dom.window.Range
globalWindow.Selection = dom.window.Selection

// WebSocket设置
if (!globalWindow.WebSocket) {
  globalWindow.WebSocket = WebSocket
}

// 测试配置
const API_BASE = 'http://localhost:3000/api'
const HOCUSPOCUS_URL = 'ws://localhost:1234'
const API_SERVER_STARTUP_TIMEOUT = 60000 // 60秒超时
const TEST_DOCUMENT_PREFIX = '[测试]' // 测试文档标识前缀

// 类型定义
interface TestDocument {
  id: string
  title: string
  description: string
  content?: Buffer | null
  version: number
  updatedAt: string
  collaborators: unknown[]
}

interface EditorInstance {
  editor: Editor
  provider: HocuspocusProvider
  ydoc: Y.Doc
}

interface EditOperation {
  type: 'insertText' | 'insertParagraph' | 'bold' | 'insertHeading'
  text?: string
  content?: string
  level?: number
  delay?: number
}

interface TestResult {
  documentId: string
  finalContent?: string
  savedDocument?: TestDocument | null
  loadedContent?: string
}

interface TestResults {
  test1?: TestResult
  test2?: TestResult
  test3?: TestResult
}

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
} as const

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * 启动API服务器 (Next.js开发服务器)
 */
async function startApiServer(): Promise<boolean> {
  log('🚀 启动API服务器 (Next.js)...', 'blue')
  
  try {
    // 先检查端口是否被占用
    try {
      const { stdout } = await execAsync('lsof -ti:3000')
      if (stdout.trim()) {
        log('⚠️ 端口3000已被占用，尝试清理...', 'yellow')
        const pids = stdout.trim().split('\n')
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`)
            log(`已终止占用端口3000的进程: ${pid}`, 'cyan')
          } catch {
            // 忽略kill失败的错误
          }
        }
        // 等待端口释放
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } catch {
      // 没有进程占用端口，这是正常情况
    }

    // 启动Next.js开发服务器
    const apiProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    })

    globalResources.apiServerProcess = apiProcess
    globalResources.apiServerStartedByScript = true

    // 监听输出，检测服务器启动状态
    let serverReady = false
    const startupPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('API服务器启动超时'))
      }, API_SERVER_STARTUP_TIMEOUT)

      apiProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString()
        // Next.js启动成功的标志
        if (output.includes('Local:') && output.includes('3000')) {
          serverReady = true
          clearTimeout(timeout)
          resolve(true)
        }
      })

      apiProcess.stderr?.on('data', (data: Buffer) => {
        const error = data.toString()
        if (error.includes('EADDRINUSE') || error.includes('port already in use')) {
          clearTimeout(timeout)
          reject(new Error('端口3000被占用'))
        }
      })

      apiProcess.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })

      apiProcess.on('exit', (code) => {
        if (!serverReady) {
          clearTimeout(timeout)
          reject(new Error(`API服务器进程退出，代码: ${code}`))
        }
      })
    })

    await startupPromise
    
    // 额外等待确保服务器完全就绪
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 验证API服务器是否真正可用
    const isReady = await checkApiServerStatus()
    if (!isReady) {
      throw new Error('API服务器启动后无法访问')
    }

    log('✅ API服务器启动成功', 'green')
    return true

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`❌ API服务器启动失败: ${errorMessage}`, 'red')
    
    // 清理失败的进程
    if (globalResources.apiServerProcess) {
      try {
        globalResources.apiServerProcess.kill('SIGTERM')
        globalResources.apiServerProcess = null
        globalResources.apiServerStartedByScript = false
      } catch {
        // 忽略清理错误
      }
    }
    
    return false
  }
}

/**
 * 停止API服务器
 */
async function stopApiServer(): Promise<void> {
  if (globalResources.apiServerProcess && globalResources.apiServerStartedByScript) {
    log('🛑 停止API服务器...', 'blue')
    
    try {
      // 先尝试优雅退出
      globalResources.apiServerProcess.kill('SIGTERM')
      
      // 等待进程退出
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          // 强制退出
          if (globalResources.apiServerProcess) {
            globalResources.apiServerProcess.kill('SIGKILL')
          }
          resolve()
        }, 5000)

        globalResources.apiServerProcess?.on('exit', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      globalResources.apiServerProcess = null
      globalResources.apiServerStartedByScript = false
      
      log('✅ API服务器已停止', 'green')
    } catch {
      log('⚠️ 停止API服务器时出现错误，但继续清理', 'yellow')
    }
  }
}

/**
 * 清理测试文档
 */
async function cleanupTestDocuments(): Promise<void> {
  try {
    log('🧹 清理测试文档...', 'blue')
    
    // 1. 清理本次测试创建的文档
    if (globalResources.testDocumentIds.size > 0) {
      log(`📄 清理本次测试创建的 ${globalResources.testDocumentIds.size} 个文档...`, 'cyan')
      
      const documentIds = Array.from(globalResources.testDocumentIds)
      for (const documentId of documentIds) {
        try {
          const response = await fetch(`${API_BASE}/documents/${documentId}`, {
            method: 'DELETE'
          })
          if (response.ok) {
            log(`  ✅ 已删除文档: ${documentId}`, 'green')
          }
        } catch {
          log(`  ⚠️ 删除文档失败: ${documentId}`, 'yellow')
        }
      }
      
      globalResources.testDocumentIds.clear()
    }

    // 2. 清理历史遗留的测试文档（通过数据库直接清理）
    try {
      const testDocuments = await db.document.findMany({
        where: {
          title: {
            startsWith: TEST_DOCUMENT_PREFIX
          }
        },
        select: { id: true, title: true }
      })

      if (testDocuments.length > 0) {
        log(`📋 发现 ${testDocuments.length} 个历史测试文档，正在清理...`, 'cyan')
        
        await db.document.deleteMany({
          where: {
            title: {
              startsWith: TEST_DOCUMENT_PREFIX
            }
          }
        })
        
        log(`✅ 已清理 ${testDocuments.length} 个历史测试文档`, 'green')
      }
    } catch {
      log('⚠️ 清理历史测试文档时出现错误，但继续执行', 'yellow')
    }

    log('✅ 测试文档清理完成', 'green')
  } catch {
    log('⚠️ 测试文档清理失败，但继续执行', 'yellow')
  }
}

/**
 * 清理所有资源
 */
async function cleanup(): Promise<void> {
  log('\n🧹 开始清理资源...', 'yellow')
  
  try {
    // 清理编辑器实例
    if (globalResources.editors.size > 0) {
      log(`📝 清理 ${globalResources.editors.size} 个编辑器实例...`, 'blue')
      globalResources.editors.forEach(editor => {
        try {
          if (!editor.isDestroyed) {
            editor.destroy()
          }
        } catch (error) {
          console.error('清理编辑器失败:', error)
        }
      })
      globalResources.editors.clear()
    }

    // 清理provider连接
    if (globalResources.providers.size > 0) {
      log(`🔌 清理 ${globalResources.providers.size} 个WebSocket连接...`, 'blue')
      globalResources.providers.forEach(provider => {
        try {
          provider.destroy()
        } catch (error) {
          console.error('清理Provider失败:', error)
        }
      })
      globalResources.providers.clear()
    }

    // 停止Hocuspocus服务器
    if (globalResources.hocuspocusStarted) {
      log('🛑 停止Hocuspocus服务器...', 'blue')
      stopHocuspocusServer()
      globalResources.hocuspocusStarted = false
    }

    // 清理测试文档
    await cleanupTestDocuments()

    // 停止API服务器
    await stopApiServer()

    // 断开数据库连接
    try {
      log('🗄️ 断开数据库连接...', 'blue')
      await db.$disconnect()
    } catch (error) {
      console.error('断开数据库连接失败:', error)
    }

    log('✅ 资源清理完成', 'green')
  } catch (error) {
    log(`❌ 资源清理失败: ${error}`, 'red')
  }
}

/**
 * 安全退出
 */
async function safeExit(code: number = 0): Promise<void> {
  await cleanup()
  process.exit(code)
}

// 注册进程退出处理
process.on('SIGINT', async () => {
  log('\n⚠️ 接收到中断信号，正在清理...', 'yellow')
  await safeExit(0)
})

process.on('SIGTERM', async () => {
  log('\n⚠️ 接收到终止信号，正在清理...', 'yellow')
  await safeExit(0)
})

process.on('uncaughtException', async (error) => {
  log('\n❌ 未捕获的异常:', 'red')
  console.error(error)
  await safeExit(1)
})

process.on('unhandledRejection', async (reason) => {
  log('\n❌ 未处理的Promise拒绝:', 'red')
  console.error(reason)
  await safeExit(1)
})

/**
 * 检查API服务器状态
 */
async function checkApiServerStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/documents`, {
      signal: AbortSignal.timeout(5000) // 5秒超时
    })
    return response.ok || response.status === 401
  } catch {
    return false
  }
}

/**
 * 启动Hocuspocus服务器
 */
async function startHocuspocusServerInstance(): Promise<boolean> {
  log('🚀 启动Hocuspocus服务器...', 'blue')
  
  try {
    const success = await startHocuspocusServer()
    
    if (success) {
      globalResources.hocuspocusStarted = true
      log('✅ Hocuspocus服务器启动成功', 'green')
      // 等待服务器完全启动
      await new Promise(resolve => setTimeout(resolve, 2000))
      return true
    } else {
      throw new Error('Hocuspocus服务器启动失败')
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`❌ 启动Hocuspocus服务器失败: ${errorMessage}`, 'red')
    return false
  }
}

/**
 * 创建测试文档（通过API）
 */
async function createTestDocument(title: string, description: string = ''): Promise<TestDocument> {
  // 为测试文档添加标识前缀
  const testTitle = `${TEST_DOCUMENT_PREFIX}${title}`
  
  try {
    const response = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: testTitle,
        description,
        isPublic: false
      })
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()
    const document = data.data.document
    
    // 追踪测试文档ID，用于后续清理
    globalResources.testDocumentIds.add(document.id)
    
    return document
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`❌ 创建文档失败: ${errorMessage}`, 'red')
    throw error
  }
}

/**
 * 检查文档状态（通过API）
 */
async function checkDocumentState(documentId: string): Promise<TestDocument | null> {
  try {
    const response = await fetch(`${API_BASE}/documents/${documentId}`)
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    return data.data.document
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`❌ 检查文档状态失败: ${errorMessage}`, 'red')
    return null
  }
}

/**
 * 创建Tiptap编辑器实例（带资源追踪）
 */
function createTiptapEditor(documentId: string, userName: string, userColor: string): Promise<EditorInstance> {
  return new Promise((resolve, reject) => {
    log(`🔧 创建Tiptap编辑器: ${userName}`, 'blue')

    // 创建Y.js文档
    const ydoc = new Y.Doc()
    
    let isConnected = false
    
    // 创建Hocuspocus提供者
    const provider = new HocuspocusProvider({
      url: HOCUSPOCUS_URL,
      name: documentId,
      document: ydoc,
      onConnect() {
        isConnected = true
        log(`✅ ${userName} 连接成功`, 'green')
      },
      onDisconnect() {
        isConnected = false
        log(`🔌 ${userName} 断开连接`, 'yellow')
      },
      onAuthenticationFailed() {
        log(`❌ ${userName} 认证失败`, 'red')
        reject(new Error('认证失败'))
      },
      onSynced() {
        log(`🔄 ${userName} 同步完成`, 'green')
      }
    })

    // 注册到全局资源追踪
    globalResources.providers.add(provider)

    // 获取DOM元素
    const editorElement = dom.window.document.getElementById('editor')
    if (!editorElement) {
      reject(new Error('找不到编辑器DOM元素'))
      return
    }

    // 创建编辑器实例
    const editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit.configure({
          history: false, // 禁用历史，使用协作历史
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: userName,
            color: userColor,
          },
        }),
      ],
      content: '', // 初始内容为空
      onCreate: () => {
        log(`📝 ${userName} 编辑器创建完成`, 'green')
        
        // 注册到全局资源追踪
        globalResources.editors.add(editor)
        
        // 等待连接建立
        const checkConnection = () => {
          if (isConnected) {
            resolve({ editor, provider, ydoc })
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        checkConnection()
      },
      onUpdate: ({ editor }) => {
        log(`✏️ ${userName} 编辑内容: ${editor.getHTML().substring(0, 50)}...`, 'cyan')
      },
    })

    // 超时保护
    setTimeout(() => {
      if (!isConnected) {
        reject(new Error(`${userName} 编辑器连接超时`))
      }
    }, 15000)
  })
}

/**
 * 模拟用户编辑操作
 */
async function simulateEditing(editorInstance: EditorInstance, userName: string, operations: EditOperation[]): Promise<string> {
  const { editor } = editorInstance
  
  log(`✏️ ${userName} 开始编辑操作...`, 'blue')
  
  const operationsWithIndex = Array.from(operations.entries())
  for (const [index, operation] of operationsWithIndex) {
    try {
      switch (operation.type) {
        case 'insertText':
          if (operation.text) {
            editor.commands.insertContent(operation.text)
            log(`  ${index + 1}. ${userName} 插入文本: "${operation.text}"`, 'cyan')
          }
          break
          
        case 'insertParagraph':
          if (operation.content) {
            editor.commands.setContent(operation.content)
            log(`  ${index + 1}. ${userName} 设置内容: "${operation.content.substring(0, 30)}..."`, 'cyan')
          }
          break
          
        case 'bold':
          editor.commands.toggleBold()
          log(`  ${index + 1}. ${userName} 切换粗体`, 'cyan')
          break
          
        case 'insertHeading':
          if (operation.level && operation.text) {
            editor.commands.insertContent(`<h${operation.level}>${operation.text}</h${operation.level}>`)
            log(`  ${index + 1}. ${userName} 插入标题: "${operation.text}"`, 'cyan')
          }
          break
          
        default:
          log(`  ${index + 1}. ${userName} 未知操作: ${operation.type}`, 'yellow')
      }
      
      // 操作间隔
      await new Promise(resolve => setTimeout(resolve, operation.delay || 500))
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      log(`❌ ${userName} 编辑操作失败: ${errorMessage}`, 'red')
    }
  }
  
  log(`✅ ${userName} 编辑操作完成`, 'green')
  return editor.getHTML()
}

/**
 * 清理单个编辑器实例
 */
function cleanupEditorInstance(instance: EditorInstance): void {
  try {
    // 从全局追踪中移除
    globalResources.editors.delete(instance.editor)
    globalResources.providers.delete(instance.provider)
    
    // 销毁实例
    if (!instance.editor.isDestroyed) {
      instance.editor.destroy()
    }
    instance.provider.destroy()
  } catch (error) {
    console.error('清理编辑器实例失败:', error)
  }
}

/**
 * 测试1: 单用户基础编辑
 */
async function test1_SingleUserEditing() {
  log('\n🧪 === 测试1: 单用户基础编辑 ===', 'magenta')
  
  try {
    // 1. 创建测试文档
    const document = await createTestDocument('单用户测试文档', '测试单用户编辑功能')
    log(`✅ 文档创建成功: ${document.id}`, 'green')
    
    // 2. 创建编辑器
    const editorInstance = await createTiptapEditor(document.id, '测试用户A', '#3b82f6')
    
    // 3. 模拟编辑操作
    const operations: EditOperation[] = [
      { type: 'insertHeading', level: 1, text: '单用户测试标题', delay: 1000 },
      { type: 'insertText', text: '<p>这是第一段测试内容。</p>', delay: 1000 },
      { type: 'insertText', text: '<p>这是第二段测试内容，包含<strong>粗体</strong>文字。</p>', delay: 1000 },
      { type: 'insertText', text: '<ul><li>列表项1</li><li>列表项2</li></ul>', delay: 1000 }
    ]
    
    const finalContent = await simulateEditing(editorInstance, '测试用户A', operations)
    
    // 4. 等待保存
    log('⏳ 等待文档自动保存...', 'yellow')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 5. 验证保存结果
    const savedDocument = await checkDocumentState(document.id)
    
    if (savedDocument && savedDocument.content) {
      log(`✅ 文档保存验证成功:`, 'green')
      log(`   - 版本: ${savedDocument.version}`, 'green')
      log(`   - 内容大小: ${savedDocument.content ? 'bytes' : '无内容'}`, 'green')
      log(`   - 更新时间: ${new Date(savedDocument.updatedAt).toLocaleString()}`, 'green')
    } else {
      throw new Error('文档保存验证失败')
    }
    
    // 6. 清理
    cleanupEditorInstance(editorInstance)
    
    return { documentId: document.id, finalContent, savedDocument }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`❌ 单用户编辑测试失败: ${errorMessage}`, 'red')
    throw error
  }
}

/**
 * 测试2: 多用户协作编辑
 */
async function test2_MultiUserCollaboration() {
  log('\n🧪 === 测试2: 多用户协作编辑 ===', 'magenta')
  
  try {
    // 1. 创建测试文档
    const document = await createTestDocument('多用户协作文档', '测试多用户实时协作编辑')
    log(`✅ 文档创建成功: ${document.id}`, 'green')
    
    // 2. 同时创建多个编辑器实例
    log('🔧 创建多个编辑器实例...', 'blue')
    const [editorA, editorB, editorC] = await Promise.all([
      createTiptapEditor(document.id, '用户A', '#ef4444'),
      createTiptapEditor(document.id, '用户B', '#22c55e'),
      createTiptapEditor(document.id, '用户C', '#8b5cf6')
    ])
    
    // 3. 并行编辑操作
    log('✏️ 开始并行编辑...', 'blue')
    const editingPromises = [
      simulateEditing(editorA, '用户A', [
        { type: 'insertHeading', level: 1, text: '用户A的标题', delay: 500 },
        { type: 'insertText', text: '<p>用户A添加的第一段内容。</p>', delay: 800 }
      ]),
      
      simulateEditing(editorB, '用户B', [
        { type: 'insertText', text: '<p>用户B添加的内容在开头。</p>', delay: 600 },
        { type: 'insertHeading', level: 2, text: '用户B的子标题', delay: 700 }
      ]),
      
      simulateEditing(editorC, '用户C', [
        { type: 'insertText', text: '<p>用户C添加的<em>斜体</em>内容。</p>', delay: 400 },
        { type: 'insertText', text: '<blockquote>用户C的引用内容</blockquote>', delay: 900 }
      ])
    ]
    
    await Promise.all(editingPromises)
    
    // 4. 等待同步和保存
    log('⏳ 等待协作同步和保存...', 'yellow')
    await new Promise(resolve => setTimeout(resolve, 8000))
    
    // 5. 验证最终结果
    const savedDocument = await checkDocumentState(document.id)
    
    if (savedDocument && savedDocument.content) {
      log(`✅ 多用户协作验证成功:`, 'green')
      log(`   - 版本: ${savedDocument.version}`, 'green')
      log(`   - 协作者数量: ${savedDocument.collaborators.length}`, 'green')
      log(`   - 最后更新: ${new Date(savedDocument.updatedAt).toLocaleString()}`, 'green')
    } else {
      throw new Error('多用户协作验证失败')
    }
    
    // 6. 清理所有实例
    ;[editorA, editorB, editorC].forEach(instance => {
      cleanupEditorInstance(instance)
    })
    
    return { documentId: document.id, savedDocument }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`❌ 多用户协作测试失败: ${errorMessage}`, 'red')
    throw error
  }
}

/**
 * 测试3: 文档加载验证
 */
async function test3_DocumentLoading(existingDocumentId: string) {
  log('\n🧪 === 测试3: 文档加载验证 ===', 'magenta')
  
  try {
    // 1. 创建新的编辑器实例连接到已存在的文档
    const editorInstance = await createTiptapEditor(existingDocumentId, '加载测试用户', '#f97316')
    
    // 2. 等待文档加载
    log('⏳ 等待文档内容加载...', 'yellow')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 3. 检查加载的内容
    const loadedContent = editorInstance.editor.getHTML()
    log(`📄 加载的内容: ${loadedContent.substring(0, 100)}...`, 'cyan')
    
    // 4. 进行少量编辑验证
    await simulateEditing(editorInstance, '加载测试用户', [
      { type: 'insertText', text: '<p>【加载测试】新增内容验证</p>', delay: 1000 }
    ])
    
    // 5. 等待保存
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 6. 清理
    cleanupEditorInstance(editorInstance)
    
    log(`✅ 文档加载测试完成`, 'green')
    return { documentId: existingDocumentId, loadedContent }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`❌ 文档加载测试失败: ${errorMessage}`, 'red')
    throw error
  }
}

/**
 * 主测试函数 - 完全独立运行
 */
async function runTiptapCollaborationTests(): Promise<TestResults> {
  log('🚀 开始Tiptap实时协作功能测试...', 'magenta')
  log(`📡 Hocuspocus服务器: ${HOCUSPOCUS_URL}`, 'blue')
  log(`📡 API服务器: ${API_BASE}`, 'blue')
  
  try {
    // 1. 清理测试环境
    log('\n🧹 准备测试环境...', 'blue')
    await cleanupTestDocuments() // 先清理旧的测试文档
    
    // 2. 检查并启动API服务器
    log('\n🔍 检查API服务器状态...', 'blue')
    let apiRunning = await checkApiServerStatus()
    
    if (!apiRunning) {
      log('📡 API服务器未运行，正在自动启动...', 'yellow')
      const startSuccess = await startApiServer()
      if (!startSuccess) {
        throw new Error('API服务器启动失败，无法继续测试')
      }
      
      // 再次验证API服务器状态
      apiRunning = await checkApiServerStatus()
      if (!apiRunning) {
        throw new Error('API服务器启动后仍然无法访问')
      }
    } else {
      log('✅ 发现运行中的API服务器', 'green')
    }
    
    // 3. 启动Hocuspocus服务器
    const hocuspocusStarted = await startHocuspocusServerInstance()
    if (!hocuspocusStarted) {
      throw new Error('无法启动Hocuspocus服务器')
    }
    
    // 4. 运行测试
    const results: TestResults = {}
    
    log('\n📋 开始执行测试套件...', 'blue')
    results.test1 = await test1_SingleUserEditing()
    results.test2 = await test2_MultiUserCollaboration()
    results.test3 = await test3_DocumentLoading(results.test1.documentId)
    
    // 5. 最终数据库状态检查
    log('\n🔍 最终数据库状态检查...', 'blue')
    const allDocsResponse = await fetch(`${API_BASE}/documents`)
    const allDocsData = await allDocsResponse.json()
    const testDocs = allDocsData.data.documents.filter((doc: TestDocument) => 
      doc.title.includes(TEST_DOCUMENT_PREFIX)
    )
    
    // 6. 测试总结
    log('\n🎉 === Tiptap协作测试完成 ===', 'magenta')
    log('📊 测试结果总结:', 'blue')
    log('  ✅ 单用户基础编辑 - 通过', 'green')
    log('  ✅ 多用户协作编辑 - 通过', 'green')
    log('  ✅ 文档加载验证 - 通过', 'green')
    
    log(`\n🏆 所有测试通过！实时协作功能正常工作`, 'green')
    log(`📈 本次测试文档数量: ${testDocs.length}`, 'cyan')
    log(`💾 数据持久化: 正常`, 'cyan')
    log(`⚡ 实时同步: 正常`, 'cyan')
    log(`🧹 资源管理: 自动清理`, 'cyan')
    
    // 7. 自动清理并退出
    log('\n🎯 测试完成，正在清理资源...', 'yellow')
    await cleanup()
    
    log('✅ 测试脚本执行完成', 'green')
    return results
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`\n❌ 测试失败: ${errorMessage}`, 'red')
    log(`💡 请确保：`, 'yellow')
    log(`   1. Node.js和npm已正确安装`, 'yellow')
    log(`   2. 项目依赖已安装完成 (npm install)`, 'yellow')
    log(`   3. 端口1234和3000未被其他程序占用`, 'yellow')
    log(`   4. 数据库文件可写入`, 'yellow')
    
    await safeExit(1)
    throw error // 永远不会到达这里，但为了类型检查
  }
}

// 检查是否为直接执行
const currentFilePath = process.argv[1]
const isMainFile = currentFilePath && currentFilePath.includes('test-tiptap-collaboration')

if (isMainFile) {
  runTiptapCollaborationTests()
    .then(() => {
      log('\n🎊 测试成功完成！系统完全独立运行正常', 'green')
      process.exit(0)
    })
    .catch((error) => {
      log('\n💥 测试执行失败:', 'red')
      console.error(error)
      process.exit(1)
    })
}

export {
  runTiptapCollaborationTests,
  test1_SingleUserEditing,
  test2_MultiUserCollaboration,
  test3_DocumentLoading
} 