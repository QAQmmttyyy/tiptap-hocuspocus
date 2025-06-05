import { NextResponse } from "next/server"
import { fetchWorkflowAPI } from "@/lib/workflow-api"

/* eslint-disable */
export async function GET(_request: Request, { params }: { params: { workflow_id: string } }) {
  try {
    // 调用真实的后端API获取工作流调用列表
    const data = await fetchWorkflowAPI(`/v1/workflow/${params.workflow_id}/invocation`)
    return NextResponse.json(data)
  } catch (error) {
    console.error("获取工作流调用列表失败:", error)
    return NextResponse.json(
      {
        code: 500,
        message: "获取工作流调用列表失败",
        data: { workflow_invocation_ids: [] },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, { params }: { params: { workflow_id: string } }) {
  try {
    const body = await request.json()

    // 调用真实的后端API创建工作流调用
    const data = await fetchWorkflowAPI(`/v1/workflow/${params.workflow_id}/invocation`, {
      method: "POST",
      body: JSON.stringify(body),
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("创建工作流调用失败:", error)
    return NextResponse.json(
      {
        code: 500,
        message: "创建工作流调用失败",
        data: null,
      },
      { status: 500 },
    )
  }
}
