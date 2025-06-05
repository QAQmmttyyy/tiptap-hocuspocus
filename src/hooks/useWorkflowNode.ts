import { useState, useCallback } from "react"

interface GeneralLogEntryDetail {
  type: string
  timestamp: string
  details: Record<string, any>
  summary?: string
}

interface WorkflowItem {
  id: string
  name?: string
  description?: string
  steps: string[]
}

interface WorkflowExecutionState {
  workflow_invocation_id: string
  current_step: string
  status: "pending" | "started" | "completed" | "failed"
  execution_log: Record<string, Array<GeneralLogEntryDetail>>
}

export const useWorkflowNode = () => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  // 获取步骤对应的日志
  const getStepLogs = useCallback(
    (stepIndex: number, invocation?: WorkflowExecutionState): GeneralLogEntryDetail[] => {
      if (!invocation?.execution_log) return []

      // 尝试多种可能的key格式
      const possibleKeys = [
        `step_${stepIndex}`,
        `Step ${stepIndex}`,
        `Step ${stepIndex + 1}`,
        `step${stepIndex}`,
        `step${stepIndex + 1}`,
        stepIndex.toString(),
        (stepIndex + 1).toString(),
      ]

      for (const key of possibleKeys) {
        if (invocation.execution_log[key]) {
          return invocation.execution_log[key]
        }
      }

      return []
    },
    [],
  )

  // 获取状态图标
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return "CheckCircle"
      case "failed":
        return "AlertCircle"
      case "started":
        return "RefreshCw"
      case "pending":
        return "Clock"
      default:
        return null
    }
  }, [])

  // 获取状态文本
  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return "执行完成"
      case "failed":
        return "执行失败"
      case "started":
        return "执行中"
      case "pending":
        return "等待执行"
      default:
        return "未知状态"
    }
  }, [])

  // 获取状态颜色
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200"
      case "failed":
        return "text-red-600 bg-red-50 border-red-200"
      case "started":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }, [])

  // 判断步骤状态
  const getStepStatus = useCallback((stepIndex: number, invocation?: WorkflowExecutionState) => {
    if (!invocation) {
      return {
        isCurrentStep: false,
        isCompleted: false,
        isAllCompleted: false,
      }
    }

    const currentStepIndex = parseInt(invocation.current_step)
    const isAllCompleted = invocation.status === "completed"

    // 如果工作流完成，所有步骤都是完成状态
    if (isAllCompleted) {
      return {
        isCurrentStep: false,
        isCompleted: true,
        isAllCompleted: true,
      }
    }

    // 工作流执行中的状态判断
    const isCurrentStep = currentStepIndex === stepIndex && invocation.status === "started"
    const isCompleted = currentStepIndex > stepIndex

    return {
      isCurrentStep,
      isCompleted,
      isAllCompleted,
    }
  }, [])

  // 切换步骤展开状态
  const toggleStepExpansion = useCallback((stepIndex: number) => {
    setExpandedSteps((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(stepIndex)) {
        newExpanded.delete(stepIndex)
      } else {
        newExpanded.add(stepIndex)
      }
      return newExpanded
    })
  }, [])

  // 自动展开当前步骤
  const autoExpandCurrentStep = useCallback(
    (invocation?: WorkflowExecutionState) => {
      if (invocation && invocation.status === "started") {
        const currentStep = parseInt(invocation.current_step)
        const stepLogs = getStepLogs(currentStep, invocation)

        if (stepLogs.length > 0) {
          setExpandedSteps((prev) => new Set([...prev, currentStep]))
        }
      }
    },
    [getStepLogs],
  )

  // 工作流完成后自动展开所有有日志的步骤
  const autoExpandStepsWithLogs = useCallback(
    (invocation?: WorkflowExecutionState) => {
      if (invocation && invocation.status === "completed" && invocation.execution_log) {
        const stepsWithLogs: number[] = []

        // 从 execution_log 的键中提取所有可能的步骤索引
        const logKeys = Object.keys(invocation.execution_log)
        const stepIndexes: number[] = []

        for (const key of logKeys) {
          // 尝试解析不同格式的键名为步骤索引
          let stepIndex: number | null = null

          if (/^\d+$/.test(key)) {
            // 纯数字键 (如 "0", "1", "2")
            stepIndex = parseInt(key)
          } else if (key.startsWith("step_")) {
            // step_ 格式 (如 "step_0", "step_1")
            stepIndex = parseInt(key.replace("step_", ""))
          } else if (key.startsWith("Step ")) {
            // Step 格式 (如 "Step 0", "Step 1")
            const stepNum = parseInt(key.replace("Step ", ""))
            stepIndex = stepNum > 0 ? stepNum - 1 : stepNum // Step 通常从1开始，转换为0开始的索引
          }

          if (
            stepIndex !== null &&
            !isNaN(stepIndex) &&
            stepIndex >= 0 &&
            !stepIndexes.includes(stepIndex)
          ) {
            stepIndexes.push(stepIndex)
          }
        }

        // 对于找到的每个步骤索引，检查是否有日志
        for (const stepIndex of stepIndexes) {
          const stepLogs = getStepLogs(stepIndex, invocation)
          if (stepLogs.length > 0) {
            stepsWithLogs.push(stepIndex)
          }
        }

        if (stepsWithLogs.length > 0) {
          setExpandedSteps((prev) => new Set([...prev, ...stepsWithLogs]))
        }
      }
    },
    [getStepLogs],
  )

  // 清除展开状态
  const clearExpandedSteps = useCallback(() => {
    setExpandedSteps(new Set())
  }, [])

  // 开始执行
  const startExecution = useCallback(() => {
    setIsExecuting(true)
  }, [])

  // 停止执行
  const stopExecution = useCallback(() => {
    setIsExecuting(false)
  }, [])

  // 开始加载工作流
  const startLoadingWorkflows = useCallback(() => {
    setIsLoadingWorkflows(true)
  }, [])

  // 停止加载工作流
  const stopLoadingWorkflows = useCallback(() => {
    setIsLoadingWorkflows(false)
  }, [])

  // 设置工作流列表
  const updateWorkflows = useCallback((newWorkflows: WorkflowItem[]) => {
    setWorkflows(newWorkflows)
  }, [])

  return {
    // 状态
    isExecuting,
    workflows,
    isLoadingWorkflows,
    expandedSteps,

    // 计算函数
    getStepLogs,
    getStatusIcon,
    getStatusText,
    getStatusColor,
    getStepStatus,

    // 操作函数
    toggleStepExpansion,
    autoExpandCurrentStep,
    autoExpandStepsWithLogs,
    clearExpandedSteps,
    startExecution,
    stopExecution,
    startLoadingWorkflows,
    stopLoadingWorkflows,
    updateWorkflows,
  }
}
