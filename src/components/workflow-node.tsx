"use client"

import React, { useState, useEffect } from "react"
import { NodeViewWrapper } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, RefreshCw, X, CheckCircle, AlertCircle, Clock } from "lucide-react"

interface WorkflowExecutionState {
  workflow_invocation_id: string
  current_step: string
  status: "pending" | "started" | "completed" | "failed"
  execution_log: Record<
    string,
    Array<{
      tool_name: string
      input: string
      output: string
    }>
  >
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
  const [isExecuting, setIsExecuting] = useState(false)

  // 从节点属性中获取执行状态，而不是本地状态
  const invocation = node.attrs.executionState
  const currentInvocationId = node.attrs.invocationId

  // 从API获取工作流基础信息
  useEffect(() => {
    if (!node.attrs.workflowId && (!node.attrs.steps || node.attrs.steps.length === 0)) {
      fetchWorkflowData()
    }
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

  const fetchWorkflowData = async () => {
    try {
      const response = await fetch("/api/v1/workflow")
      const data = await response.json()

      if (data.code === 200 && data.data.workflows.length > 0) {
        const workflow = data.data.workflows[0]
        updateAttributes({
          workflowId: workflow.id,
          steps: workflow.steps,
          title: node.attrs.title || "工作流执行",
          invocationId: node.attrs.invocationId,
          executionState: node.attrs.executionState,
        })
      }
    } catch (error) {
      console.error("获取工作流数据失败:", error)
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

    setIsExecuting(true)

    try {
      // 创建新的工作流调用
      const response = await fetch(`/api/v1/workflow/${node.attrs.workflowId}/invocation`, {
        method: "POST",
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
      setIsExecuting(false)
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
          setIsExecuting(false)
        }
      }
    } catch (error) {
      console.error("获取执行状态失败:", error)
      setIsExecuting(false)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "started":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
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
  }

  const getStatusColor = (status: string) => {
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
  }

  const steps = node.attrs.steps || []

  return (
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
                {getStatusIcon(invocation.status)}
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
            {/* 步骤列表 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">执行步骤：</h4>
              {steps.map((step, index) => {
                const isCurrentStep = invocation && parseInt(invocation.current_step) === index
                const isCompleted = invocation && parseInt(invocation.current_step) > index
                const isAllCompleted = invocation?.status === "completed"

                return (
                  <div
                    key={index}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg transition-all duration-300
                      ${isCurrentStep ? "bg-blue-50 border border-blue-200 shadow-sm" : ""}
                      ${
                        isCompleted || isAllCompleted
                          ? "bg-green-50 border border-green-200 shadow-sm"
                          : ""
                      }
                      ${!invocation ? "bg-gray-50 border border-gray-100" : ""}
                    `}
                  >
                    <div
                      className={`
                      flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300
                      ${isCurrentStep ? "bg-blue-500 text-white shadow-md" : ""}
                      ${isCompleted || isAllCompleted ? "bg-green-500 text-white shadow-md" : ""}
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
                      ${isCurrentStep ? "text-blue-800 font-medium" : ""}
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
                    {isCurrentStep && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                    {(isCompleted || isAllCompleted) && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* 执行完成提示 */}
            {invocation?.status === "completed" && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-sm">工作流执行成功完成！</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  所有步骤已顺利完成，大象已安全存储在冰箱中。
                </p>
              </div>
            )}

            {/* 执行日志 */}
            {invocation &&
              invocation.execution_log &&
              Object.keys(invocation.execution_log).length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">执行日志：</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(invocation.execution_log).map(([stepKey, logs]) =>
                      logs.map((log, logIndex) => (
                        <div
                          key={`${stepKey}-${logIndex}`}
                          className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs"
                        >
                          <div className="font-medium text-gray-800 mb-1">
                            {stepKey} - {log.tool_name}
                          </div>
                          {log.input && (
                            <div className="text-gray-600 mb-1">
                              <span className="font-medium text-blue-600">输入:</span> {log.input}
                            </div>
                          )}
                          {log.output && (
                            <div className="text-gray-600">
                              <span className="font-medium text-green-600">输出:</span> {log.output}
                            </div>
                          )}
                        </div>
                      )),
                    )}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </NodeViewWrapper>
  )
}

export { WorkflowNodeView }
