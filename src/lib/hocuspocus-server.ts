import { Server } from '@hocuspocus/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let hocuspocusServer: Server | null = null
let connectionCount = 0

// 清理端口函数
async function clearPort(port: number) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`)
    if (stdout.trim()) {
      const pids = stdout.trim().split('\n')
      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid}`)
          console.log(`已终止占用端口${port}的进程: ${pid}`)
        } catch {
          // 忽略kill失败的错误，可能进程已经结束
        }
      }
    }
  } catch {
    // 没有进程占用端口，这是正常情况
  }
}

export function getHocuspocusServer() {
  if (hocuspocusServer) {
    return hocuspocusServer
  }

  hocuspocusServer = new Server({
    port: 1234,
    name: 'hocuspocus-server',
    async onConnect(data) {
      connectionCount++
      console.log(`用户连接: ${data.socketId}，当前连接数: ${connectionCount}`)
    },

    async onDisconnect(data) {
      if (connectionCount > 0) {
        connectionCount--
      }
      console.log(`用户断开连接: ${data.socketId}，当前连接数: ${connectionCount}`)
    },

    async onLoadDocument(data) {
      console.log(`加载文档: ${data.documentName}`)
      // 这里可以从数据库加载文档内容
      // 目前返回空文档
      return null
    },

    async onStoreDocument(data) {
      console.log(`保存文档: ${data.documentName}`)
      // 这里可以将文档保存到数据库
      // 目前只是打印日志
    },

    async onAuthenticate(data) {
      // 简单的认证，实际项目中应该验证token
      return {
        user: {
          id: data.socketId,
          name: `用户${Math.floor(Math.random() * 1000)}`,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        }
      }
    }
  })

  return hocuspocusServer
}

export async function startHocuspocusServer() {
  // 先清理端口
  await clearPort(1234)
  
  const server = getHocuspocusServer()
  
  if (server) {
    try {
      await server.listen()
      console.log('🚀 Hocuspocus服务器已启动在端口 1234')
      return true
    } catch (error) {
      console.error('❌ 启动Hocuspocus服务器失败:', error)
      return false
    }
  }
  
  return true
}

export function stopHocuspocusServer() {
  if (hocuspocusServer) {
    hocuspocusServer.destroy()
    hocuspocusServer = null
    connectionCount = 0 // 重置连接数
    console.log('🛑 Hocuspocus服务器已停止')
  }
}

export function getServerStatus() {
  return {
    running: hocuspocusServer ? true : false,
    port: 1234,
    connections: hocuspocusServer?.hocuspocus.getConnectionsCount() ?? connectionCount
  }
} 