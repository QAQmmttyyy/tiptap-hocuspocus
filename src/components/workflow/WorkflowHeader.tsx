import React from "react"
import { Button } from "@/components/ui/button"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Play, RefreshCw, X, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { WorkflowExecutionState } from "./types"

interface WorkflowHeaderProps {
  title?: string
  invocation?: WorkflowExecutionState
  isExecuting: boolean
  workflowId?: string
  onTitleChange: (title: string) => void
  onExecute: () => void
  onDelete: () => void
  getStatusIcon: (status: string) => string | null
  getStatusText: (status: string) => string
  getStatusColor: (status: string) => string
}

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({
  title,
  invocation,
  isExecuting,
  workflowId,
  onTitleChange,
  onExecute,
  onDelete,
  getStatusIcon,
  getStatusText,
  getStatusColor,
}) => {
  const renderStatusIcon = (status: string) => {
    const iconType = getStatusIcon(status)
    switch (iconType) {
      case "CheckCircle":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "AlertCircle":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "RefreshCw":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "Clock":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium flex-1">
        <input
          type="text"
          placeholder="工作流标题..."
          value={title || ""}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full bg-transparent border-none outline-none placeholder:text-gray-500 text-sm font-medium focus:bg-blue-50/80 focus:rounded-md focus:px-2 focus:py-1 focus:-mx-2 focus:-my-1 transition-all duration-200 ease-out hover:bg-gray-50/50 rounded-sm"
        />
      </CardTitle>

      <div className="flex items-center gap-2">
        {invocation && (
          <div
            className={`
            flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all duration-200
            ${getStatusColor(invocation.status)}
          `}
          >
            {renderStatusIcon(invocation.status)}
            <span className="font-medium">{getStatusText(invocation.status)}</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onExecute}
          disabled={isExecuting || !workflowId}
          className={`
            h-6 w-6 p-0 transition-all duration-200 ease-out
            ${
              invocation?.status === "completed"
                ? "hover:bg-green-100 hover:text-green-600"
                : "hover:bg-green-100 hover:text-green-600"
            }
          `}
          title={invocation?.status === "completed" ? "重新执行工作流" : "执行工作流"}
        >
          {isExecuting ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : invocation?.status === "completed" ? (
            <RefreshCw className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-6 w-6 p-0 ml-1 hover:bg-red-100 hover:text-red-600 transition-all duration-200 ease-out hover:scale-110 transform-gpu active:scale-95"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </CardHeader>
  )
}
