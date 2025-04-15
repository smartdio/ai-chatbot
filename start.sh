#!/bin/bash

# 默认配置
PORT=3000
DAEMON=false
PID_FILE="./.pid"

# 显示帮助信息
show_help() {
    echo "用法: ./start.sh [选项] [命令]"
    echo ""
    echo "命令:"
    echo "  start       启动应用"
    echo "  stop        停止应用"
    echo "  restart     重启应用"
    echo "  status      查看应用状态"
    echo ""
    echo "选项:"
    echo "  -p, --port PORT    指定端口号（默认: 3000）"
    echo "  -d, --daemon       以守护进程模式运行"
    echo "  -h, --help         显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./start.sh start -p 8080 -d    在端口 8080 以守护进程模式启动应用"
    echo "  ./start.sh stop                停止应用"
}

# 解析命令行参数
parse_args() {
    COMMAND=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            start|stop|restart|status)
                COMMAND="$1"
                shift
                ;;
            -p|--port)
                PORT="$2"
                shift 2
                ;;
            -d|--daemon)
                DAEMON=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo "错误: 未知选项 $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    if [ -z "$COMMAND" ]; then
        echo "错误: 缺少命令"
        show_help
        exit 1
    fi
}

# 启动应用
start_app() {
    echo "正在启动应用，端口: $PORT"
    
    # 检查应用是否已在运行
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") &>/dev/null; then
        echo "应用已在运行，PID: $(cat "$PID_FILE")"
        exit 1
    fi
    
    # 设置环境变量和启动命令
    export PORT=$PORT
    
    if [ "$DAEMON" = true ]; then
        echo "以守护进程模式启动"
        nohup pnpm start > ./logs/app.log 2>&1 &
        echo $! > "$PID_FILE"
        echo "应用已启动，PID: $!"
    else
        # 前台运行
        pnpm start
    fi
}

# 停止应用
stop_app() {
    if [ ! -f "$PID_FILE" ]; then
        echo "应用未运行"
        return 0
    fi
    
    PID=$(cat "$PID_FILE")
    if ! kill -0 $PID &>/dev/null; then
        echo "应用未运行（PID 文件过期）"
        rm -f "$PID_FILE"
        return 0
    fi
    
    echo "正在停止应用 (PID: $PID)..."
    kill $PID
    
    # 等待进程停止
    for i in {1..10}; do
        if ! kill -0 $PID &>/dev/null; then
            break
        fi
        sleep 1
    done
    
    # 如果进程仍在运行，强制终止
    if kill -0 $PID &>/dev/null; then
        echo "强制终止应用..."
        kill -9 $PID
    fi
    
    rm -f "$PID_FILE"
    echo "应用已停止"
}

# 检查应用状态
check_status() {
    if [ ! -f "$PID_FILE" ]; then
        echo "应用未运行"
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    if kill -0 $PID &>/dev/null; then
        echo "应用正在运行 (PID: $PID)"
        return 0
    else
        echo "应用未运行（PID 文件过期）"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 确保 logs 目录存在
ensure_logs_dir() {
    mkdir -p ./logs
}

# 主函数
main() {
    parse_args "$@"
    ensure_logs_dir
    
    case "$COMMAND" in
        start)
            start_app
            ;;
        stop)
            stop_app
            ;;
        restart)
            stop_app
            start_app
            ;;
        status)
            check_status
            ;;
        *)
            echo "错误: 未知命令 $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

main "$@" 