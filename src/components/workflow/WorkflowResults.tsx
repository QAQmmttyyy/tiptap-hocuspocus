import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, CheckCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { WorkflowExecutionState } from "./types"
import { Button } from "../ui/button"

interface WorkflowResultsProps {
  invocation?: WorkflowExecutionState
  finalSummary?: string
  insertContent: (content: string) => void
}

export const WorkflowResults: React.FC<WorkflowResultsProps> = ({
  invocation,
  finalSummary,
  insertContent,
}) => {
  const finalSummaryContent = invocation?.final_summary || finalSummary

  if (invocation?.status !== "completed") {
    return null
  }

  return (
    <div className="mt-4 space-y-3">
      {/* 执行完成提示 */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="font-medium text-sm">工作流执行成功完成！</span>
        </div>
      </div>

      {/* 执行结果展示 */}
      {finalSummaryContent && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-700">执行结果总结</h4>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => insertContent(finalSummaryContent)}
            >
              Apply
            </Button>
          </div>
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="workflow-markdown">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-6">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside text-gray-700 mb-3 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="ml-2">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-800">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {finalSummaryContent}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
