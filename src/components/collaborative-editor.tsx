'use client'

import { HocuspocusProvider } from '@hocuspocus/provider'
import type { HocuspocusProviderConfiguration } from '@hocuspocus/provider'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import CollaborationStatus from '@/components/collaboration-status'
import CollaborativeEditorContent from '@/components/collaborative-editor-content'
import type { User, ConnectionStatus, StatusEvent } from '@/types/collaboration'

interface CollaborativeEditorProps {
  documentId: string
  userName?: string
}

export default function CollaborativeEditor({ 
  documentId, 
  userName = `用户${Math.floor(Math.random() * 1000)}` 
}: CollaborativeEditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    // 创建Hocuspocus提供者
    const hocuspocusProvider = new HocuspocusProvider({
      url: 'ws://localhost:1234',
      name: documentId,
      onConnect() {
        setStatus('connected')
        console.log('连接到协作服务器')
      },
      onDisconnect() {
        setStatus('disconnected')
        console.log('与协作服务器断开连接')
      },
      onOpen: (data) => console.log("onOpen!", data),
			onClose: (data) => console.log("onClose!", data),
			onAuthenticated: (data) => console.log("onAuthenticated!", data),
			onAuthenticationFailed: (data) =>
				console.log("onAuthenticationFailed", data),
      onUnsyncedChanges: (data) =>
        console.log("onUnsyncedChanges", data)
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
      {/* 协作状态组件 */}
      <CollaborationStatus
        status={status}
        users={users}
        documentId={documentId}
      />

      {/* 编辑器内容组件 */}
      <div className="relative">
        <CollaborativeEditorContent
          provider={provider}
          userName={userName}
        />
      </div>
    </div>
  )
} 