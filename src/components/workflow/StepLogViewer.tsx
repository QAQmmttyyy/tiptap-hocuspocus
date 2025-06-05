import React from "react"
import { GeneralLogEntryDetail } from "./types"

interface StepLogViewerProps {
  logs: GeneralLogEntryDetail[]
}

export const StepLogViewer: React.FC<StepLogViewerProps> = ({ logs }) => {
  return (
    <div className="px-3 pb-3">
      <div className="border-t border-gray-200 pt-3">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {logs.map((log, logIndex) => (
            <div key={logIndex} className="bg-white border border-gray-200 p-3 rounded-md text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-800">{log.type}</span>
                <span className="text-gray-500 text-xs">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              {log.summary && (
                <div className="text-gray-600 mb-2 font-medium text-xs">{log.summary}</div>
              )}
              {log.details && Object.keys(log.details).length > 0 && (
                <div className="text-gray-600">
                  <div className="font-medium text-blue-600 mb-1 text-xs">详细信息:</div>
                  <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
