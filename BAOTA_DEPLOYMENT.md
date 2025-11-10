# 宝塔面板部署指南

## 项目概述
这是一个基于 OpenSearch 的日志管理系统，包含前端（HTML/CSS/JS）和后端（Node.js/Express）。

## 部署前准备

### 1. 宝塔面板环境要求
- 操作系统：Linux（推荐CentOS 7+或Ubuntu 18+）
- 宝塔面板版本：7.7+
- 内存：至少1GB
- 硬盘：至少5GB

### 2. 安装必要软件
在宝塔面板中安装以下软件：
- **Node.js管理器**：安装Node.js 16+版本
- **Nginx**：用于反向代理和静态文件服务
- **PM2管理器**：用于管理Node.js进程（可选，但推荐）

## 部署步骤

### 第一步：上传项目文件

1. 在宝塔面板中进入"文件"管理
2. 选择一个合适的目录，例如 `/www/wwwroot/log-management`
3. 将项目文件上传到此目录
4. 解压文件（如果上传的是压缩包）

### 第二步：安装项目依赖

1. 在宝塔面板中打开"终端"
2. 进入项目目录：
   ```bash
   cd /www/wwwroot/log-management
   ```
3. 安装Node.js依赖：
   ```bash
   npm install --production
   ```

### 第三步：配置环境变量

1. 创建环境配置文件：
   ```bash
   cp config.js config.production.js
   ```
2. 编辑 `config.production.js`，修改生产环境配置：
   ```javascript
   module.exports = {
       opensearch: {
           node: 'https://your-opensearch-domain.com',
           username: 'your-username',
           password: 'your-password'
       }
   };
   ```

### 第四步：启动后端服务

#### 方法一：使用PM2（推荐）

1. 在宝塔面板中安装"PM2管理器"
2. 在PM2管理器中添加项目：
   - 项目名称：log-management
   - 启动文件：/www/wwwroot/log-management/server.js
   - 项目目录：/www/wwwroot/log-management
3. 点击"提交并启动"

#### 方法二：使用命令行

1. 在终端中运行：
   ```bash
   cd /www/wwwroot/log-management
   pm2 start server.js --name "log-management"
   pm2 save
   pm2 startup
   ```

### 第五步：配置Nginx反向代理

1. 在宝塔面板中创建新站点：
   - 域名：your-domain.com
   - 根目录：/www/wwwroot/log-management/public
   - PHP版本：纯静态

2. 编辑站点配置文件：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       index index.html;
       root /www/wwwroot/log-management/public;
       
       # 前端静态文件
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # API代理到后端Node.js服务
       location /api/ {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. 重载Nginx配置

### 第六步：配置SSL证书（可选）

1. 在宝塔面板中进入"SSL"管理
2. 选择你的站点
3. 申请Let's Encrypt免费证书或上传已有证书
4. 开启"强制HTTPS"

### 第七步：配置防火墙

1. 在宝塔面板中进入"安全"设置
2. 确保以下端口已开放：
   - 80（HTTP）
   - 443（HTTPS）
   - 3000（Node.js应用，如果需要直接访问）

## 常见问题解决

### 1. 端口冲突
如果3000端口被占用，可以修改 `server.js` 中的端口：
```javascript
const PORT = process.env.PORT || 3001; // 改为其他端口
```

### 2. 权限问题
确保项目目录权限正确：
```bash
chown -R www:www /www/wwwroot/log-management
chmod -R 755 /www/wwwroot/log-management
```

### 3. OpenSearch连接问题
- 检查OpenSearch服务是否正常运行
- 确认网络连接是否通畅
- 验证用户名和密码是否正确

## 监控与维护

### 1. 查看应用日志
- PM2日志：在PM2管理器中查看
- Nginx日志：在宝塔面板"网站"->"日志"中查看
- 应用日志：`/www/wwwroot/log-management/logs/`目录

### 2. 自动部署脚本
创建一个简单的部署脚本 `deploy.sh`：
```bash
#!/bin/bash
cd /www/wwwroot/log-management
git pull origin main
npm install --production
pm2 restart log-management
echo "部署完成！"
```

### 3. 定期备份
在宝塔面板中设置定期备份：
- 备份网站文件
- 备份数据库（如果有）

## 性能优化建议

1. **启用Gzip压缩**：在Nginx配置中启用
2. **设置缓存头**：为静态资源设置长期缓存
3. **使用CDN**：为静态资源使用CDN加速
4. **优化Node.js**：使用集群模式或增加实例数量

## 安全建议

1. **定期更新**：保持Node.js和系统组件最新
2. **限制访问**：使用防火墙限制不必要的端口访问
3. **强密码**：为所有服务使用强密码
4. **监控日志**：定期检查异常访问日志

## 联系支持

如果在部署过程中遇到问题，可以：
1. 查看宝塔面板官方文档
2. 搜索相关错误信息
3. 在社区论坛寻求帮助