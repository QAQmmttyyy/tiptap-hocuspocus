import { Extension } from "@tiptap/core"
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion"
import { Editor, Range } from "@tiptap/core"
import { PluginKey } from "@tiptap/pm/state"

export interface SlashCommand {
  title: string
  description: string
  icon: string
  command: ({ editor, range }: { editor: Editor; range: Range }) => void
}

export const slashCommands: SlashCommand[] = [
  {
    title: "日历",
    description: "插入日历组件",
    icon: "📅",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertCalendar().run()
    },
  },
  {
    title: "工作流",
    description: "插入工作流组件",
    icon: "⚡",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertWorkflow().run()
    },
  },
]

export const createSlashCommandExtension = (suggestionOptions: Partial<SuggestionOptions>) => {
  return Extension.create({
    name: "slashCommand",

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: "/",
          pluginKey: new PluginKey("slashCommand"),
          ...suggestionOptions,
        }),
      ]
    },
  })
}
