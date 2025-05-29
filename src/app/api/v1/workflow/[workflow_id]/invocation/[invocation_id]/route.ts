import { NextResponse } from "next/server"

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
  { params: _params }: { params: { workflow_id: string; invocation_id: string } },
) {
  // 获取特定工作流调用的详细信息
  const { workflow_id, invocation_id } = _params
  const key = `${workflow_id}-${invocation_id}`

  // 检查是否有执行记录
  let executionState = executionStates.get(key)

  // 如果没有记录，创建一个新的执行状态
  if (!executionState) {
    executionState = {
      startTime: Date.now(),
      workflowId: workflow_id,
      invocationId: invocation_id,
    }
    executionStates.set(key, executionState)
  }

  const now = Date.now()
  const elapsed = now - executionState.startTime
  const totalDuration = 7000 // 7秒总执行时间

  let status: string
  let currentStep: string
  let executionLog: Record<string, any> = {}

  if (elapsed < 1000) {
    // 0-1秒: pending
    status = "pending"
    currentStep = "0"
    executionLog = {}
  } else if (elapsed < 3000) {
    // 1-3秒: 执行第一步
    status = "started"
    currentStep = "0"
    executionLog = {
      "0(打开冰箱门)": [
        {
          tool_name: "冰箱控制器",
          input: "执行开门指令",
          output: elapsed > 2500 ? "冰箱门已成功打开，检测到内部温度为4°C" : "正在打开冰箱门...",
        },
      ],
    }
  } else if (elapsed < 5500) {
    // 3-5.5秒: 执行第二步
    status = "started"
    currentStep = "1"
    executionLog = {
      "0(打开冰箱门)": [
        {
          tool_name: "冰箱控制器",
          input: "执行开门指令",
          output: "冰箱门已成功打开，检测到内部温度为4°C",
        },
      ],
      "1(把大象装进冰箱)": [
        {
          tool_name: "空间压缩器",
          input: "大象体积: 3m³, 冰箱容积: 0.5m³",
          output:
            elapsed > 5000 ? "使用量子压缩技术，大象已成功装入冰箱" : "正在进行空间压缩处理...",
        },
      ],
    }
  } else if (elapsed < totalDuration) {
    // 5.5-7秒: 执行第三步
    status = "started"
    currentStep = "2"
    executionLog = {
      "0(打开冰箱门)": [
        {
          tool_name: "冰箱控制器",
          input: "执行开门指令",
          output: "冰箱门已成功打开，检测到内部温度为4°C",
        },
      ],
      "1(把大象装进冰箱)": [
        {
          tool_name: "空间压缩器",
          input: "大象体积: 3m³, 冰箱容积: 0.5m³",
          output: "使用量子压缩技术，大象已成功装入冰箱",
        },
      ],
      "2(关上冰箱门)": [
        {
          tool_name: "冰箱控制器",
          input: "执行关门指令，确保密封性",
          output: elapsed > 6500 ? "冰箱门已关闭并锁定，大象安全存储完成" : "正在关闭冰箱门...",
        },
      ],
    }
  } else {
    // 7秒后: 完成
    status = "completed"
    currentStep = "3"
    executionLog = {
      "0(打开冰箱门)": [
        {
          tool_name: "冰箱控制器",
          input: "执行开门指令",
          output: "冰箱门已成功打开，检测到内部温度为4°C",
        },
      ],
      "1(把大象装进冰箱)": [
        {
          tool_name: "空间压缩器",
          input: "大象体积: 3m³, 冰箱容积: 0.5m³",
          output: "使用量子压缩技术，大象已成功装入冰箱",
        },
      ],
      "2(关上冰箱门)": [
        {
          tool_name: "冰箱控制器",
          input: "执行关门指令，确保密封性",
          output: "冰箱门已关闭并锁定，大象安全存储完成",
        },
      ],
    }

    // 执行完成后清理状态
    executionStates.delete(key)
  }

  const response = {
    code: 200,
    message: "成功",
    data: {
      workflow_invocation_id: invocation_id,
      current_step: currentStep,
      status: status,
      execution_log: executionLog,
    },
  }

  return NextResponse.json(response)
}
