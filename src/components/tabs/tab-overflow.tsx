'use client'

import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { TabData } from '@/lib/stores/tab-store'

interface TabOverflowProps {
  tabs: TabData[]
  activeTabId: string | null
  onTabSelect: (tabId: string) => void
}

export default function TabOverflow({ 
  tabs, 
  activeTabId, 
  onTabSelect 
}: TabOverflowProps) {
  // 显示所有标签页，当标签页多时提供快速导航
  if (tabs.length === 0) {
    return null
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-accent"
          title={`所有标签页 (${tabs.length})`}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64"
        sideOffset={8}
      >
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
          所有标签页 ({tabs.length})
        </div>
        <DropdownMenuSeparator />
        
        <div className="max-h-64 overflow-y-auto">
          {tabs.map((tab) => (
            <DropdownMenuItem
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                tab.id === activeTabId && "bg-accent"
              )}
            >
              {/* 状态指示 */}
              <div className="flex items-center justify-center w-4">
                {tab.isDirty && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
                {tab.isPinned && !tab.isDirty && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
              
              {/* 标题 */}
              <span className="truncate flex-1 text-sm">
                {tab.title}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 