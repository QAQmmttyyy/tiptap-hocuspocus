'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'
import { 
  Wifi, 
  WifiOff, 
  Server, 
  Users, 
  Clock,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppFooter() {
  // 健康检查查询
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: queryKeys.system.health(),
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30 * 1000, // 30秒刷新一次
    retry: false,
  })

  // 当前时间
  const currentTime = new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })

  // 连接状态
  const isOnline = health?.status === 'ok' || health?.status === 'healthy'
  const isOffline = healthLoading || !health || health.status === 'error'

  return (
    <footer className="h-7 bg-muted/30 border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
      {/* 左侧状态信息 */}
      <div className="flex items-center gap-4">
        {/* 连接状态 */}
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="h-3 w-3 text-green-600" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-600" />
          )}
          <span className={cn(
            isOnline ? 'text-green-600' : 'text-red-600'
          )}>
            {isOnline ? '已连接' : '离线'}
          </span>
        </div>

        {/* 服务器状态 */}
        <div className="flex items-center gap-1">
          <Server className="h-3 w-3" />
          <span>Hocuspocus</span>
          <Badge 
            variant={isOnline ? 'default' : 'destructive'} 
            className="h-4 text-xs px-1"
          >
            {isOnline ? '正常' : '异常'}
          </Badge>
        </div>

        {/* 在线用户数（模拟） */}
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>3 用户在线</span>
        </div>
      </div>

      {/* 右侧信息 */}
      <div className="flex items-center gap-4">
        {/* 当前时间 */}
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{currentTime}</span>
        </div>

        {/* 管理链接 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-xs"
          asChild
        >
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1"
          >
            <span>API 状态</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>

        {/* 版本信息 */}
        <span className="text-muted-foreground/60">
          v1.0.0
        </span>
      </div>
    </footer>
  )
} 