import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CalendarNodeView } from '@/components/calendar-node'

export interface CalendarOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    calendar: {
      /**
       * 插入日历节点
       */
      insertCalendar: (attributes?: { title?: string; selectedDate?: string }) => ReturnType
    }
  }
}

export const CalendarExtension = Node.create<CalendarOptions>({
  name: 'calendar',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      title: {
        default: '',
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => {
          if (!attributes.title) {
            return {}
          }
          return {
            'data-title': attributes.title,
          }
        },
      },
      selectedDate: {
        default: null,
        parseHTML: element => element.getAttribute('data-selected-date'),
        renderHTML: attributes => {
          if (!attributes.selectedDate) {
            return {}
          }
          return {
            'data-selected-date': attributes.selectedDate,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="calendar"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'calendar',
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ]
  },

  addCommands() {
    return {
      insertCalendar:
        (attributes = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalendarNodeView)
  },
}) 