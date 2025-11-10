#!/bin/bash

# 宝塔面板快速部署脚本
# 使用方法: ./deploy.sh [环境] [端口]
# 环境参数: development, production (默认: production)
# 端口参数: 任意可用端口 (默认: 3000)

# 设置默认参数
ENV=${1:-production}
PORT=${2:-3000}
APP_NAME="log-management"
APP_DIR="/www/wwwroot/$APP_NAME"

echo "======================================"
echo "日志管理系统部署脚本"
echo "环境: $ENV"
echo "端口: $PORT"
echo "======================================"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
  echo "请使用root用户运行此脚本"
  exit 1
fi

# 创建应用目录
if [ ! -d "$APP_DIR" ]; then
  echo "创建应用目录: $APP_DIR"
  mkdir -p $APP_DIR
fi

# 进入应用目录
cd $APP_DIR

# 检查是否存在package.json
if [ ! -f "package.json" ]; then
  echo "错误: 未找到package.json文件，请确保项目文件已上传到$APP_DIR"
  exit 1
fi

# 安装依赖
echo "安装Node.js依赖..."
npm install --production

# 设置环境变量
export NODE_ENV=$ENV
export PORT=$PORT
export HOST=0.0.0.0

# 检查PM2是否已安装
if ! command -v pm2 &> /dev/null; then
  echo "安装PM2..."
  npm install -g pm2
fi

# 停止已存在的进程
if pm2 list | grep -q $APP_NAME; then
  echo "停止已存在的进程..."
  pm2 stop $APP_NAME
  pm2 delete $APP_NAME
fi

# 启动应用
echo "启动应用..."
pm2 start server.js --name $APP_NAME --env $ENV

# 保存PM2配置
pm2 save

# 设置PM2开机自启
pm2 startup

echo "======================================"
echo "部署完成!"
echo "应用名称: $APP_NAME"
echo "访问地址: http://服务器IP:$PORT"
echo "PM2管理: pm2 list"
echo "查看日志: pm2 logs $APP_NAME"
echo "重启应用: pm2 restart $APP_NAME"
echo "停止应用: pm2 stop $APP_NAME"
echo "======================================"