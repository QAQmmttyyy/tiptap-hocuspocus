import { NextResponse } from "next/server"

export async function GET() {
  const response = {
    code: 200,
    message: "成功",
    data: {
      workflows: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000", // 固定的UUID格式
          steps: ["打开冰箱门", "把大象装进冰箱", "关上冰箱门"],
        },
      ],
    },
  }

  return NextResponse.json(response)
}
