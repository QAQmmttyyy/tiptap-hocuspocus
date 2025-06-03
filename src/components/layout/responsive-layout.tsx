'use client'

import { ReactNode, useEffect } from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { AppFooter } from './app-footer'
import { useSidebarStore } from '@/lib/stores/sidebar-store'

interface ResponsiveLayoutProps {
  children: ReactNode
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { setMobileMode } = useSidebarStore()

  // 监听屏幕尺寸变化
  useEffect(() => {
    const checkIsMobile = () => {
      const isMobile = window.innerWidth < 1024 // lg断点
      setMobileMode(isMobile)
    }

    // 初始检查
    checkIsMobile()

    // 监听尺寸变化
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [setMobileMode])

  return (
    <div className="h-screen bg-background">
      {/* 左右分栏布局 */}
      <SidebarProvider>
        <AppSidebar />
        
        {/* 右侧主内容区域 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 标签页区域 */}
          <div className="h-12 bg-muted/30 border-b border-border flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            {/* 这里将放置标签页栏组件 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>标签页区域 (开发中...)</span>
            </div>
          </div>

          {/* 文档内容区域 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 文档头部区域 */}
            <div className="h-16 bg-background border-b border-border flex items-center px-6">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">文档标题</h2>
                  <div className="text-sm text-muted-foreground">
                    自动保存于 2分钟前
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    3 位协作者在线
                  </div>
                </div>
              </div>
            </div>

            {/* 编辑器容器 */}
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </div>

          {/* 右侧Footer */}
          <AppFooter />
        </main>
      </SidebarProvider>
    </div>
  )
} 