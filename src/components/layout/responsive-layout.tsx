'use client'

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { AppFooter } from "./app-footer"
import TabBar from "@/components/tabs/tab-bar"
import TabContent from "@/components/tabs/tab-content"

export default function ResponsiveLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* 侧边栏 */}
        <AppSidebar />
        
        {/* 主内容区域 */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* 标签页栏 */}
          <div className="flex items-center h-12 bg-background border-b border-border shrink-0 min-w-0">
            <SidebarTrigger className="ml-2 shrink-0" />
            <TabBar className="flex-1 min-w-0" />
          </div>
          
          {/* 标签页内容 */}
          <TabContent />
          
          {/* 底部状态栏 */}
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  )
} 