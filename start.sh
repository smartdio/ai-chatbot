#!/bin/bash

# 默认配置 (可以由 Docker 环境变量覆盖)
PORT=${PORT:-3000}

# 显示帮助信息
show_help() {
    echo "用法: ./start.sh [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  start       启动应用 (主要用于 Docker CMD)"
    echo ""
    echo "选项:"
    # echo "  -p, --port PORT    指定端口号 (推荐使用 PORT 环境变量)" # 保留或移除皆可
    echo "  -h, --help         显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./start.sh start"
    echo "  PORT=8080 ./start.sh start"
}

# 解析命令行参数 (简化版)
parse_args() {
    COMMAND=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            start)
                COMMAND="start"
                shift
                ;;
            # 可选: 如果仍想支持命令行端口覆盖
            # -p|--port)
            #     PORT="$2"
            #     shift 2
            #     ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                # 在 Docker CMD 中，通常不期待未知参数
                # echo "错误: 未知选项 $1"
                # show_help
                # exit 1
                # 或者直接忽略未知参数
                shift
                ;;
        esac
    done

    if [ "$COMMAND" != "start" ]; then
        echo "错误: 需要 'start' 命令"
        show_help
        exit 1
    fi
}

# 启动应用 (Docker 优化版)
start_app() {
    echo "正在启动应用，端口: $PORT"
    # 确保 PORT 环境变量生效 (pnpm start/Next.js 通常会自动读取)
    # export PORT=$PORT # 通常不需要显式导出，除非 Next.js 配置特殊

    echo "运行: exec pnpm start"
    # 使用 exec 替换当前 shell 进程
    exec pnpm start
}


# 主函数 (简化版)
main() {
    parse_args "$@"

    if [ "$COMMAND" = "start" ]; then
        start_app
    else
        #理论上 parse_args 已经处理了非 start 的情况
        echo "内部错误"
        exit 1
    fi
}

main "$@" 