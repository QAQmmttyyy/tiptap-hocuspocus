'use client'

import { useMemo } from 'react'
import { useTabStore } from '@/lib/stores/tab-store'
import CollaborativeEditor from '@/components/collaborative-editor'
import { useTempAuth } from '@/hooks/use-temp-auth'
import { cn } from '@/lib/utils'

interface TabContentProps {
  className?: string
}

export default function TabContent({ className }: TabContentProps) {
  const { tabs, activeTabId, getActiveTab } = useTabStore()
  const { user } = useTempAuth()
  
  const activeTab = useMemo(() => getActiveTab(), [activeTabId, tabs])
  
  // 如果没有活跃标签页，显示欢迎界面
  if (!activeTab) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center h-full bg-muted/10",
        className
      )}>
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-muted-foreground" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">欢迎使用协作文档</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              从左侧栏选择一个文档开始编辑，或者创建一个新文档。
              <br />
              支持实时协作、多标签页同时编辑。
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">T</kbd>
            <span>新建标签页</span>
          </div>
        </div>
      </div>
    )
  }
  
  // 如果用户未认证，显示加载状态
  if (!user) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center h-full",
        className
      )}>
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">正在加载用户信息...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("flex-1 h-full overflow-hidden", className)}>
      <CollaborativeEditor 
        documentId={activeTab.documentId}
        userName={user.name}
        key={activeTab.id} // 重要：使用tab.id作为key，确保编辑器实例独立
      />
    </div>
  )
} 