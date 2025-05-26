'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { HocuspocusProvider } from '@hocuspocus/provider'
import type { HocuspocusProviderConfiguration } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface CollaborativeEditorProps {
  documentId: string
  userName?: string
}

interface User {
  name: string
  color: string
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface StatusEvent {
  status: ConnectionStatus
}

export default function CollaborativeEditor({ 
  documentId, 
  userName = `用户${Math.floor(Math.random() * 1000)}` 
}: CollaborativeEditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [users, setUsers] = useState<User[]>([])

  // 只有在provider准备好后才初始化编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // 禁用本地历史，使用协作历史
      }),
      // 只有当provider存在时才添加协作扩展
      ...(provider ? [
        Collaboration.configure({
          document: provider.document,
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: userName,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          },
        }),
      ] : [])
    ],
    content: '<p>开始协作编辑...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
    immediatelyRender: false,
  }, [provider, userName])

  useEffect(() => {
    // 创建Yjs文档
    const ydoc = new Y.Doc()

    // 创建Hocuspocus提供者
    const hocuspocusProvider = new HocuspocusProvider({
      url: 'ws://localhost:1234',
      name: documentId,
      document: ydoc,
      onConnect() {
        setStatus('connected')
        console.log('连接到协作服务器')
      },
      onDisconnect() {
        setStatus('disconnected')
        console.log('与协作服务器断开连接')
      },
    } as HocuspocusProviderConfiguration)

    // 监听连接状态变化
    hocuspocusProvider.on('status', ({ status }: StatusEvent) => {
      setStatus(status)
    })

    setProvider(hocuspocusProvider)

    // 监听用户变化
    hocuspocusProvider.on('awarenessUpdate', () => {
      const awareness = hocuspocusProvider.awareness
      if (awareness) {
        const states = Array.from(awareness.getStates().values()) as { user?: User }[]
        setUsers(states.filter((state): state is { user: User } => !!state.user).map(state => state.user))
      }
    })

    return () => {
      hocuspocusProvider.destroy()
    }
  }, [documentId])

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      case 'disconnected': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected': return '已连接'
      case 'connecting': return '连接中...'
      case 'disconnected': return '已断开'
      default: return '未知状态'
    }
  }

  // 如果provider还没有准备好，显示加载状态
  if (!provider) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <Card className="p-8 text-center">
          <div className="text-lg">正在初始化协作环境...</div>
          <div className="text-sm text-gray-600 mt-2">请稍候</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">协作文档: {documentId}</h2>
            <div className={`text-sm ${getStatusColor()}`}>
              ● {getStatusText()}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">在线用户:</span>
            <div className="flex gap-1">
              {users.map((user, index) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium"
                  style={{ backgroundColor: user.color || '#666' }}
                  title={user.name || '匿名用户'}
                >
                  {(user.name || 'A')[0].toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator className="mb-4" />

        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={editor?.isActive('bold') ? 'bg-gray-200' : ''}
            disabled={!editor}
          >
            粗体
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={editor?.isActive('italic') ? 'bg-gray-200' : ''}
            disabled={!editor}
          >
            斜体
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
            disabled={!editor}
          >
            标题1
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
            disabled={!editor}
          >
            标题2
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={editor?.isActive('bulletList') ? 'bg-gray-200' : ''}
            disabled={!editor}
          >
            无序列表
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {editor ? (
          <EditorContent 
            editor={editor} 
            className="min-h-[500px] border-none focus-within:ring-0"
          />
        ) : (
          <div className="min-h-[500px] flex items-center justify-center text-gray-500">
            编辑器加载中...
          </div>
        )}
      </Card>
    </div>
  )
} 