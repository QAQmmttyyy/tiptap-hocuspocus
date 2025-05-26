'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ServerStatus {
  running: boolean
  port: number
  connections: number
}

export default function ServerStatus() {
  const [status, setStatus] = useState<ServerStatus>({ running: false, port: 1234, connections: 0 })
  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/collaboration')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('检查服务器状态失败:', error)
    }
  }

  const startServer = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/collaboration', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setStatus({ running: data.running, port: data.port, connections: data.connections })
      }
    } catch (error) {
      console.error('启动服务器失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const stopServer = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/collaboration', { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        setStatus({ running: false, port: 1234, connections: 0 })
      }
    } catch (error) {
      console.error('停止服务器失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 3000) // 每3秒检查一次状态
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium">协作服务器状态</h3>
          <div className={`flex items-center gap-2 text-sm ${status.running ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${status.running ? 'bg-green-500' : 'bg-red-500'}`} />
            {status.running ? '运行中' : '已停止'}
          </div>
          {status.running && (
            <div className="text-sm text-gray-600">
              端口: {status.port} | 连接数: {status.connections}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!status.running ? (
            <Button 
              onClick={startServer} 
              disabled={loading}
              size="sm"
            >
              {loading ? '启动中...' : '启动服务器'}
            </Button>
          ) : (
            <Button 
              onClick={stopServer} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? '停止中...' : '停止服务器'}
            </Button>
          )}
          <Button 
            onClick={checkStatus} 
            variant="outline"
            size="sm"
          >
            刷新状态
          </Button>
        </div>
      </div>
    </Card>
  )
} 