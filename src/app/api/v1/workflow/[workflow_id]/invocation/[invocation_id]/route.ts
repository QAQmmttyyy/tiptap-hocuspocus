import { NextResponse } from "next/server"
import { fetchWorkflowAPI } from "@/lib/workflow-api"

/* eslint-disable */

// 模拟执行状态的全局存储
const executionStates = new Map<
  string,
  {
    startTime: number
    workflowId: string
    invocationId: string
  }
>()

export async function GET(
  _request: Request,
  { params }: { params: { workflow_id: string; invocation_id: string } },
) {
  try {
    // 调用真实的后端API获取工作流调用状态
    const data = await fetchWorkflowAPI(
      `/v1/workflow/${params.workflow_id}/invocation/${params.invocation_id}`,
    )
    return NextResponse.json(data)
  } catch (error) {
    console.error("获取工作流调用状态失败:", error)
    return NextResponse.json(
      {
        code: 500,
        message: "获取工作流调用状态失败",
        data: {
          workflow_invocation_id: params.invocation_id,
          current_step: "0",
          status: "failed",
          execution_log: {},
        },
      },
      { status: 500 },
    )
  }
}
