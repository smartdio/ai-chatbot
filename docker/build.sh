#!/bin/bash

# 检查是否在项目根目录运行 (通过检查 package.json 是否存在)
if [ ! -f "package.json" ]; then
  echo "错误：请在项目根目录下运行此脚本 (例如: ./docker/build.sh)"
  exit 1
fi

# 脚本用于构建 Docker 镜像
# 在项目根目录下运行此脚本: ./docker/build.sh

# 从 package.json 获取项目名称 (如果失败则使用默认名称)
# 使用更兼容的 sed (适用于 macOS 和 Linux)
APP_NAME=$(sed -n 's/.*"name":[[:space:]]*"\([^" ]*\)".*/\1/p' package.json)
if [ -z "$APP_NAME" ]; then APP_NAME="ai-chatbot"; fi

# 获取版本号 (可选, 如果失败则使用 'latest')
# 使用 sed
APP_VERSION=$(sed -n 's/.*"version":[[:space:]]*"\([^" ]*\)".*/\1/p' package.json)
if [ -z "$APP_VERSION" ]; then APP_VERSION="latest"; fi


IMAGE_TAG="${APP_NAME}:${APP_VERSION}"
LATEST_TAG="${APP_NAME}:latest" # 始终标记 latest

# 目标平台 (常见的 Linux 服务器架构)
PLATFORM="linux/amd64"

echo "构建镜像: $IMAGE_TAG (平台: $PLATFORM)"

# -f 指定 Dockerfile 路径
# --platform 指定目标平台
# -t 指定镜像标签
# . 指定构建上下文为当前目录 (项目根目录)
docker buildx build --platform $PLATFORM -f docker/Dockerfile -t $IMAGE_TAG -t $LATEST_TAG . --load

# --load 参数是为了直接将构建好的镜像加载到本地 Docker 守护进程中
# 如果你使用远程构建器或者只是想构建多平台镜像而不立即加载，可以去掉 --load

echo "镜像构建完成: $IMAGE_TAG 和 $LATEST_TAG" 