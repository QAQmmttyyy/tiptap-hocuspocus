import { NextResponse } from "next/server"

/* eslint-disable */
export async function GET(
  _request: Request,
  { params: _params }: { params: { workflow_id: string } },
) {
  // 注意：这里接收了 workflow_id 参数，但在当前实现中返回固定数据
  // 如果需要根据 workflow_id 返回不同数据，可以使用 _params.workflow_id

  const response = {
    code: 200,
    message: "成功",
    data: {
      workflow_invocation_ids: [
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // 固定的UUID格式
        "b2c3d4e5-f6g7-8901-bcde-f23456789012", // 固定的UUID格式
      ],
    },
  }

  return NextResponse.json(response)
}

export async function POST(
  _request: Request,
  { params: _params }: { params: { workflow_id: string } },
) {
  // 创建新的 workflow invocation
  // 生成新的UUID
  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c == "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const response = {
    code: 200,
    message: "成功",
    data: {
      workflow_invocation_id: generateUUID(), // 每次生成新的UUID
    },
  }

  return NextResponse.json(response)
}
