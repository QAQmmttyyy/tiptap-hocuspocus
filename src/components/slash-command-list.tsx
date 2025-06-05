"use client"

import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { SlashCommand } from "@/lib/slash-command"

export interface SlashCommandListRef {
  onKeyDown: (event: KeyboardEvent) => boolean
}

interface SlashCommandListProps {
  items: SlashCommand[]
  command: (command: SlashCommand) => void
}

const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        command(item)
      }
    }

    const upHandler = () => {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length)
    }

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length)
    }

    const enterHandler = () => {
      selectItem(selectedIndex)
    }

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "ArrowUp") {
          upHandler()
          return true
        }

        if (event.key === "ArrowDown") {
          downHandler()
          return true
        }

        if (event.key === "Enter") {
          enterHandler()
          return true
        }

        return false
      },
    }))

    return (
      <div className="relative">
        <div className="absolute z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="px-2 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
            选择一个命令
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length ? (
              items.map((item, index) => (
                <button
                  key={index}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? "bg-blue-50 border-r-2 border-blue-500" : ""
                  }`}
                  onClick={() => selectItem(index)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500 truncate">{item.description}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-gray-500 text-sm">没有找到匹配的命令</div>
            )}
          </div>
        </div>
      </div>
    )
  },
)

SlashCommandList.displayName = "SlashCommandList"

export default SlashCommandList
