#!/bin/bash

# 默认配置
PORT=${PORT:-3000}
DAEMON=false
PID_FILE="./.pid"
LOGS_DIR="./logs"
LOG_FILE="${LOGS_DIR}/app.log"

# 显示帮助信息
show_help() {
    echo "用法: ./start.sh [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  start       启动应用"
    echo "  stop        停止应用"
    echo "  restart     重启应用"
    echo "  status      查看应用状态"
    echo ""
    echo "选项:"
    echo "  -p, --port PORT    指定端口号 (默认: ${PORT})。在 Docker 中运行时，此选项可能被 Dockerfile 中的 ENV PORT 覆盖。"
    echo "  -d, --daemon       以守护进程模式运行 (非 Docker 环境)"
    echo "  -h, --help         显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./start.sh start -p 8080 -d    # 本地以守护进程模式在端口 8080 启动"
    echo "  ./start.sh stop                # 本地停止应用"
    echo "  ./start.sh status              # 本地查看应用状态"
    echo "  (在 Docker 中，通常由 Dockerfile CMD 调用 './start.sh start')"
}

# 解析命令行参数
parse_args() {
    COMMAND=""
    # 处理参数，将选项放在命令之后
    TEMP_ARGS=()
    while [[ $# -gt 0 ]]; do
        case "$1" in
            start|stop|restart|status)
                if [ -n "$COMMAND" ]; then
                    TEMP_ARGS+=("$1") # 如果命令已存在，则视为普通参数
                else
                    COMMAND="$1"
                fi
                shift
                ;;
            *)
                TEMP_ARGS+=("$1")
                shift
                ;;
        esac
    done
    set -- "${TEMP_ARGS[@]}" # 将非命令参数放回

    # 解析选项
    while [[ $# -gt 0 ]]; do
        case "$1" in
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
                echo "错误: 未知选项或参数 '$1'"
                show_help
                exit 1
                ;;
        esac
    done

    if [ -z "$COMMAND" ] && [[ "${TEMP_ARGS[0]}" != "start" && "${TEMP_ARGS[0]}" != "stop" && "${TEMP_ARGS[0]}" != "restart" && "${TEMP_ARGS[0]}" != "status" ]]; then
         # 如果没有命令，并且第一个参数不是可识别的命令（针对 docker/start.sh start）
        if [ -n "${TEMP_ARGS[0]}" ]; then # Dockerfile 可能会直接调用 ./start.sh start
             COMMAND=${TEMP_ARGS[0]}
        fi 
    fi

    if [ -z "$COMMAND" ]; then
        echo "错误: 缺少命令 (start, stop, restart, status)"
        show_help
        exit 1
    fi
}

# 确保 logs 目录存在 (仅守护进程模式需要)
ensure_logs_dir() {
    if [ "$DAEMON" = true ]; then
        mkdir -p "$LOGS_DIR"
    fi
}

# 启动应用
start_app() {
    ensure_logs_dir
    echo "正在启动应用，端口: $PORT"

    if [ "$DAEMON" = true ]; then
        if [ "$RUNNING_IN_DOCKER" = "true" ]; then
            echo "警告: 在 Docker 环境中不推荐使用守护进程模式。将以前台模式启动。"
            echo "运行: exec pnpm start"
            exec pnpm start # Docker 中总是前台执行
        else
            if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") &>/dev/null; then
                echo "应用已在运行 (PID: $(cat "$PID_FILE"))"
                exit 1
            fi
            echo "以守护进程模式启动，日志文件: ${LOG_FILE}"
            # 设置 PORT 环境变量给 pnpm start
            PORT=$PORT nohup pnpm start > "$LOG_FILE" 2>&1 &
            echo $! > "$PID_FILE"
            echo "应用已启动 (PID: $!), 端口: $PORT"
        fi
    else # 非守护进程模式
        if [ "$RUNNING_IN_DOCKER" = "true" ]; then
            echo "在 Docker 环境中以前台模式 (exec) 启动..."
            # 设置 PORT 环境变量给 pnpm start (Next.js 通常会自动读取 ENV PORT)
            exec pnpm start
        else
            echo "在本地以前台模式启动..."
            # 设置 PORT 环境变量给 pnpm start
            PORT=$PORT pnpm start
        fi
    fi
}

# 停止应用
stop_app() {
    if [ ! -f "$PID_FILE" ]; then
        echo "错误: PID 文件 ($PID_FILE) 未找到。应用可能未以守护进程模式启动或已停止。"
        # 尝试通过进程名查找并杀死，作为备用方案 (需要 pgrep 和 pkill)
        # PIDS=$(pgrep -f "pnpm start") # 这可能不够精确
        # if [ -n "$PIDS" ]; then
        #    echo "尝试根据进程名停止应用..."
        #    kill $PIDS
        # else
        #    echo "应用未运行。"
        # fi
        return 1
    fi

    PID=$(cat "$PID_FILE")
    echo "正在停止应用 (PID: $PID)..."
    if kill $PID &>/dev/null; then
        # 等待进程停止
        for i in {1..10}; do
            if ! kill -0 $PID &>/dev/null; then
                rm -f "$PID_FILE"
                echo "应用已停止。"
                return 0
            fi
            sleep 1
        done
        echo "应用未能优雅停止，尝试强制终止 (kill -9 $PID)..."
        kill -9 $PID &>/dev/null
    fi
    rm -f "$PID_FILE"
    echo "应用已停止 (可能被强制)。"
}

# 检查应用状态
check_status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 $PID &>/dev/null; then
            echo "应用正在运行 (PID: $PID)"
            return 0
        else
            echo "应用未运行 (PID 文件 $PID_FILE 过期)"
            rm -f "$PID_FILE"
            return 1
        fi
    else
        echo "应用未以守护进程模式运行或已停止 (PID 文件 $PID_FILE 未找到)"
        # 可以尝试用 pgrep 检查，但不作为主要逻辑
        # if pgrep -f "pnpm start" > /dev/null; then
        #    echo "但似乎有 pnpm start 进程在运行。"
        # fi
        return 1
    fi
}

# 主函数
main() {
    # Dockerfile CMD 会是 ./start.sh start, COMMAND 会被设置为 start
    # 选项如 -p PORT 可以在 Dockerfile CMD 中指定，或者通过环境变量
    parse_args "$@"

    case "$COMMAND" in
        start)
            start_app
            ;;
        stop)
            if [ "$RUNNING_IN_DOCKER" = "true" ]; then
                echo "在 Docker 中，请使用 'docker stop <container_id>' 来停止容器。"
                exit 1
            fi
            stop_app
            ;;
        restart)
            if [ "$RUNNING_IN_DOCKER" = "true" ]; then
                echo "在 Docker 中，请使用 'docker restart <container_id>' 来重启容器。"
                exit 1
            fi
            stop_app
            # 等待片刻确保端口释放
            sleep 2 
            start_app
            ;;
        status)
             if [ "$RUNNING_IN_DOCKER" = "true" ]; then
                echo "在 Docker 中，请使用 'docker ps' 和 'docker logs <container_id>' 查看状态。"
                # 或者可以尝试查询容器内的 Node.js 进程，但这比较复杂
                exit 1
            fi
            check_status
            ;;
        *)
            echo "错误: 未知命令 '$COMMAND'"
            show_help
            exit 1
            ;;
    esac
}

main "$@" 