"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useWorkflowNode } from "@/hooks/useWorkflowNode"
import { NodeViewWrapper } from "@tiptap/react"
import React, { useEffect } from "react"
import {
  WorkflowHeader,
  WorkflowNodeProps,
  WorkflowResults,
  WorkflowSelector,
  WorkflowSteps,
} from "./workflow"

const WorkflowNodeView: React.FC<WorkflowNodeProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
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
    autoExpandStepsWithLogs,
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

  const insertContent = (content: string) => {
    editor.commands.insertContent(content)
  }

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

  // 工作流完成后自动展开所有有日志的步骤
  useEffect(() => {
    if (invocation?.status === "completed") {
      autoExpandStepsWithLogs(invocation)
    }
  }, [invocation?.status, autoExpandStepsWithLogs, invocation])

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
        finalSummary: null, // 重置结果总结
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
        finalSummary: null,
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
          finalSummary: node.attrs.finalSummary,
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
          finalSummary: data.data.final_summary || null,
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

  const handleTitleChange = (title: string) => {
    updateAttributes({
      title: title,
      workflowId: node.attrs.workflowId,
      steps: node.attrs.steps,
      invocationId: node.attrs.invocationId,
      executionState: node.attrs.executionState,
      finalSummary: node.attrs.finalSummary,
    })
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
          <WorkflowHeader
            title={node.attrs.title}
            invocation={invocation}
            isExecuting={isExecuting}
            workflowId={node.attrs.workflowId}
            onTitleChange={handleTitleChange}
            onExecute={handleExecuteWorkflow}
            onDelete={deleteNode}
            getStatusIcon={getStatusIcon}
            getStatusText={getStatusText}
            getStatusColor={getStatusColor}
          />

          <CardContent className="pt-0">
            <div className="space-y-3">
              <WorkflowSelector
                workflows={workflows}
                selectedWorkflowId={node.attrs.workflowId}
                isLoading={isLoadingWorkflows}
                isExecuting={isExecuting}
                onWorkflowSelect={handleWorkflowSelect}
              />

              {/* 步骤列表 - 只有选择了工作流才显示 */}
              {node.attrs.workflowId && (
                <WorkflowSteps
                  steps={steps}
                  invocation={invocation}
                  expandedSteps={expandedSteps}
                  getStepLogs={getStepLogs}
                  getStepStatus={getStepStatus}
                  onToggleStepExpansion={toggleStepExpansion}
                />
              )}

              <WorkflowResults
                invocation={invocation}
                finalSummary={node.attrs.finalSummary}
                insertContent={insertContent}
              />
            </div>
          </CardContent>
        </Card>
      </NodeViewWrapper>
    </>
  )
}

export { WorkflowNodeView }
