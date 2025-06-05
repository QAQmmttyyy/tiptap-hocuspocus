import React from "react"
import { List, RefreshCw } from "lucide-react"
import { WorkflowItem } from "./types"

interface WorkflowSelectorProps {
  workflows: WorkflowItem[]
  selectedWorkflowId?: string
  isLoading: boolean
  isExecuting: boolean
  onWorkflowSelect: (workflowId: string) => void
}

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  workflows,
  selectedWorkflowId,
  isLoading,
  isExecuting,
  onWorkflowSelect,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <List className="h-4 w-4 text-gray-600" />
        <h4 className="text-sm font-medium text-gray-700">选择工作流：</h4>
        {isLoading && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
      </div>
      <select
        value={selectedWorkflowId || ""}
        onChange={(e) => onWorkflowSelect(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        disabled={isLoading || isExecuting}
      >
        <option value="">请选择一个工作流...</option>
        {workflows.map((workflow) => (
          <option key={workflow.id} value={workflow.id}>
            {workflow.name || workflow.id}
            {workflow.description && ` - ${workflow.description}`}
          </option>
        ))}
      </select>
    </div>
  )
}
