'use client'

import { useState, useRef } from 'react'
import { X, Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TabData } from '@/lib/stores/tab-store'

interface TabItemProps {
  tab: TabData
  isActive: boolean
  index: number
  onClick: () => void
  onClose: (e: React.MouseEvent) => void
  onMove: (fromIndex: number, toIndex: number) => void
}

export default function TabItem({ 
  tab, 
  isActive, 
  index,
  onClick, 
  onClose,
  onMove 
}: TabItemProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)
  
  // 拖拽开始
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'
  }
  
  // 拖拽结束
  const handleDragEnd = () => {
    setIsDragging(false)
    setDragOver(false)
  }
  
  // 拖拽进入
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }
  
  // 拖拽离开
  const handleDragLeave = () => {
    setDragOver(false)
  }
  
  // 拖拽放置
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (fromIndex !== index) {
      onMove(fromIndex, index)
    }
  }
  
  return (
    <div
      ref={dragRef}
      data-tab-id={tab.id}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none",
        "min-w-[120px] max-w-[200px] h-12 border-r border-border/50",
        "transition-colors duration-150",
        isActive ? [
          "bg-background text-foreground border-r-border",
          "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
        ] : [
          "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
        ],
        isDragging && "opacity-50",
        dragOver && "bg-accent",
        tab.isPinned && "bg-blue-50 dark:bg-blue-950/20"
      )}
    >
      {/* 固定状态图标 */}
      {tab.isPinned && (
        <Pin className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      )}
      
      {/* 脏状态指示点 */}
      {tab.isDirty && !tab.isPinned && (
        <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
      )}
      
      {/* 标题 */}
      <span className="truncate flex-1 font-medium">
        {tab.title}
      </span>
      
      {/* 关闭按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className={cn(
          "h-5 w-5 p-0 rounded opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-muted-foreground/20"
        )}
        title="关闭标签页"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
} 