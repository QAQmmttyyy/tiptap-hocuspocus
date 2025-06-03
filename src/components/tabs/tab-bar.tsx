'use client'

import { useEffect, useRef } from 'react'
import { useTabStore } from '@/lib/stores/tab-store'
import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import TabItem from './tab-item'
import TabOverflow from './tab-overflow'

interface TabBarProps {
  className?: string
}

export default function TabBar({ className }: TabBarProps) {
  const { 
    tabs, 
    activeTabId, 
    closeTab, 
    switchTab,
    moveTab
  } = useTabStore()
  
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // 滚动到活跃标签页
  useEffect(() => {
    if (activeTabId && scrollRef.current) {
      const activeElement = scrollRef.current.querySelector(`[data-tab-id="${activeTabId}"]`)
      if (activeElement) {
        activeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'center'
        })
      }
    }
  }, [activeTabId])
  
  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeTab(tabId)
  }
  
  return (
    <div className={cn(
      "flex items-center h-12 bg-background min-w-0",
      className
    )}>
      {/* 标签页滚动容器 */}
      <ScrollArea className="flex-1 h-12 min-w-0">
        <div 
          ref={scrollRef}
          className="flex items-center h-12 w-fit"
        >
          {tabs.map((tab, index) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onClose={(e) => handleTabClose(e, tab.id)}
              onClick={() => switchTab(tab.id)}
              onMove={(fromIndex, toIndex) => moveTab(fromIndex, toIndex)}
              index={index}
            />
          ))}
        </div>
        <ScrollBar 
          orientation="horizontal" 
          className="h-1 border-t-0 bg-transparent p-0 [&>div]:bg-border/60 [&>div]:rounded-sm"
        />
      </ScrollArea>
      
      {/* 快速导航菜单 - 始终显示 */}
      {tabs.length > 0 && (
        <div className="px-2 border-l border-border shrink-0">
          <TabOverflow 
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={switchTab}
          />
        </div>
      )}
    </div>
  )
} 