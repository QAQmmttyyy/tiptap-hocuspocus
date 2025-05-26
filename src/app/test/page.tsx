'use client'

import CollaborativeEditor from '@/components/collaborative-editor'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-center mb-8">编辑器样式测试</h1>
        <CollaborativeEditor 
          documentId="test-doc" 
          userName="测试用户"
        />
      </div>
    </div>
  )
} 