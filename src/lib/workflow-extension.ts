import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { WorkflowNodeView } from "@/components/workflow-node"

export interface WorkflowOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    workflow: {
      /**
       * 插入工作流节点
       */
      insertWorkflow: (attributes?: {
        title?: string
        workflowId?: string
        steps?: string[]
        invocationId?: string
        executionState?: any
      }) => ReturnType
    }
  }
}

export const WorkflowExtension = Node.create<WorkflowOptions>({
  name: "workflow",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      title: {
        default: "工作流",
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {}
          }
          return {
            "data-title": attributes.title,
          }
        },
      },
      workflowId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-workflow-id"),
        renderHTML: (attributes) => {
          if (!attributes.workflowId) {
            return {}
          }
          return {
            "data-workflow-id": attributes.workflowId,
          }
        },
      },
      steps: {
        default: [],
        parseHTML: (element) => {
          const stepsData = element.getAttribute("data-steps")
          return stepsData ? JSON.parse(stepsData) : []
        },
        renderHTML: (attributes) => {
          if (!attributes.steps || attributes.steps.length === 0) {
            return {}
          }
          return {
            "data-steps": JSON.stringify(attributes.steps),
          }
        },
      },
      invocationId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-invocation-id"),
        renderHTML: (attributes) => {
          if (!attributes.invocationId) {
            return {}
          }
          return {
            "data-invocation-id": attributes.invocationId,
          }
        },
      },
      executionState: {
        default: null,
        parseHTML: (element) => {
          const stateData = element.getAttribute("data-execution-state")
          return stateData ? JSON.parse(stateData) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.executionState) {
            return {}
          }
          return {
            "data-execution-state": JSON.stringify(attributes.executionState),
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="workflow"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        {
          "data-type": "workflow",
        },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
    ]
  },

  addCommands() {
    return {
      insertWorkflow:
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
    return ReactNodeViewRenderer(WorkflowNodeView)
  },
})
