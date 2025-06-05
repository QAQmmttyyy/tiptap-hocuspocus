'use client'

import type { User, ConnectionStatus } from '@/types/collaboration'

interface CollaborationStatusProps {
  status: ConnectionStatus
  users: User[]
  documentId: string
}

export default function CollaborationStatus({ 
  status, 
  users, 
  documentId 
}: CollaborationStatusProps) {
  const getStatusText = () => {
    switch (status) {
      case 'connected': return '已连接'
      case 'connecting': return '连接中...'
      case 'disconnected': return '已断开'
      default: return '未知状态'
    }
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 rounded-t-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-green-500' : 
            status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
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
              style={{ backgroundColor: user.color || '#666' }}
              title={user.name || '匿名用户'}
            >
              {(user.name || 'A')[0].toUpperCase()}
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
  )
} 