'use client'

import { useState } from 'react'
import DocEditor from '@/components/doc-editor'
import { useTempAuth } from '@/hooks/use-temp-auth'

export default function DocumentsPage() {
  const { user } = useTempAuth()
  const [documentId] = useState('demo-document')

  return (
    <div className="h-full w-full overflow-hidden">
      {user ? (
        <DocEditor 
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