"use client"

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Heading from "@tiptap/extension-heading"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import { HocuspocusProvider } from "@hocuspocus/provider"
import type { HocuspocusProviderConfiguration } from "@hocuspocus/provider"
import * as Y from "yjs"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarExtension } from "@/lib/calendar-extension"
import { WorkflowExtension } from "@/lib/workflow-extension"
import { CalendarIcon, Workflow } from "lucide-react"

interface CollaborativeEditorProps {
  documentId: string
  userName?: string
}

interface User {
  name: string
  color: string
}

type ConnectionStatus = "connecting" | "connected" | "disconnected"

interface StatusEvent {
  status: ConnectionStatus
}

export default function CollaborativeEditor({
  documentId,
  userName = `用户${Math.floor(Math.random() * 1000)}`,
}: CollaborativeEditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const [users, setUsers] = useState<User[]>([])

  // 只有在provider准备好后才初始化编辑器
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: false, // 禁用本地历史，使用协作历史
          heading: false, // 禁用 StarterKit 的 heading，使用自定义配置
          paragraph: {
            HTMLAttributes: {
              class: "my-2 leading-6 text-gray-800 first:mt-0",
            },
          },
          bulletList: {
            HTMLAttributes: {
              class: "my-4 pl-6",
            },
          },
          orderedList: {
            HTMLAttributes: {
              class: "my-4 pl-6",
            },
          },
          listItem: {
            HTMLAttributes: {
              class: "my-1 leading-7",
            },
          },
          bold: {
            HTMLAttributes: {
              class: "font-semibold text-gray-900",
            },
          },
          italic: {
            HTMLAttributes: {
              class: "italic text-gray-900",
            },
          },
          strike: {
            HTMLAttributes: {
              class: "line-through text-gray-600",
            },
          },
          code: {
            HTMLAttributes: {
              class: "bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono",
            },
          },
          codeBlock: {
            HTMLAttributes: {
              class:
                "bg-gray-50 border border-gray-200 p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm text-gray-800",
            },
          },
          blockquote: {
            HTMLAttributes: {
              class: "border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600",
            },
          },
        }),
        Heading.configure({
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: "heading",
          },
        }),
        CalendarExtension,
        WorkflowExtension,
        // 只有当provider存在时才添加协作扩展
        ...(provider
          ? [
              Collaboration.configure({
                document: provider.document,
              }),
              CollaborationCursor.configure({
                provider: provider,
                user: {
                  name: userName,
                  color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                },
              }),
            ]
          : []),
      ],
      content: "<p>开始协作编辑...</p>",
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px]",
        },
      },
      immediatelyRender: false,
    },
    [provider, userName],
  )

  useEffect(() => {
    // 创建Yjs文档
    const ydoc = new Y.Doc()

    // 创建Hocuspocus提供者
    const hocuspocusProvider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: documentId,
      document: ydoc,
      onConnect() {
        setStatus("connected")
        console.log("连接到协作服务器")
      },
      onDisconnect() {
        setStatus("disconnected")
        console.log("与协作服务器断开连接")
      },
    } as HocuspocusProviderConfiguration)

    // 监听连接状态变化
    hocuspocusProvider.on("status", ({ status }: StatusEvent) => {
      setStatus(status)
    })

    setProvider(hocuspocusProvider)

    // 监听用户变化
    hocuspocusProvider.on("awarenessUpdate", () => {
      const awareness = hocuspocusProvider.awareness
      if (awareness) {
        const states = Array.from(awareness.getStates().values()) as { user?: User }[]
        setUsers(
          states
            .filter((state): state is { user: User } => !!state.user)
            .map((state) => state.user),
        )
      }
    })

    return () => {
      hocuspocusProvider.destroy()
    }
  }, [documentId])

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "已连接"
      case "connecting":
        return "连接中..."
      case "disconnected":
        return "已断开"
      default:
        return "未知状态"
    }
  }

  // 如果provider还没有准备好，显示加载状态
  if (!provider) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4">
        <Card className="p-8 text-center">
          <div className="text-lg">正在初始化协作环境...</div>
          <div className="text-sm text-gray-600 mt-2">请稍候</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto border shadow-lg rounded-lg">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                status === "connected"
                  ? "bg-green-500"
                  : status === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-600">{getStatusText()}</span>
          </div>

          <div className="h-4 w-px bg-gray-300" />

          <div className="text-sm text-gray-500">
            文档: <span className="font-medium text-gray-700">{documentId}</span>
          </div>
        </div>

        {/* 在线用户头像 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">协作者</span>
          <div className="flex -space-x-2">
            {users.slice(0, 5).map((user, index) => (
              <div
                key={index}
                className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium shadow-sm"
                style={{ backgroundColor: user.color || "#666" }}
                title={user.name || "匿名用户"}
              >
                {(user.name || "A")[0].toUpperCase()}
              </div>
            ))}
            {users.length > 5 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-medium shadow-sm">
                +{users.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 编辑器容器 */}
      <div className="relative">
        {/* 编辑器内容区域 */}
        <div className="p-6">
          {editor ? (
            <div className="relative">
              {/* Bubble Menu - 选中文本时显示 */}
              <BubbleMenu
                editor={editor}
                tippyOptions={{ duration: 100 }}
                shouldShow={({ state, from, to }) => {
                  // 如果选中的是calendar或workflow节点，不显示bubble menu
                  const { selection } = state
                  const { $from } = selection

                  // 检查当前选中的节点是否是calendar或workflow节点
                  if (
                    $from.parent.type.name === "calendar" ||
                    $from.parent.type.name === "workflow"
                  ) {
                    return false
                  }

                  // 检查选中范围内是否包含calendar或workflow节点
                  let hasSpecialNode = false
                  state.doc.nodesBetween(from, to, (node) => {
                    if (node.type.name === "calendar" || node.type.name === "workflow") {
                      hasSpecialNode = true
                      return false
                    }
                  })

                  if (hasSpecialNode) {
                    return false
                  }

                  // 默认的显示逻辑：有选中文本时显示
                  return from !== to
                }}
                className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex flex-wrap gap-1 z-50 w-fit  items-center"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`h-8 px-2 text-xs transition-colors ${
                    editor.isActive("bold")
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-bold">B</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`h-8 px-2 text-xs transition-colors ${
                    editor.isActive("italic")
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="italic">I</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`h-8 px-2 text-xs transition-colors ${
                    editor.isActive("strike")
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="line-through">S</span>
                </Button>

                <div className="w-px h-4 bg-gray-300 mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`h-8 px-2 text-xs transition-colors ${
                    editor.isActive("heading", { level: 1 })
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  H1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`h-8 px-2 text-xs transition-colors ${
                    editor.isActive("heading", { level: 2 })
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  H2
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`h-8 px-2 text-xs transition-colors ${
                    editor.isActive("heading", { level: 3 })
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  H3
                </Button>

                <div className="w-px h-4 bg-gray-300 mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className={`h-8 px-2 text-xs transition-colors ${
                    editor.isActive("code")
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-mono">&lt;/&gt;</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={`h-8 px-2 text-xs transition-colors ${
                    editor.isActive("codeBlock")
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  代码块
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={`h-8 px-2 text-xs transition-colors ${
                    editor.isActive("blockquote")
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  引用
                </Button>

                <div className="w-px h-4 bg-gray-300 mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`h-8 px-2 text-xs transition-colors ${
                    editor.isActive("bulletList")
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  • 列表
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`h-8 px-2 text-xs transition-colors ${
                    editor.isActive("orderedList")
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  1. 列表
                </Button>

                <div className="w-px h-4 bg-gray-300 mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().insertCalendar().run()}
                  className="h-8 px-2 text-xs transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  title="插入日历"
                >
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  日历
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().insertWorkflow().run()}
                  className="h-8 px-2 text-xs transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  title="插入工作流"
                >
                  <Workflow className="h-3 w-3 mr-1" />
                  工作流
                </Button>
              </BubbleMenu>

              <EditorContent editor={editor} className="focus-within:outline-none" />
            </div>
          ) : (
            <div className="min-h-[500px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-lg mb-2">编辑器加载中...</div>
                <div className="text-sm">请稍候片刻</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
