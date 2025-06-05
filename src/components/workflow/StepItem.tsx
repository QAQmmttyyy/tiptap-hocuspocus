import React from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, ChevronDown, ChevronRight } from "lucide-react"
import { GeneralLogEntryDetail, WorkflowExecutionState } from "./types"
import { StepLogViewer } from "./StepLogViewer"

interface StepItemProps {
  step: string
  stepIndex: number
  invocation?: WorkflowExecutionState
  isExpanded: boolean
  stepLogs: GeneralLogEntryDetail[]
  getStepStatus: (
    stepIndex: number,
    invocation?: WorkflowExecutionState,
  ) => {
    isCurrentStep: boolean
    isCompleted: boolean
    isAllCompleted: boolean
  }
  onToggleExpansion: (stepIndex: number) => void
}

export const StepItem: React.FC<StepItemProps> = ({
  step,
  stepIndex,
  invocation,
  isExpanded,
  stepLogs,
  getStepStatus,
  onToggleExpansion,
}) => {
  const { isCurrentStep, isCompleted, isAllCompleted } = getStepStatus(stepIndex, invocation)
  const hasLogs = stepLogs.length > 0

  return (
    <div className="space-y-2">
      <div
        className={`
        transition-all duration-300 rounded-lg
        ${isCurrentStep ? "flowing-border" : ""}
        ${isCompleted || isAllCompleted ? "bg-green-50 border border-green-200 shadow-sm" : ""}
        ${!invocation ? "bg-gray-50 border border-gray-100" : ""}
        ${
          !isCurrentStep && !isCompleted && !isAllCompleted && invocation
            ? "bg-white border border-gray-200"
            : ""
        }
      `}
      >
        <div className={`${isCurrentStep ? "flowing-border-inner" : ""}`}>
          <div className="flex items-center gap-3 p-3">
            <div
              className={`
              flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300
              ${
                isCurrentStep
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg animate-pulse"
                  : ""
              }
              ${isCompleted || isAllCompleted ? "bg-green-500 text-white shadow-md" : ""}
              ${
                !invocation || (!isCurrentStep && !isCompleted && !isAllCompleted)
                  ? "bg-gray-300 text-gray-600"
                  : ""
              }
            `}
            >
              {isCompleted || isAllCompleted ? <CheckCircle className="h-4 w-4" /> : stepIndex + 1}
            </div>
            <span
              className={`
              flex-1 text-sm transition-all duration-300
              ${isCurrentStep ? "text-blue-800 font-semibold" : ""}
              ${isCompleted || isAllCompleted ? "text-green-800 font-medium" : ""}
              ${
                !invocation || (!isCurrentStep && !isCompleted && !isAllCompleted)
                  ? "text-gray-600"
                  : ""
              }
            `}
            >
              {step}
            </span>

            <div className="flex items-center gap-2">
              {isCurrentStep && (
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 text-blue-500 animate-spin mr-1" />
                  <span className="text-xs text-blue-600 font-medium animate-pulse">执行中</span>
                </div>
              )}
              {(isCompleted || isAllCompleted) && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {hasLogs && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {stepLogs.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpansion(stepIndex)}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                    title={isExpanded ? "收起日志" : `展开日志 (${stepLogs.length}条)`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 步骤日志 */}
          {hasLogs && isExpanded && <StepLogViewer logs={stepLogs} />}
        </div>
      </div>
    </div>
  )
}
