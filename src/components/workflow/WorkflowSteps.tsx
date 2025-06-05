import React from "react"
import { WorkflowExecutionState, GeneralLogEntryDetail } from "./types"
import { StepItem } from "./StepItem"

interface WorkflowStepsProps {
  steps: string[]
  invocation?: WorkflowExecutionState
  expandedSteps: Set<number>
  getStepLogs: (stepIndex: number, invocation?: WorkflowExecutionState) => GeneralLogEntryDetail[]
  getStepStatus: (
    stepIndex: number,
    invocation?: WorkflowExecutionState,
  ) => {
    isCurrentStep: boolean
    isCompleted: boolean
    isAllCompleted: boolean
  }
  onToggleStepExpansion: (stepIndex: number) => void
}

export const WorkflowSteps: React.FC<WorkflowStepsProps> = ({
  steps,
  invocation,
  expandedSteps,
  getStepLogs,
  getStepStatus,
  onToggleStepExpansion,
}) => {
  if (steps.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700 mb-2">执行步骤：</h4>
      {steps.map((step, index) => {
        const stepLogs = getStepLogs(index, invocation)
        const isExpanded = expandedSteps.has(index)

        return (
          <StepItem
            key={index}
            step={step}
            stepIndex={index}
            invocation={invocation}
            isExpanded={isExpanded}
            stepLogs={stepLogs}
            getStepStatus={getStepStatus}
            onToggleExpansion={onToggleStepExpansion}
          />
        )
      })}
    </div>
  )
}
