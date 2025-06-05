'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar'
import {
  Bell,
  Clock,
  Command as CommandIcon,
  File,
  Filter,
  Plus,
  Search,
  Settings,
  SortAsc,
  SortDesc,
  Star,
  User,
} from 'lucide-react'
import { useTempAuth } from '@/hooks/use-temp-auth'
import { useDocuments } from '@/hooks/use-documents'
import { useTabStore } from '@/lib/stores/tab-store'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { CreateDocumentDialog } from '@/components/document/create-document-dialog'

export function AppSidebar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    sortOrder, 
    toggleSortOrder, 
    showRecent, 
    setShowRecent,
    showFavorites,
    setShowFavorites 
  } = useSidebarStore()
  
  const { data: documents, isLoading } = useDocuments()
  const { user, isAuthenticated } = useTempAuth()

  return (
    <Sidebar className="border-r">
      {/* 集成的应用头部 */}
      <SidebarHeader className="p-4 border-b bg-muted/20">
        {/* 应用标题和Logo */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">协作文档</h1>
              <p className="text-xs text-muted-foreground mt-1">实时编辑工具</p>
            </div>
          </div>
          
          {/* 头部操作按钮 */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 用户信息 */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 mb-4 p-3 bg-background/60 rounded-xl border shadow-sm">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              在线
            </Badge>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="mb-4 w-full">
            <User className="h-4 w-4 mr-2" />
            登录
          </Button>
        )}

        {/* 新建文档按钮 */}
        <CreateDocumentDialog />
      </SidebarHeader>

      {/* 内容区 */}
      <SidebarContent className="px-4">
        {/* 文档搜索和筛选区域 */}
        <div className="py-4 space-y-4">
          {/* 文档搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/50 border-muted focus:bg-background"
            />
            {searchQuery && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  <CommandIcon className="h-3 w-3 mr-1" />
                  K
                </Badge>
              </div>
            )}
          </div>

          {/* 筛选和排序 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant={showRecent ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowRecent(!showRecent)}
                className="h-8 px-3 text-xs font-medium"
              >
                <Clock className="h-3 w-3 mr-1.5" />
                最近
              </Button>
              <Button
                variant={showFavorites ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowFavorites(!showFavorites)}
                className="h-8 px-3 text-xs font-medium"
              >
                <Star className="h-3 w-3 mr-1.5" />
                收藏
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSortOrder}
                className="h-8 w-8 p-0"
                title={`按${sortOrder === 'asc' ? '升序' : '降序'}排列`}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-3.5 w-3.5" />
                ) : (
                  <SortDesc className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="更多筛选"
              >
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 文档列表 */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            文档列表 ({documents?.length || 0})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 mt-2">
              {isLoading ? (
                // 加载状态
                Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))
              ) : documents && documents.length > 0 ? (
                // 文档列表
                documents.map((doc) => (
                  <SidebarMenuItem key={doc.id}>
                    <SidebarMenuButton 
                      className="h-auto py-2.5 px-3 hover:bg-muted/80 data-[active=true]:bg-muted cursor-pointer"
                      onClick={() => {
                        // 使用标签页系统打开文档
                        const { openTab } = useTabStore.getState()
                        openTab(doc)
                      }}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <File className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate leading-none">
                              {doc.title}
                            </span>
                            {doc.isDirty && (
                              <div className="h-1.5 w-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground leading-none">
                            {formatDate(doc.updatedAt)}
                          </div>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                // 空状态
                <SidebarMenuItem>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 bg-muted/50 rounded-lg flex items-center justify-center mb-3">
                      <File className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {searchQuery ? '未找到匹配的文档' : '暂无文档'}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mb-4">
                      {searchQuery ? '尝试其他搜索词' : '开始创建您的第一个文档'}
                    </p>
                    <CreateDocumentDialog 
                      trigger={
                        <Button variant="outline" size="sm" className="h-8">
                          <Plus className="h-3 w-3 mr-1.5" />
                          创建文档
                        </Button>
                      } 
                    />
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 底部统计和状态 */}
      <SidebarFooter className="p-4 border-t bg-muted/20">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>已同步</span>
          </div>
          <Badge variant="secondary" className="text-xs px-2 py-1">
            {documents?.length || 0} 个文档
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

// 日期格式化工具函数
function formatDate(date: Date) {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }
} 