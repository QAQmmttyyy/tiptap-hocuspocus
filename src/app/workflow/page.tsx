"use client"

import { useChat } from "@ai-sdk/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchWorkflowAPI } from "@/lib/workflow-api"
import { FileText, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

interface Workflow {
  id: string
  name?: string
  description?: string
  steps: string[]
}

export default function WorkflowPage() {
  const [description, setDescription] = useState("")
  const [workflowName, setWorkflowName] = useState("")
  const [workflowId, setWorkflowId] = useState("")
  const [steps, setSteps] = useState<string[]>([""])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("")
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const { input, setInput, append } = useChat({
    onFinish: async (message) => {
      try {
        console.log("Received message from AI:", message)

        // 从消息内容中解析JSON
        const content = message.content
        let parsedData = null

        // 尝试直接解析整个内容为JSON
        try {
          parsedData = JSON.parse(content)
        } catch {
          // 如果直接解析失败，尝试提取JSON部分
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              parsedData = JSON.parse(jsonMatch[0])
            } catch (parseError) {
              console.error("无法解析JSON:", parseError)
            }
          }
        }

        if (parsedData) {
          // 检查是否是标准的API响应格式
          if (parsedData.code === 200 && parsedData.data && parsedData.data.workflows) {
            const newWorkflows = parsedData.data.workflows

            // 将新工作流添加到现有工作流列表中
            setWorkflows((prevWorkflows) => {
              const existingIds = new Set(prevWorkflows.map((w) => w.id))
              const uniqueNewWorkflows = newWorkflows.filter(
                (w: Workflow) => w && w.id && !existingIds.has(w.id),
              )
              return [...prevWorkflows, ...uniqueNewWorkflows]
            })

            // 如果只有一个新工作流，自动填充表单
            if (newWorkflows.length === 1) {
              const workflow = newWorkflows[0]
              setWorkflowId(workflow.id)
              setWorkflowName(workflow.name || workflow.id)
              setDescription(workflow.description || "")
              setSteps(workflow.steps || [""])
            }

            showMessage(`成功生成 ${newWorkflows.length} 个工作流！`, "success")
          }
          // 检查是否是单个工作流格式
          else if (parsedData.id && parsedData.steps) {
            setWorkflowId(parsedData.id)
            setWorkflowName(parsedData.name || parsedData.id)
            setDescription(parsedData.description || "")
            setSteps(Array.isArray(parsedData.steps) ? parsedData.steps : [""])
            showMessage("工作流信息已自动填充！", "success")
          } else {
            showMessage("AI返回的格式不正确，请检查输入", "error")
          }
        } else {
          showMessage("无法从AI响应中提取工作流信息", "error")
        }
      } catch (error) {
        console.error("处理AI响应时发生错误:", error)
        showMessage("处理AI响应时发生错误", "error")
      } finally {
        setIsGenerating(false)
      }
    },
    onError: (error) => {
      console.error("AI服务错误:", error)
      showMessage("AI服务暂时不可用，请稍后重试", "error")
      setIsGenerating(false)
    },
  })

  // 加载现有工作流
  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      setIsLoadingWorkflows(true)
      const response = await fetchWorkflowAPI("/v1/workflow")
      setWorkflows(response.data.workflows || [])
    } catch (error) {
      console.error("加载工作流失败:", error)
      showMessage("加载工作流失败", "error")
    } finally {
      setIsLoadingWorkflows(false)
    }
  }

  // 显示消息
  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage("")
      setMessageType("")
    }, 3000)
  }

  // 自动生成工作流名称和ID
  const generateWorkflowInfo = () => {
    if (!input.trim()) return

    setIsGenerating(true)
    const prompt = `
    <role>
     你是一个工作流设计专家，请根据用户输入的自然语言描述，生成一个工作流。
    </role>
    <example>
      <input>
        用户输入：分析Tesla近三年來的股價趨勢
      </input>
      <output>
        {
        "id": "tesla_analysis_v1",
        "name": "tesla_analysis_v1",
        "description": "分析Tesla近三年來的股價趨勢",
        "steps": [
          "搜索Tesla公司近三年的股價走勢和主要財務數據",
          "搜索Tesla公司近三年的重要新聞事件和里程碑",
          "分析Tesla股價趨勢並總結影響因素"
        ]
      }
      </output>
    </example>
    <notice>
    请使用json格式输出，不要使用其他格式，严格遵守 output 中的 json 格式，不要自定义字段
    </notice>
    `
    append({
      role: "user",
      content: `{your_task: ${prompt} ,user_input: ${input}}`,
    })
  }

  // 添加步骤
  const addStep = () => {
    setSteps([...steps, ""])
  }

  // 删除步骤
  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  // 更新步骤
  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = value
    setSteps(newSteps)
  }

  // 创建工作流
  const createWorkflow = async () => {
    if (!workflowName.trim() || !workflowId.trim() || steps.filter((s) => s.trim()).length === 0) {
      showMessage("请填写完整的工作流信息", "error")
      return
    }

    try {
      setIsCreating(true)

      const requestData = {
        id: workflowId,
        name: workflowName,
        description: description || undefined,
        steps: steps.filter((s) => s.trim()),
      }

      await fetchWorkflowAPI("/v1/workflow", {
        method: "POST",
        body: JSON.stringify(requestData),
      })

      showMessage("工作流创建成功！", "success")

      // 重置表单
      setDescription("")
      setWorkflowName("")
      setWorkflowId("")
      setSteps([""])

      // 重新加载工作流列表
      loadWorkflows()
    } catch (error) {
      console.error("创建工作流失败:", error)
      showMessage("创建工作流失败", "error")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">工作流管理</h1>
        <p className="text-gray-600">通过自然语言描述创建和管理工作流</p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            messageType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 创建工作流卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              创建新工作流
            </CardTitle>
            <CardDescription>使用自然语言描述您想要的工作流，系统会自动生成步骤</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 自然语言描述 */}
            <div>
              <label className="block text-sm font-medium mb-2">自然语言描述</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如：帮我查询深圳天气，然后根据天气情况决定是否出门。"
                className="w-full p-3 border rounded-lg min-h-[100px] resize-none"
              />
              <Button
                onClick={() => generateWorkflowInfo()}
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={!input.trim() || isGenerating}
              >
                {isGenerating ? "生成中..." : "生成工作流"}
              </Button>
            </div>

            <Separator />

            {/* 工作流基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">工作流名称</label>
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="输入工作流名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">工作流ID</label>
                <Input
                  value={workflowId}
                  onChange={(e) => setWorkflowId(e.target.value)}
                  placeholder="输入唯一ID"
                />
              </div>
            </div>

            {/* 工作流描述 */}
            <div>
              <label className="block text-sm font-medium mb-2">工作流描述（可选）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入工作流的详细描述"
                className="w-full p-3 border rounded-lg min-h-[80px] resize-none"
              />
            </div>

            {/* 工作流步骤 */}
            <div>
              <label className="block text-sm font-medium mb-2">工作流步骤</label>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      placeholder={`步骤 ${index + 1}`}
                    />
                    {steps.length > 1 && (
                      <Button onClick={() => removeStep(index)} variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button onClick={addStep} variant="outline" size="sm">
                  添加步骤
                </Button>
              </div>
            </div>

            {/* 创建按钮 */}
            <Button onClick={createWorkflow} disabled={isCreating} className="w-full">
              {isCreating ? "创建中..." : "创建工作流"}
            </Button>
          </CardContent>
        </Card>

        {/* 现有工作流列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              现有工作流
            </CardTitle>
            <CardDescription>管理和查看已创建的工作流</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingWorkflows ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无工作流，请创建第一个工作流</div>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedWorkflowId === workflow.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedWorkflowId(workflow.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{workflow.name || workflow.id}</h3>
                        {workflow.name && workflow.name !== workflow.id && (
                          <p className="text-xs text-gray-500 mt-1">ID: {workflow.id}</p>
                        )}
                      </div>
                      {/* {selectedWorkflowId === workflow.id && (
                        <div className="text-xs text-blue-600 font-medium">已选中</div>
                      )} */}
                    </div>

                    {workflow.description && (
                      <div className="text-sm text-gray-600 mb-2">{workflow.description}</div>
                    )}

                    <div className="text-sm text-gray-600 mb-2">
                      步骤数: {workflow.steps.length}
                    </div>

                    <div className="space-y-1">
                      {workflow.steps.slice(0, 3).map((step, index) => (
                        <div key={index} className="text-sm text-gray-500">
                          {index + 1}. {step}
                        </div>
                      ))}
                      {workflow.steps.length > 3 && (
                        <div className="text-sm text-gray-400">
                          ... 还有 {workflow.steps.length - 3} 个步骤
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
