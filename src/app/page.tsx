'use client'

import { useState } from 'react'
import CollaborativeEditor from '@/components/collaborative-editor'
import ServerStatus from '@/components/server-status'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Home() {
  const [documentId, setDocumentId] = useState('demo-document')
  const [userName, setUserName] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const handleStartEditing = () => {
    if (!userName.trim()) {
      setUserName(`用户${Math.floor(Math.random() * 1000)}`)
    }
    setIsEditing(true)
  }

  const handleNewDocument = () => {
    const newDocId = `document-${Date.now()}`
    setDocumentId(newDocId)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
            >
              ← 返回首页
            </Button>
            <Button 
              variant="outline" 
              onClick={handleNewDocument}
            >
              新建文档
            </Button>
          </div>
          
          <ServerStatus />
          
          <CollaborativeEditor 
            documentId={documentId} 
            userName={userName}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ServerStatus />
        
        <Card className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">实时协作文档</h1>
            <p className="text-gray-600">基于 Tiptap + Hocuspocus 的实时编辑器</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">用户名</label>
              <Input
                type="text"
                placeholder="输入你的用户名（可选）"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">文档ID</label>
              <Input
                type="text"
                placeholder="文档标识符"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleStartEditing}
              disabled={!documentId.trim()}
            >
              开始协作编辑
            </Button>

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleNewDocument}
            >
              创建新文档
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">使用说明：</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 首先启动协作服务器</li>
              <li>• 多个用户可以使用相同的文档ID进行协作</li>
              <li>• 实时同步编辑内容和光标位置</li>
              <li>• 支持基本的富文本编辑功能</li>
            </ul>
          </div>
        </Card>
      </div>
    </main>
  )
}
