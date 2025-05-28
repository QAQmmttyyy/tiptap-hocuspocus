"use client"

import React, { useState, useEffect } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'

interface CalendarNodeProps {
  node: {
    attrs: {
      selectedDate?: string
      title?: string
    }
  }
  updateAttributes: (attrs: { selectedDate?: string; title?: string }) => void
  deleteNode: () => void
  selected: boolean
}

export const CalendarNodeView: React.FC<CalendarNodeProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected
}) => {
  const [date, setDate] = useState<Date | undefined>(
    node.attrs.selectedDate ? new Date(node.attrs.selectedDate) : undefined
  )
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    updateAttributes({
      selectedDate: selectedDate ? selectedDate.toISOString() : undefined
    })
    setIsCalendarOpen(false)
  }

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateAttributes({
      title: event.target.value
    })
  }

  // 同步node.attrs中的日期到本地状态
  useEffect(() => {
    if (node.attrs.selectedDate) {
      const nodeDate = new Date(node.attrs.selectedDate)
      if (!date || date.getTime() !== nodeDate.getTime()) {
        setDate(nodeDate)
      }
    } else if (date) {
      setDate(undefined)
    }
  }, [node.attrs.selectedDate, date])

  return (
    <NodeViewWrapper 
      className={`
        my-4 mx-auto max-w-md
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}
      `}
    >
      <Card className="
        w-full border-2 border-dashed border-gray-300 
        hover:border-gray-400 transition-all duration-300 ease-out
        hover:shadow-lg hover:shadow-gray-200/50
      ">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium flex-1">
            <input
              type="text"
              placeholder="日历标题..."
              value={node.attrs.title || ''}
              onChange={handleTitleChange}
              className="
                w-full bg-transparent border-none outline-none 
                placeholder:text-gray-500 text-sm font-medium
                focus:bg-blue-50/80 focus:rounded-md focus:px-2 focus:py-1
                focus:-mx-2 focus:-my-1 transition-all duration-200 ease-out
                hover:bg-gray-50/50 rounded-sm
              "
            />
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteNode}
            className="
              h-6 w-6 p-0 ml-2 
              hover:bg-red-100 hover:text-red-600
              transition-all duration-200 ease-out
              hover:scale-110 transform-gpu
              active:scale-95
            "
          >
            <X className="h-3 w-3" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-gray-500 transition-colors duration-200" />
              <span className="text-sm text-gray-600 transition-colors duration-200">
                {date ? format(date, 'yyyy年MM月dd日') : '选择日期'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="
                text-xs px-3 py-1 h-7
                hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700
                transition-all duration-200 ease-out
                hover:scale-105 transform-gpu
                active:scale-95
              "
            >
              {isCalendarOpen ? '关闭' : '选择日期'}
            </Button>
          </div>
          
          {isCalendarOpen && (
            <div className="
              border border-gray-200 rounded-lg p-3 
              bg-gradient-to-br from-gray-50/80 to-white
              animate-in slide-in-from-top-3 fade-in duration-300 ease-out
              shadow-sm
            ">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                className="rounded-md mx-auto"
              />
            </div>
          )}
          
          {date && (
            <div className="
              text-xs text-gray-500 bg-gradient-to-r from-gray-50 to-blue-50/30 
              p-3 rounded-lg border border-gray-100 space-y-1
              animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out
              shadow-sm
            ">
              <p className="font-medium text-gray-700 transition-colors duration-200">
                选中日期: {format(date, 'yyyy-MM-dd EEEE')}
              </p>
              <p className="text-gray-500 transition-colors duration-200">
                时间戳: {date.getTime()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </NodeViewWrapper>
  )
} 