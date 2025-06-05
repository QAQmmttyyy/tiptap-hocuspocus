"use client"

import React, { useEffect } from "react"
import { NodeViewWrapper } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Play,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  List,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useWorkflowNode } from "@/hooks/useWorkflowNode"

interface WorkflowExecutionState {
  workflow_invocation_id: string
  current_step: string
  status: "pending" | "started" | "completed" | "failed"
  execution_log: Record<string, Array<any>>
}

interface WorkflowNodeProps {
  node: {
    attrs: {
      title?: string
      workflowId?: string
      steps?: string[]
      invocationId?: string
      executionState?: WorkflowExecutionState
    }
  }
  updateAttributes: (attrs: {
    title?: string
    workflowId?: string
    steps?: string[]
    invocationId?: string | null
    executionState?: WorkflowExecutionState | null
  }) => void
  deleteNode: () => void
  selected: boolean
}

const WorkflowNodeView: React.FC<WorkflowNodeProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const {
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
    clearExpandedSteps,
    startExecution,
    stopExecution,
    startLoadingWorkflows,
    stopLoadingWorkflows,
    updateWorkflows,
  } = useWorkflowNode()

  // 从节点属性中获取执行状态，而不是本地状态
  const invocation = node.attrs.executionState
  const currentInvocationId = node.attrs.invocationId

  // 初始化时获取工作流列表
  useEffect(() => {
    fetchWorkflowList()
  }, [])

  // 轮询检查执行状态
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (
      currentInvocationId &&
      (invocation?.status === "pending" || invocation?.status === "started")
    ) {
      interval = setInterval(() => {
        fetchInvocationStatus(currentInvocationId)
      }, 2000) // 每2秒检查一次状态
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [currentInvocationId, invocation?.status])

  // 自动展开当前步骤（如果有日志）
  useEffect(() => {
    autoExpandCurrentStep(invocation)
  }, [invocation?.current_step, invocation?.status, autoExpandCurrentStep])

  const fetchWorkflowList = async () => {
    startLoadingWorkflows()
    try {
      const response = await fetch("/api/v1/workflow")
      const data = await response.json()

      if (data.code === 200) {
        updateWorkflows(data.data.workflows)
      }
    } catch (error) {
      console.error("获取工作流列表失败:", error)
    } finally {
      stopLoadingWorkflows()
    }
  }

  const handleWorkflowSelect = (workflowId: string) => {
    const selectedWorkflow = workflows.find((w) => w.id === workflowId)
    if (selectedWorkflow) {
      updateAttributes({
        title: node.attrs.title || `工作流: ${selectedWorkflow.name || selectedWorkflow.id}`,
        workflowId: selectedWorkflow.id,
        steps: selectedWorkflow.steps,
        invocationId: null, // 重置调用ID
        executionState: null, // 重置执行状态
      })
    }
  }

  const handleExecuteWorkflow = async () => {
    if (!node.attrs.workflowId) return

    // 如果已经完成，重置状态以便重新执行
    if (invocation?.status === "completed") {
      updateAttributes({
        title: node.attrs.title,
        workflowId: node.attrs.workflowId,
        steps: node.attrs.steps,
        invocationId: null,
        executionState: null,
      })
    }

    // 清除之前展开的步骤状态
    clearExpandedSteps()
    startExecution()

    try {
      // 创建新的工作流调用
      const response = await fetch(`/api/v1/workflow/${node.attrs.workflowId}/invocation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          initial_shared_context: null,
        }),
      })
      const data = await response.json()

      if (data.code === 200) {
        const invocationId = data.data.workflow_invocation_id
        // 更新节点属性而不是本地状态
        updateAttributes({
          title: node.attrs.title,
          workflowId: node.attrs.workflowId,
          steps: node.attrs.steps,
          invocationId: invocationId,
          executionState: node.attrs.executionState,
        })
        await fetchInvocationStatus(invocationId)
      }
    } catch (error) {
      console.error("执行工作流失败:", error)
      stopExecution()
    }
  }

  const fetchInvocationStatus = async (invocationId: string) => {
    if (!node.attrs.workflowId) return

    try {
      const response = await fetch(
        `/api/v1/workflow/${node.attrs.workflowId}/invocation/${invocationId}`,
      )
      const data = await response.json()

      if (data.code === 200) {
        // 更新节点属性而不是本地状态
        updateAttributes({
          title: node.attrs.title,
          workflowId: node.attrs.workflowId,
          steps: node.attrs.steps,
          invocationId: invocationId,
          executionState: data.data,
        })

        // 如果执行完成或失败，停止执行状态
        if (data.data.status === "completed" || data.data.status === "failed") {
          stopExecution()
        }
      }
    } catch (error) {
      console.error("获取执行状态失败:", error)
      stopExecution()
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAttributes({
      title: e.target.value,
      workflowId: node.attrs.workflowId,
      steps: node.attrs.steps,
      invocationId: node.attrs.invocationId,
      executionState: node.attrs.executionState,
    })
  }

  // 渲染状态图标
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

  const steps = node.attrs.steps || []

  return (
    <>
      <style jsx>{`
        @keyframes flowing-gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .flowing-border {
          position: relative;
          background: linear-gradient(-45deg, #3b82f6, #06b6d4, #8b5cf6, #ec4899, #3b82f6, #06b6d4);
          background-size: 400% 400%;
          animation: flowing-gradient 3s ease infinite;
          border-radius: 12px;
          padding: 2px;
        }

        .flowing-border-inner {
          background: #dbeafe;
          border-radius: 10px;
          position: relative;
          z-index: 1;
        }

        .flowing-border::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(-45deg, #3b82f6, #06b6d4, #8b5cf6, #ec4899, #3b82f6, #06b6d4);
          background-size: 400% 400%;
          animation: flowing-gradient 3s ease infinite;
          border-radius: 12px;
          opacity: 0.8;
          filter: blur(2px);
          z-index: -1;
        }
      `}</style>

      <NodeViewWrapper
        className={`
          my-4 mx-auto max-w-2xl
          ${selected ? "ring-2 ring-blue-500 ring-offset-2 rounded-lg" : ""}
        `}
      >
        <Card
          className={`
          w-full border-2 border-dashed transition-all duration-300 ease-out hover:shadow-lg
          ${
            invocation?.status === "completed"
              ? "border-green-300 hover:border-green-400 hover:shadow-green-200/50 bg-green-50/30"
              : invocation?.status === "failed"
              ? "border-red-300 hover:border-red-400 hover:shadow-red-200/50 bg-red-50/30"
              : invocation?.status === "started"
              ? "border-blue-300 hover:border-blue-400 hover:shadow-blue-200/50 bg-blue-50/30"
              : "border-blue-300 hover:border-blue-400 hover:shadow-blue-200/50"
          }
        `}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium flex-1">
              <input
                type="text"
                placeholder="工作流标题..."
                value={node.attrs.title || ""}
                onChange={handleTitleChange}
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
                onClick={handleExecuteWorkflow}
                disabled={isExecuting || !node.attrs.workflowId}
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
                onClick={deleteNode}
                className="h-6 w-6 p-0 ml-1 hover:bg-red-100 hover:text-red-600 transition-all duration-200 ease-out hover:scale-110 transform-gpu active:scale-95"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* 工作流选择器 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <List className="h-4 w-4 text-gray-600" />
                  <h4 className="text-sm font-medium text-gray-700">选择工作流：</h4>
                  {isLoadingWorkflows && (
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                </div>
                <select
                  value={node.attrs.workflowId || ""}
                  onChange={(e) => handleWorkflowSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  disabled={isLoadingWorkflows || isExecuting}
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

              {/* 步骤列表 - 只有选择了工作流才显示 */}
              {node.attrs.workflowId && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">执行步骤：</h4>
                  {steps.map((step, index) => {
                    const { isCurrentStep, isCompleted, isAllCompleted } = getStepStatus(
                      index,
                      invocation,
                    )
                    const stepLogs = getStepLogs(index, invocation)
                    const hasLogs = stepLogs.length > 0
                    const isExpanded = expandedSteps.has(index)

                    return (
                      <div key={index} className="space-y-2">
                        <div
                          className={`
                          transition-all duration-300 rounded-lg
                          ${isCurrentStep ? "flowing-border" : ""}
                          ${
                            isCompleted || isAllCompleted
                              ? "bg-green-50 border border-green-200 shadow-sm"
                              : ""
                          }
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
                                ${
                                  isCompleted || isAllCompleted
                                    ? "bg-green-500 text-white shadow-md"
                                    : ""
                                }
                                ${
                                  !invocation || (!isCurrentStep && !isCompleted && !isAllCompleted)
                                    ? "bg-gray-300 text-gray-600"
                                    : ""
                                }
                              `}
                              >
                                {isCompleted || isAllCompleted ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  index + 1
                                )}
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
                                    <span className="text-xs text-blue-600 font-medium animate-pulse">
                                      执行中
                                    </span>
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
                                      onClick={() => toggleStepExpansion(index)}
                                      className="h-6 w-6 p-0 hover:bg-gray-100"
                                      title={
                                        isExpanded ? "收起日志" : `展开日志 (${stepLogs.length}条)`
                                      }
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
                            {hasLogs && isExpanded && (
                              <div className="px-3 pb-3">
                                <div className="border-t border-gray-200 pt-3">
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {stepLogs.map((log, logIndex) => (
                                      <div
                                        key={logIndex}
                                        className="bg-white border border-gray-200 p-3 rounded-md text-xs"
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-gray-800">
                                            {log.type}
                                          </span>
                                          <span className="text-gray-500 text-xs">
                                            {new Date(log.timestamp).toLocaleString()}
                                          </span>
                                        </div>
                                        {log.summary && (
                                          <div className="text-gray-600 mb-2 font-medium text-xs">
                                            {log.summary}
                                          </div>
                                        )}
                                        {log.details && Object.keys(log.details).length > 0 && (
                                          <div className="text-gray-600">
                                            <div className="font-medium text-blue-600 mb-1 text-xs">
                                              详细信息:
                                            </div>
                                            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                                              {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 执行完成提示 */}
              {invocation?.status === "completed" && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-sm">工作流执行成功完成！</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </NodeViewWrapper>
    </>
  )
}

export { WorkflowNodeView }
