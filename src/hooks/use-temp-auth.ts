import { useState, useEffect } from 'react'
import type { User } from '@/lib/api-client'

// 临时用户数据（演示用）
const DEMO_USERS: User[] = [
  {
    id: 'demo_user_001',
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: '/avatars/demo-user-1.png',
    color: '#3b82f6',
  },
  {
    id: 'demo_user_002', 
    name: '李四',
    email: 'lisi@example.com',
    avatar: '/avatars/demo-user-2.png',
    color: '#ef4444',
  },
  {
    id: 'demo_user_003',
    name: '王五',
    email: 'wangwu@example.com', 
    avatar: '/avatars/demo-user-3.png',
    color: '#10b981',
  },
]

// 认证状态接口
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// 认证操作接口
interface AuthActions {
  login: (userIndex?: number) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<{ success: boolean }>
  switchUser: (userIndex: number) => void
  clearError: () => void
}

// 会话存储键
const AUTH_SESSION_KEY = 'temp_auth_session'

// 临时认证hook
export function useTempAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  // 从sessionStorage恢复认证状态
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_SESSION_KEY)
      if (saved) {
        const { user } = JSON.parse(saved)
        setState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
        })
      } else {
        // 默认自动登录第一个演示用户
        setTimeout(() => {
          login(0)
        }, 500)
      }
    } catch (error) {
      console.warn('Failed to restore auth session:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  // 保存认证状态到sessionStorage
  const saveSession = (user: User | null) => {
    try {
      if (user) {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ user }))
      } else {
        sessionStorage.removeItem(AUTH_SESSION_KEY)
      }
    } catch (error) {
      console.warn('Failed to save auth session:', error)
    }
  }

  // 登录方法
  const login = async (userIndex = 0): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const user = DEMO_USERS[userIndex] || DEMO_USERS[0]
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
      
      saveSession(user)
      
      return { success: true }
    } catch (error) {
      const errorMessage = '登录失败，请重试'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      
      return { success: false, error: errorMessage }
    }
  }

  // 登出方法
  const logout = async (): Promise<{ success: boolean }> => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 200))
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
      
      saveSession(null)
      
      return { success: true }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return { success: true } // 登出总是成功
    }
  }

  // 切换用户
  const switchUser = (userIndex: number) => {
    if (userIndex >= 0 && userIndex < DEMO_USERS.length) {
      login(userIndex)
    }
  }

  // 清除错误
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return {
    ...state,
    login,
    logout,
    switchUser,
    clearError,
  }
}

// 导出演示用户数据（用于UI选择）
export { DEMO_USERS }

// 生成随机协作者列表（用于演示）
export function generateRandomCollaborators(count = 2): User[] {
  const shuffled = [...DEMO_USERS].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// 获取用户头像URL（处理默认头像）
export function getUserAvatarUrl(user: User): string {
  if (user.avatar && !user.avatar.startsWith('/avatars/')) {
    return user.avatar
  }
  
  // 为演示用户生成默认头像
  const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500']
  const colorClass = colors[user.id.charCodeAt(user.id.length - 1) % colors.length]
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <rect width="40" height="40" fill="${user.color || '#3b82f6'}" rx="20"/>
      <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">
        ${user.name.charAt(0)}
      </text>
    </svg>
  `)}`
} 