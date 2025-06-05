import type { Editor } from "@tiptap/react"

export interface GeneralLogEntryDetail {
  type: string
  timestamp: string
  details: Record<string, any>
  summary?: string
}

export interface WorkflowItem {
  id: string
  name?: string
  description?: string
  steps: string[]
}

export interface WorkflowExecutionState {
  workflow_invocation_id: string
  current_step: string
  status: "pending" | "started" | "completed" | "failed"
  execution_log: Record<string, Array<GeneralLogEntryDetail>>
  final_summary?: string
}

export interface WorkflowNodeAttrs {
  title?: string
  workflowId?: string
  steps?: string[]
  invocationId?: string
  executionState?: WorkflowExecutionState
  finalSummary?: string
}

export interface WorkflowNodeProps {
  node: {
    attrs: WorkflowNodeAttrs
  }
  updateAttributes: (attrs: {
    title?: string
    workflowId?: string
    steps?: string[]
    invocationId?: string | null
    executionState?: WorkflowExecutionState | null
    finalSummary?: string | null
  }) => void
  deleteNode: () => void
  selected: boolean
  editor: Editor
}
