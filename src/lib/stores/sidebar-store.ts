import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

// 侧边栏状态接口
interface SidebarStore {
  // 侧边栏状态
  isOpen: boolean
  width: number
  isMobile: boolean
  
  // 搜索状态
  searchQuery: string
  searchHistory: string[]
  
  // 筛选状态
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'lastModified'
  sortOrder: 'asc' | 'desc'
  showFavorites: boolean
  showRecent: boolean
  
  // 操作方法
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  setSidebarWidth: (width: number) => void
  setMobileMode: (isMobile: boolean) => void
  
  // 搜索操作
  setSearchQuery: (query: string) => void
  addToSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  
  // 筛选操作
  setSortBy: (sortBy: SidebarStore['sortBy']) => void
  setSortOrder: (order: SidebarStore['sortOrder']) => void
  toggleSortOrder: () => void
  setShowFavorites: (show: boolean) => void
  setShowRecent: (show: boolean) => void
  
  // 重置方法
  resetFilters: () => void
  resetSearch: () => void
}

// 默认配置
const DEFAULT_WIDTH = 280
const MIN_WIDTH = 200
const MAX_WIDTH = 400
const MAX_SEARCH_HISTORY = 10

export const useSidebarStore = create<SidebarStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        isOpen: true,
        width: DEFAULT_WIDTH,
        isMobile: false,
        
        // 搜索状态
        searchQuery: '',
        searchHistory: [],
        
        // 筛选状态
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        showFavorites: false,
        showRecent: true,
        
        // 操作方法
        toggleSidebar: () => {
          set(state => ({ isOpen: !state.isOpen }))
        },
        
        setSidebarOpen: (isOpen: boolean) => {
          set({ isOpen })
        },
        
        setSidebarWidth: (width: number) => {
          // 限制宽度范围
          const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
          set({ width: clampedWidth })
        },
        
        setMobileMode: (isMobile: boolean) => {
          set({ isMobile })
          // 移动端默认关闭侧边栏
          if (isMobile) {
            set({ isOpen: false })
          }
        },
        
        // 搜索操作
        setSearchQuery: (query: string) => {
          set({ searchQuery: query })
        },
        
        addToSearchHistory: (query: string) => {
          if (!query.trim()) return
          
          const { searchHistory } = get()
          const trimmedQuery = query.trim()
          
          // 去重并添加到历史记录前面
          const newHistory = [
            trimmedQuery,
            ...searchHistory.filter(item => item !== trimmedQuery)
          ].slice(0, MAX_SEARCH_HISTORY)
          
          set({ searchHistory: newHistory })
        },
        
        clearSearchHistory: () => {
          set({ searchHistory: [] })
        },
        
        // 筛选操作
        setSortBy: (sortBy: SidebarStore['sortBy']) => {
          set({ sortBy })
        },
        
        setSortOrder: (sortOrder: SidebarStore['sortOrder']) => {
          set({ sortOrder })
        },
        
        toggleSortOrder: () => {
          set(state => ({
            sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc'
          }))
        },
        
        setShowFavorites: (showFavorites: boolean) => {
          set({ showFavorites })
        },
        
        setShowRecent: (showRecent: boolean) => {
          set({ showRecent })
        },
        
        // 重置方法
        resetFilters: () => {
          set({
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            showFavorites: false,
            showRecent: true,
          })
        },
        
        resetSearch: () => {
          set({ searchQuery: '' })
        },
      }),
      {
        name: 'sidebar-store',
        partialize: (state) => ({
          // 只持久化这些状态
          isOpen: state.isOpen,
          width: state.width,
          searchHistory: state.searchHistory,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          showFavorites: state.showFavorites,
          showRecent: state.showRecent,
        }),
      }
    ),
    {
      name: 'sidebar-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

// 导出常量
export { DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH } 