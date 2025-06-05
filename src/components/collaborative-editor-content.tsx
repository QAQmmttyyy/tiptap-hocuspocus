"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Button } from "@/components/ui/button";
import { CalendarExtension } from "@/lib/calendar-extension";
import { CalendarIcon } from "lucide-react";
import * as Y from "yjs";

interface CollaborativeEditorContentProps {
  provider: HocuspocusProvider;
  userName: string;
}

export default function CollaborativeEditorContent({
  provider,
  userName,
}: CollaborativeEditorContentProps) {
	/**
	 * if you want to load initial content to the editor, the safest way to do so is by applying an initial Yjs update.
	 * Yjs updates can safely be applied multiple times, while using `setContent` or similar Tiptap commands may result in
	 * duplicate content in the Tiptap editor.
	 *
	 * The easiest way to generate the Yjs update (`initialContent` above) is to do something like
	 *
	 * ```
	 * console.log(Y.encodeStateAsUpdate(props.provider.document).toString())
	 * ```
	 *
	 * after you have filled the editor with the desired content.
	 */
  Y.applyUpdate(provider.document, Y.encodeStateAsUpdate(provider.document));

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: false, // 禁用本地历史，使用协作历史
          heading: false, // 禁用 StarterKit 的 heading，使用自定义配置
          paragraph: {
            HTMLAttributes: {
              class: "my-2 leading-6 text-gray-800 first:mt-0",
            },
          },
          bulletList: {
            HTMLAttributes: {
              class: "my-4 pl-6",
            },
          },
          orderedList: {
            HTMLAttributes: {
              class: "my-4 pl-6",
            },
          },
          listItem: {
            HTMLAttributes: {
              class: "my-1 leading-7",
            },
          },
          bold: {
            HTMLAttributes: {
              class: "font-semibold text-gray-900",
            },
          },
          italic: {
            HTMLAttributes: {
              class: "italic text-gray-900",
            },
          },
          strike: {
            HTMLAttributes: {
              class: "line-through text-gray-600",
            },
          },
          code: {
            HTMLAttributes: {
              class:
                "bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono",
            },
          },
          codeBlock: {
            HTMLAttributes: {
              class:
                "bg-gray-50 border border-gray-200 p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm text-gray-800",
            },
          },
          blockquote: {
            HTMLAttributes: {
              class:
                "border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600",
            },
          },
        }),
        Heading.configure({
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: "heading",
          },
        }),
        CalendarExtension,
        Collaboration.configure({
          document: provider.document,
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: userName,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          },
        }),
      ],
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px]",
        },
      },
      immediatelyRender: false,
    },
    [provider, userName]
  );

  if (!editor) {
    return (
      <div className="min-h-[500px] flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-lg mb-2">编辑器加载中...</div>
          <div className="text-sm">请稍候片刻</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="relative">
        {/* Bubble Menu - 选中文本时显示 */}
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          shouldShow={({ state, from, to }) => {
            // 如果选中的是calendar节点，不显示bubble menu
            const { selection } = state;
            const { $from } = selection;

            // 检查当前选中的节点是否是calendar节点
            if ($from.parent.type.name === "calendar") {
              return false;
            }

            // 检查选中范围内是否包含calendar节点
            let hasCalendarNode = false;
            state.doc.nodesBetween(from, to, (node) => {
              if (node.type.name === "calendar") {
                hasCalendarNode = true;
                return false;
              }
            });

            if (hasCalendarNode) {
              return false;
            }

            // 默认的显示逻辑：有选中文本时显示
            return from !== to;
          }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex flex-wrap gap-1 z-50 w-fit  items-center"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 px-2 text-xs transition-colors ${
              editor.isActive("bold")
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="font-bold">B</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 px-2 text-xs transition-colors ${
              editor.isActive("italic")
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="italic">I</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`h-8 px-2 text-xs transition-colors ${
              editor.isActive("strike")
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="line-through">S</span>
          </Button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`h-8 px-2 text-xs transition-colors ${
              editor.isActive("heading", { level: 1 })
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            H1
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`h-8 px-2 text-xs transition-colors ${
              editor.isActive("heading", { level: 2 })
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            H2
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`h-8 px-2 text-xs transition-colors ${
              editor.isActive("heading", { level: 3 })
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            H3
          </Button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`h-8 px-2 text-xs transition-colors ${
              editor.isActive("code")
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="font-mono">&lt;/&gt;</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`h-8 px-2 text-xs transition-colors ${
              editor.isActive("codeBlock")
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            代码块
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`h-8 px-2 text-xs transition-colors ${
              editor.isActive("blockquote")
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            引用
          </Button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 px-2 text-xs transition-colors ${
              editor.isActive("bulletList")
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            • 列表
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 px-2 text-xs transition-colors ${
              editor.isActive("orderedList")
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            1. 列表
          </Button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().insertCalendar().run()}
            className="h-8 px-2 text-xs transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            title="插入日历"
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            日历
          </Button>
        </BubbleMenu>

        <EditorContent editor={editor} className="focus-within:outline-none" />
      </div>
    </div>
  );
}
