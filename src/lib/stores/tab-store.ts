import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Document, User } from '@/lib/api-client'

// 标签页数据接口
export interface TabData {
  id: string // 标签页ID，格式：tab_${documentId}_${timestamp}
  documentId: string // 文档ID
  title: string // 文档标题
  isDirty: boolean // 是否有未保存的更改
  isActive: boolean // 是否为当前活跃标签页
  isPinned: boolean // 是否固定
  lastModified: Date // 最后修改时间
  saveStatus: 'saved' | 'saving' | 'error' | 'offline' // 保存状态
  collaborators: User[] // 协作者列表
  createdAt: Date // 标签页创建时间
}

// 标签页状态接口
interface TabStore {
  // 状态
  tabs: TabData[]
  activeTabId: string | null
  maxTabs: number
  isLoading: boolean
  
  // 基础操作
  openTab: (document: Document) => void
  closeTab: (tabId: string) => Promise<boolean>
  switchTab: (tabId: string) => void
  moveTab: (fromIndex: number, toIndex: number) => void
  
  // 批量操作
  closeOtherTabs: (keepTabId: string) => Promise<boolean>
  closeAllTabs: () => Promise<boolean>
  closeTabsToRight: (tabId: string) => Promise<boolean>
  closeDirtyTabs: () => Promise<boolean>
  
  // 状态管理
  updateTabTitle: (tabId: string, title: string) => void
  updateTabDirtyStatus: (tabId: string, isDirty: boolean) => void
  updateTabSaveStatus: (tabId: string, status: TabData['saveStatus']) => void
  updateTabCollaborators: (tabId: string, collaborators: User[]) => void
  
  // 状态查询
  getActiveTab: () => TabData | null
  getTabById: (tabId: string) => TabData | null
  getTabByDocumentId: (documentId: string) => TabData | null
  isDirty: (tabId: string) => boolean
  canCloseTab: (tabId: string) => boolean
  getDirtyTabs: () => TabData[]
  
  // 会话管理
  saveSession: () => void
  loadSession: () => void
  clearSession: () => void
  
  // 内部方法
  _generateTabId: (documentId: string) => string
  _reorderTabs: () => void
  _enforceMaxTabs: () => void
}

// 生成唯一标签页ID
const generateTabId = (documentId: string): string => {
  return `tab_${documentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 标签页会话存储键
const TAB_SESSION_KEY = 'tab_session_v1'

// 创建标签页store
export const useTabStore = create<TabStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    tabs: [],
    activeTabId: null,
    maxTabs: 10,
    isLoading: false,
    
    // 基础操作
    openTab: (document: Document) => {
      const { tabs, maxTabs, getTabByDocumentId } = get()
      
      // 检查是否已经打开了这个文档
      const existingTab = getTabByDocumentId(document.id)
      if (existingTab) {
        // 如果已存在，直接切换到该标签页
        get().switchTab(existingTab.id)
        return
      }
      
      // 检查是否超过最大标签页数量
      if (tabs.length >= maxTabs) {
        // 关闭最旧的非固定标签页
        const oldestTab = tabs
          .filter(tab => !tab.isPinned && !tab.isDirty)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]
        
        if (oldestTab) {
          get().closeTab(oldestTab.id)
        } else {
          // 如果所有标签页都是固定或脏的，提示用户
          console.warn('已达到最大标签页数量，请先关闭一些标签页')
          return
        }
      }
      
      // 创建新标签页
      const newTab: TabData = {
        id: generateTabId(document.id),
        documentId: document.id,
        title: document.title,
        isDirty: false,
        isActive: true,
        isPinned: false,
        lastModified: document.updatedAt,
        saveStatus: 'saved',
        collaborators: [],
        createdAt: new Date(),
      }
      
      set(state => ({
        tabs: [...state.tabs.map(tab => ({ ...tab, isActive: false })), newTab],
        activeTabId: newTab.id,
      }))
      
      get().saveSession()
    },
    
    closeTab: async (tabId: string): Promise<boolean> => {
      const { tabs, activeTabId, getTabById } = get()
      const tab = getTabById(tabId)
      
      if (!tab) return false
      
      // 检查是否有未保存的更改
      if (tab.isDirty) {
        // 在实际应用中，这里应该显示确认对话框
        const confirmed = window.confirm(`"${tab.title}" 有未保存的更改，是否要关闭？`)
        if (!confirmed) return false
      }
      
      const newTabs = tabs.filter(t => t.id !== tabId)
      let newActiveTabId = activeTabId
      
      // 如果关闭的是当前活跃标签页，需要切换到其他标签页
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          // 优先切换到右边的标签页，如果没有则切换到左边的
          const currentIndex = tabs.findIndex(t => t.id === tabId)
          const nextTab = newTabs[currentIndex] || newTabs[currentIndex - 1]
          newActiveTabId = nextTab?.id || null
        } else {
          newActiveTabId = null
        }
      }
      
      set({
        tabs: newTabs.map(tab => ({
          ...tab,
          isActive: tab.id === newActiveTabId
        })),
        activeTabId: newActiveTabId,
      })
      
      get().saveSession()
      return true
    },
    
    switchTab: (tabId: string) => {
      const { getTabById } = get()
      const tab = getTabById(tabId)
      
      if (!tab) return
      
      set(state => ({
        tabs: state.tabs.map(tab => ({
          ...tab,
          isActive: tab.id === tabId
        })),
        activeTabId: tabId,
      }))
      
      get().saveSession()
    },
    
    moveTab: (fromIndex: number, toIndex: number) => {
      const { tabs } = get()
      
      if (fromIndex < 0 || fromIndex >= tabs.length || toIndex < 0 || toIndex >= tabs.length) {
        return
      }
      
      const newTabs = [...tabs]
      const [movedTab] = newTabs.splice(fromIndex, 1)
      newTabs.splice(toIndex, 0, movedTab)
      
      set({ tabs: newTabs })
      get().saveSession()
    },
    
    // 批量操作
    closeOtherTabs: async (keepTabId: string): Promise<boolean> => {
      const { tabs } = get()
      const otherTabs = tabs.filter(tab => tab.id !== keepTabId)
      const dirtyTabs = otherTabs.filter(tab => tab.isDirty)
      
      if (dirtyTabs.length > 0) {
        const confirmed = window.confirm(`有 ${dirtyTabs.length} 个标签页有未保存的更改，是否要关闭？`)
        if (!confirmed) return false
      }
      
      set(state => ({
        tabs: state.tabs.filter(tab => tab.id === keepTabId).map(tab => ({
          ...tab,
          isActive: true
        })),
        activeTabId: keepTabId,
      }))
      
      get().saveSession()
      return true
    },
    
    closeAllTabs: async (): Promise<boolean> => {
      const { tabs } = get()
      const dirtyTabs = tabs.filter(tab => tab.isDirty)
      
      if (dirtyTabs.length > 0) {
        const confirmed = window.confirm(`有 ${dirtyTabs.length} 个标签页有未保存的更改，是否要关闭所有标签页？`)
        if (!confirmed) return false
      }
      
      set({
        tabs: [],
        activeTabId: null,
      })
      
      get().saveSession()
      return true
    },
    
    closeTabsToRight: async (tabId: string): Promise<boolean> => {
      const { tabs } = get()
      const tabIndex = tabs.findIndex(tab => tab.id === tabId)
      
      if (tabIndex === -1 || tabIndex === tabs.length - 1) return false
      
      const tabsToClose = tabs.slice(tabIndex + 1)
      const dirtyTabs = tabsToClose.filter(tab => tab.isDirty)
      
      if (dirtyTabs.length > 0) {
        const confirmed = window.confirm(`有 ${dirtyTabs.length} 个标签页有未保存的更改，是否要关闭？`)
        if (!confirmed) return false
      }
      
      const newTabs = tabs.slice(0, tabIndex + 1)
      const activeTab = newTabs.find(tab => tab.isActive)
      
      set({
        tabs: newTabs,
        activeTabId: activeTab?.id || null,
      })
      
      get().saveSession()
      return true
    },
    
    closeDirtyTabs: async (): Promise<boolean> => {
      const { tabs } = get()
      const dirtyTabs = tabs.filter(tab => tab.isDirty)
      
      if (dirtyTabs.length === 0) return true
      
      const confirmed = window.confirm(`有 ${dirtyTabs.length} 个标签页有未保存的更改，是否要关闭？`)
      if (!confirmed) return false
      
      const newTabs = tabs.filter(tab => !tab.isDirty)
      const activeTab = newTabs.find(tab => tab.isActive)
      
      set({
        tabs: newTabs,
        activeTabId: activeTab?.id || null,
      })
      
      get().saveSession()
      return true
    },
    
    // 状态管理
    updateTabTitle: (tabId: string, title: string) => {
      set(state => ({
        tabs: state.tabs.map(tab =>
          tab.id === tabId ? { ...tab, title } : tab
        ),
      }))
      get().saveSession()
    },
    
    updateTabDirtyStatus: (tabId: string, isDirty: boolean) => {
      set(state => ({
        tabs: state.tabs.map(tab =>
          tab.id === tabId ? { ...tab, isDirty, lastModified: new Date() } : tab
        ),
      }))
      get().saveSession()
    },
    
    updateTabSaveStatus: (tabId: string, status: TabData['saveStatus']) => {
      set(state => ({
        tabs: state.tabs.map(tab =>
          tab.id === tabId ? { ...tab, saveStatus: status } : tab
        ),
      }))
    },
    
    updateTabCollaborators: (tabId: string, collaborators: User[]) => {
      set(state => ({
        tabs: state.tabs.map(tab =>
          tab.id === tabId ? { ...tab, collaborators } : tab
        ),
      }))
    },
    
    // 状态查询
    getActiveTab: () => {
      const { tabs, activeTabId } = get()
      return tabs.find(tab => tab.id === activeTabId) || null
    },
    
    getTabById: (tabId: string) => {
      const { tabs } = get()
      return tabs.find(tab => tab.id === tabId) || null
    },
    
    getTabByDocumentId: (documentId: string) => {
      const { tabs } = get()
      return tabs.find(tab => tab.documentId === documentId) || null
    },
    
    isDirty: (tabId: string) => {
      const tab = get().getTabById(tabId)
      return tab?.isDirty || false
    },
    
    canCloseTab: (tabId: string) => {
      const tab = get().getTabById(tabId)
      if (!tab) return false
      // 固定的标签页需要确认关闭
      return !tab.isPinned || !tab.isDirty
    },
    
    getDirtyTabs: () => {
      const { tabs } = get()
      return tabs.filter(tab => tab.isDirty)
    },
    
    // 会话管理
    saveSession: () => {
      const { tabs, activeTabId } = get()
      const sessionData = {
        tabs: tabs.map(tab => ({
          documentId: tab.documentId,
          title: tab.title,
          isPinned: tab.isPinned,
          isActive: tab.isActive,
          createdAt: tab.createdAt.toISOString(),
        })),
        activeTabId,
        timestamp: new Date().toISOString(),
      }
      
      try {
        localStorage.setItem(TAB_SESSION_KEY, JSON.stringify(sessionData))
      } catch (error) {
        console.warn('Failed to save tab session:', error)
      }
    },
    
    loadSession: () => {
      try {
        const saved = localStorage.getItem(TAB_SESSION_KEY)
        if (!saved) return
        
        const sessionData = JSON.parse(saved)
        // 这里可以根据需要恢复会话
        // 实际实现中可能需要重新验证文档是否存在
        console.log('Loaded tab session:', sessionData)
      } catch (error) {
        console.warn('Failed to load tab session:', error)
      }
    },
    
    clearSession: () => {
      try {
        localStorage.removeItem(TAB_SESSION_KEY)
      } catch (error) {
        console.warn('Failed to clear tab session:', error)
      }
    },
    
    // 内部方法
    _generateTabId: generateTabId,
    
    _reorderTabs: () => {
      // 重新排序标签页（如果需要的话）
      const { tabs } = get()
      const reorderedTabs = [...tabs].sort((a, b) => {
        // 固定的标签页在前面
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        // 按创建时间排序
        return a.createdAt.getTime() - b.createdAt.getTime()
      })
      
      set({ tabs: reorderedTabs })
    },
    
    _enforceMaxTabs: () => {
      const { tabs, maxTabs } = get()
      if (tabs.length <= maxTabs) return
      
      // 关闭多余的标签页（优先关闭最旧的非固定非脏标签页）
      const closableTabs = tabs
        .filter(tab => !tab.isPinned && !tab.isDirty)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      
      const tabsToClose = closableTabs.slice(0, tabs.length - maxTabs)
      const remainingTabs = tabs.filter(tab => !tabsToClose.includes(tab))
      
      set({ tabs: remainingTabs })
    },
  }))
)

// 订阅标签页变化，自动保存会话
useTabStore.subscribe(
  (state) => ({ tabs: state.tabs, activeTabId: state.activeTabId }),
  () => {
    // 延迟保存，避免频繁写入
    setTimeout(() => {
      useTabStore.getState().saveSession()
    }, 1000)
  },
  { equalityFn: (a, b) => a.tabs.length === b.tabs.length && a.activeTabId === b.activeTabId }
) 