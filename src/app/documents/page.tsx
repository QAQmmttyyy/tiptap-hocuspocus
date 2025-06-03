'use client'

import { useState } from 'react'
import CollaborativeEditor from '@/components/collaborative-editor'
import { useTempAuth } from '@/hooks/use-temp-auth'

export default function DocumentsPage() {
  const { user } = useTempAuth()
  const [documentId] = useState('demo-document')

  return (
    <div className="h-full w-full overflow-hidden">
      {user ? (
        <CollaborativeEditor 
          documentId={documentId} 
          userName={user.name}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>正在加载...</p>
        </div>
      )}
    </div>
  )
} 