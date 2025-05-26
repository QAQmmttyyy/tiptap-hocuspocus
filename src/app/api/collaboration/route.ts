import {
  startHocuspocusServer,
  stopHocuspocusServer,
  getServerStatus,
} from "@/lib/hocuspocus-server";

// 启动服务器的API端点
export async function POST() {
  try {
    const success = await startHocuspocusServer();

    if (success) {
      return Response.json({
        success: true,
        message: "Hocuspocus服务器运行中",
        ...getServerStatus(),
      });
    } else {
      return Response.json(
        {
          success: false,
          error: "服务器启动失败",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("启动Hocuspocus服务器失败:", error);
    return Response.json(
      {
        success: false,
        error: "服务器启动失败",
      },
      { status: 500 }
    );
  }
}

// 获取服务器状态
export async function GET() {
  return Response.json(getServerStatus());
}

// 停止服务器
export async function DELETE() {
  try {
    stopHocuspocusServer();
    return Response.json({
      success: true,
      message: "服务器已停止",
    });
  } catch (error) {
    console.error("停止Hocuspocus服务器失败:", error);
    return Response.json(
      {
        success: false,
        error: "停止服务器失败",
      },
      { status: 500 }
    );
  }
}
