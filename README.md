# OpenSearch 日志管理系统

一个基于 OpenSearch 的美观日志管理系统，具有响应式界面和强大的搜索功能。

## 功能特点

1. **美观的界面设计**
   - 响应式布局，适配不同屏幕尺寸
   - 清晰的视觉层次和色彩编码
   - 日志级别通过颜色区分（信息、警告、错误）

2. **灵活的搜索功能**
   - 支持索引模式选择
   - 按应用名称过滤
   - 关键词搜索
   - 时间范围选择（预设和自定义）
   - 结果数量控制

3. **日志导出功能**
   - 支持导出为 TXT 或 JSON 格式

4. **系统监控**
   - OpenSearch 集群健康检查

## 系统架构

```
前端界面(HTML/CSS/JS) ↔ 后端API(Node.js/Express) ↔ OpenSearch集群
```

## 快速开始

### 环境要求

- Node.js >= 14.0.0
- OpenSearch 集群

### 安装步骤

1. 克隆项目代码：
   ```
   git clone <repository-url>
   cd Log_management2
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 配置 OpenSearch 连接信息：
   ```
   cp config.example.js config.js
   ```
   编辑 `config.js` 文件，填入你的 OpenSearch 集群信息

4. 设置环境变量（可选）：
   ```bash
   export OPENSEARCH_NODE=https://your-opensearch-domain.com
   export OPENSEARCH_USERNAME=your-username
   export OPENSEARCH_PASSWORD=your-password
   ```

5. 启动服务：
   ```
   # 生产环境
   npm start
   
   # 开发环境（需要先安装 nodemon: npm install -g nodemon）
   npm run dev
   ```

6. 访问系统：
   ```
   http://localhost:3000
   ```

## API 接口

### 搜索日志
- **URL**: `/api/search-logs`
- **方法**: `POST`
- **参数**:
  - `indexPattern`: 索引模式（默认: "kube.*"）
  - `appName`: 应用名称
  - `searchTerm`: 搜索关键词
  - `timeRange`: 时间范围 ("1h", "6h", "12h", "24h", "custom")
  - `maxResults`: 最大结果数
  - `startTime`: 自定义开始时间（当 timeRange 为 "custom" 时必需）
  - `endTime`: 自定义结束时间（当 timeRange 为 "custom" 时必需）

### 导出日志
- **URL**: `/api/export-logs`
- **方法**: `POST`
- **参数**: 与搜索日志相同，额外增加：
  - `format`: 导出格式 ("txt", "json")

### 健康检查
- **URL**: `/api/health`
- **方法**: `GET`

## 目录结构

```
.
├── public/              # 静态文件目录
│   └── index.html       # 前端界面
├── config.js            # 配置文件
├── config.example.js    # 配置示例文件
├── server.js            # 后端主文件
├── package.json         # 项目依赖和脚本
└── README.md            # 项目说明文档
```

## 技术栈

- 前端：HTML5, CSS3, JavaScript (ES6+)
- 后端：Node.js, Express
- 搜索引擎：OpenSearch
- 客户端：@opensearch-project/opensearch

## 许可证

MIT