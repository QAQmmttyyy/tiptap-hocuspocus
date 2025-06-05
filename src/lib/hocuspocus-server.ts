import { Server } from "@hocuspocus/server";
import { exec } from "child_process";
import { promisify } from "util";
import * as Y from "yjs";
import { TiptapTransformer } from "@hocuspocus/transformer";
import { db } from "./db";

const execAsync = promisify(exec);

let hocuspocusServer: Server | null = null;
let connectionCount = 0;

// 临时用户ID，用于测试（跳过认证）
const TEMP_USER_ID = "temp_user_001"; // 张三

// 清理端口函数
async function clearPort(port: number) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    if (stdout.trim()) {
      const pids = stdout.trim().split("\n");
      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid}`);
          console.log(`已终止占用端口${port}的进程: ${pid}`);
        } catch {
          // 忽略kill失败的错误，可能进程已经结束
        }
      }
    }
  } catch {
    // 没有进程占用端口，这是正常情况
  }
}

// 生成用户颜色
function generateUserColor(userId: string): string {
  const colors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];
  const hash = userId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
}

// 检查文档权限
async function checkDocumentPermission(
  userId: string,
  documentId: string
): Promise<boolean> {
  try {
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { authorId: userId }, // 我创建的文档
          { collaborators: { some: { userId } } }, // 我参与的文档
          { isPublic: true }, // 公开文档
        ],
      },
    });

    return !!document;
  } catch (error) {
    console.error("❌ 检查文档权限失败:", error);
    return false;
  }
}

export function getHocuspocusServer() {
  if (hocuspocusServer) {
    return hocuspocusServer;
  }

  hocuspocusServer = new Server({
    port: 1234,
    address: "0.0.0.0",
    name: "enhanced-hocuspocus-server",

    // 🔧 实时持久化：从数据库加载已存在的文档
    async onLoadDocument(data) {
      console.log(`📖 加载文档: ${data.documentName}`);

      const document = await db.document.findUnique({
        where: { id: data.documentName },
        select: {
          content: true,
          title: true,
          version: true,
          authorId: true,
        },
      });

      if (document?.content) {
        console.log(
          `✅ 文档加载成功: ${document.title} (v${document.version})`
        );

        Y.applyUpdate(data.document, document.content);
        console.log(
          "document.content",
          TiptapTransformer.fromYdoc(data.document)
        );

        // 将 Buffer 转换为 Uint8Array
        // const contentBuffer = document.content
        // return new Uint8Array(contentBuffer)
      } else if (document && !document.content) {
        console.log(`📝 文档存在但无内容，空白文档: ${document.title}`);
      } else {
        console.log(`❌ 文档不存在: ${data.documentName}`);
      }
    },

    // 🔧 实时持久化：只保存已存在的文档内容
    async onStoreDocument(data) {
      const update = Y.encodeStateAsUpdate(data.document);
      const now = new Date();

      console.log(
        `💾 保存文档: ${data.documentName} (${
          update.length
        } bytes) ${now.toLocaleTimeString()}`
      );

      // 只更新已存在的文档，不创建新文档
      const updateResult = await db.document.updateMany({
        where: { id: data.documentName },
        data: {
          content: Buffer.from(update),
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        console.error(`❌ 文档不存在，无法保存: ${data.documentName}`);
        throw new Error(
          `文档不存在，请先通过API创建文档: ${data.documentName}`
        );
      }

      console.log(
        `✅ 文档内容保存成功: ${data.documentName} (更新了${updateResult.count}个文档)`
      );
    },

    // 🔧 连接管理
    async onConnect(data) {
      connectionCount++;
      console.log(
        `👤 用户连接: ${data.socketId} -> 文档: ${data.documentName}，当前连接数: ${connectionCount}`
      );

      // 检查文档权限（简化版）
      if (data.documentName && data.documentName !== "undefined") {
        const hasPermission = await checkDocumentPermission(
          TEMP_USER_ID,
          data.documentName
        );
        if (!hasPermission) {
          console.warn(
            `⚠️ 用户 ${TEMP_USER_ID} 对文档 ${data.documentName} 无权限，但允许访问（测试阶段）`
          );
          // 在测试阶段允许访问，生产环境应该断开连接
        }
      }
    },

    async onDisconnect(data) {
      if (connectionCount > 0) {
        connectionCount--;
      }
      console.log(
        `👋 用户断开连接: ${data.socketId}，当前连接数: ${connectionCount}`
      );
    },

    // 🔧 用户认证（简化版，无实际认证）
    async onAuthenticate() {
      return {
        user: {
          id: TEMP_USER_ID,
          name: "张三",
          color: generateUserColor(TEMP_USER_ID),
          avatar: "👨‍💻",
        },
      };
    },

    // 🔧 自动保存策略配置
    debounce: 2000, // 2秒防抖
    maxDebounce: 30000, // 30秒强制保存
  });

  return hocuspocusServer;
}

export async function startHocuspocusServer() {
  // 先清理端口
  await clearPort(1234);

  const server = getHocuspocusServer();

  if (server) {
    try {
      await server.listen();
      console.log("🚀 Hocuspocus服务器已启动在端口 1234");
      return true;
    } catch (error) {
      console.error("❌ 启动Hocuspocus服务器失败:", error);
      return false;
    }
  }

  return true;
}

export function stopHocuspocusServer() {
  if (hocuspocusServer) {
    hocuspocusServer.destroy();
    hocuspocusServer = null;
    connectionCount = 0; // 重置连接数
    console.log("🛑 Hocuspocus服务器已停止");
  }
}

export function getServerStatus() {
  return {
    running: hocuspocusServer ? true : false,
    port: 1234,
    connections:
      hocuspocusServer?.hocuspocus.getConnectionsCount() ?? connectionCount,
  };
}
