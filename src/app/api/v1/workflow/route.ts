import { NextResponse } from "next/server"
import { fetchWorkflowAPI } from "@/lib/workflow-api"

export async function GET() {
  try {
    // 调用真实的后端API获取工作流列表
    const data = await fetchWorkflowAPI("/v1/workflow")
    console.log(data, "data")

    return NextResponse.json(data)
  } catch (error) {
    console.error("获取工作流列表失败:", error)
    return NextResponse.json(
      {
        code: 500,
        message: "获取工作流列表失败",
        data: { workflows: [] },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 调用真实的后端API创建工作流
    const data = await fetchWorkflowAPI("/v1/workflow", {
      method: "POST",
      body: JSON.stringify(body),
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("创建工作流失败:", error)
    return NextResponse.json(
      {
        code: 500,
        message: "创建工作流失败",
        data: null,
      },
      { status: 500 },
    )
  }
}
