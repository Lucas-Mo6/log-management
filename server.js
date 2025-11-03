const express = require('express');
const { Client } = require('@opensearch-project/opensearch');
const path = require('path');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static('public')); // 静态文件目录

// OpenSearch客户端配置
const client = new Client({
    node: process.env.OPENSEARCH_NODE || config.opensearch.node,
    auth: {
        username: process.env.OPENSEARCH_USERNAME || config.opensearch.username,
        password: process.env.OPENSEARCH_PASSWORD || config.opensearch.password
    }
});

// 动态导入node-fetch
let fetch;
import('node-fetch').then(module => {
    fetch = module.default;
});

// 健康检查接口
app.get('/api/health', async (req, res) => {
    try {
        const health = await client.cluster.health();
        res.json({
            status: 'ok',
            opensearch: health.body
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 搜索日志API - 通过代理方式访问OpenSearch
app.post('/api/search-logs', async (req, res) => {
    try {
        // 等待fetch模块加载完成
        if (!fetch) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const {
            indexPattern,
            appName,
            searchTerm,
            timeRange,
            maxResults,
            startTime,
            endTime,
            logType
        } = req.body;

        // 构建查询DSL
        const query = {
            query: {
                bool: {
                    must: [],
                    must_not: []
                }
            },
            sort: [
                { "@timestamp": { order: "desc" } }
            ],
            size: parseInt(maxResults) || 50
        };

        // 添加应用名称条件
        if (appName && appName.trim() !== '') {
            query.query.bool.must.push({
                term: { "kubernetes.labels.app.keyword": appName }
            });
        }

        // 添加搜索词条件
        if (searchTerm && searchTerm.trim() !== '') {
            query.query.bool.must.push({
                match: { log: searchTerm }
            });
        }

        // 添加时间范围条件
        let timeFilter = {};
        if (timeRange === 'custom' && startTime && endTime) {
            timeFilter = {
                range: {
                    "@timestamp": {
                        gte: startTime,
                        lte: endTime
                    }
                }
            };
        } else {
            // 处理预设时间范围
            const now = new Date();
            let gteTime = new Date();

            switch (timeRange) {
                case '1h':
                    gteTime.setHours(now.getHours() - 1);
                    break;
                case '6h':
                    gteTime.setHours(now.getHours() - 6);
                    break;
                case '12h':
                    gteTime.setHours(now.getHours() - 12);
                    break;
                case '24h':
                    gteTime.setDate(now.getDate() - 1);
                    break;
                default:
                    gteTime.setHours(now.getHours() - 12); // 默认12小时
            }

            timeFilter = {
                range: {
                    "@timestamp": {
                        gte: gteTime.toISOString(),
                        lte: now.toISOString()
                    }
                }
            };
        }

        query.query.bool.must.push(timeFilter);

        // 根据日志类型添加过滤条件
        if (logType === 'mybatis') {
            // 只显示MyBatis日志
            query.query.bool.must.push({
                bool: {
                    should: [
                        { match_phrase: { log: "Preparing:" } },
                        { match_phrase: { log: "Parameters:" } },
                        { match_phrase: { log: "org.apache.ibatis" } },
                        { match_phrase: { log: "==>" } }
                    ],
                    minimum_should_match: 1
                }
            });
        } else if (logType === 'application') {
            // 排除MyBatis日志，只显示应用日志
            query.query.bool.must_not.push({
                bool: {
                    should: [
                        { match_phrase: { log: "Preparing:" } },
                        { match_phrase: { log: "Parameters:" } },
                        { match_phrase: { log: "org.apache.ibatis" } },
                        { match_phrase: { log: "==>" } }
                    ],
                    minimum_should_match: 1
                }
            });
        }

        // 打印请求参数日志
        console.log('\n============ OpenSearch 搜索请求 (/api/search-logs) ============');
        console.log('时间:', new Date().toISOString());
        console.log('索引模式:', indexPattern || "kube-*");
        console.log('应用名称:', appName || '(未指定)');
        console.log('搜索词:', searchTerm || '(未指定)');
        console.log('时间范围:', timeRange);
        console.log('日志类型:', logType || 'all');
        console.log('最大结果数:', maxResults);
        console.log('\n请求体 (Query DSL):');
        console.log(JSON.stringify(query, null, 2));
        console.log('================================================================\n');

        // 通过代理方式访问OpenSearch
        const opensearchUrl = `${config.opensearch.node}/api/console/proxy?path=${encodeURIComponent((indexPattern || "kube-*") + "/_search")}&method=POST`;

        const response = await fetch(opensearchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'osd-xsrf': 'opensearchDashboards',
                'Authorization': 'Basic ' + Buffer.from(config.opensearch.username + ':' + config.opensearch.password).toString('base64')
            },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            throw new Error(`OpenSearch请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        console.log('OpenSearch 响应成功, 命中数:', data.hits.total.value);

        // 返回结果
        res.json({
            hits: data.hits.hits,
            total: data.hits.total.value
        });
    } catch (error) {
        console.error('OpenSearch查询错误:', error);
        res.status(500).json({
            error: '查询失败',
            message: error.message
        });
    }
});

// 导出日志API
app.post('/api/export-logs', async (req, res) => {
    try {
        // 等待fetch模块加载完成
        if (!fetch) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const {
            indexPattern,
            appName,
            searchTerm,
            timeRange,
            format,
            startTime,
            endTime,
            logType
        } = req.body;

        // 构建查询DSL
        const query = {
            query: {
                bool: {
                    must: [],
                    must_not: []
                }
            },
            sort: [
                { "@timestamp": { order: "desc" } }
            ],
            size: 1000 // 导出时增加结果数量
        };

        // 添加应用名称条件
        if (appName && appName.trim() !== '') {
            query.query.bool.must.push({
                term: { "kubernetes.labels.app.keyword": appName }
            });
        }

        // 添加搜索词条件
        if (searchTerm && searchTerm.trim() !== '') {
            query.query.bool.must.push({
                match: { log: searchTerm }
            });
        }

        // 添加时间范围条件
        let timeFilter = {};
        if (timeRange === 'custom' && startTime && endTime) {
            timeFilter = {
                range: {
                    "@timestamp": {
                        gte: startTime,
                        lte: endTime
                    }
                }
            };
        } else {
            // 处理预设时间范围
            const now = new Date();
            let gteTime = new Date();

            switch (timeRange) {
                case '1h':
                    gteTime.setHours(now.getHours() - 1);
                    break;
                case '6h':
                    gteTime.setHours(now.getHours() - 6);
                    break;
                case '12h':
                    gteTime.setHours(now.getHours() - 12);
                    break;
                case '24h':
                    gteTime.setDate(now.getDate() - 1);
                    break;
                default:
                    gteTime.setHours(now.getHours() - 12); // 默认12小时
            }

            timeFilter = {
                range: {
                    "@timestamp": {
                        gte: gteTime.toISOString(),
                        lte: now.toISOString()
                    }
                }
            };
        }

        query.query.bool.must.push(timeFilter);

        // 根据日志类型添加过滤条件
        if (logType === 'mybatis') {
            // 只显示MyBatis日志
            query.query.bool.must.push({
                bool: {
                    should: [
                        { match_phrase: { log: "Preparing:" } },
                        { match_phrase: { log: "Parameters:" } },
                        { match_phrase: { log: "org.apache.ibatis" } },
                        { match_phrase: { log: "==>" } }
                    ],
                    minimum_should_match: 1
                }
            });
        } else if (logType === 'application') {
            // 排除MyBatis日志，只显示应用日志
            query.query.bool.must_not.push({
                bool: {
                    should: [
                        { match_phrase: { log: "Preparing:" } },
                        { match_phrase: { log: "Parameters:" } },
                        { match_phrase: { log: "org.apache.ibatis" } },
                        { match_phrase: { log: "==>" } }
                    ],
                    minimum_should_match: 1
                }
            });
        }

        // 通过代理方式访问OpenSearch
        const opensearchUrl = `${config.opensearch.node}/api/console/proxy?path=${encodeURIComponent((indexPattern || "kube-*") + "/_search")}&method=POST`;

        const response = await fetch(opensearchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'osd-xsrf': 'opensearchDashboards',
                'Authorization': 'Basic ' + Buffer.from(config.opensearch.username + ':' + config.opensearch.password).toString('base64')
            },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            throw new Error(`OpenSearch请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // 根据格式返回数据
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="logs.json"');
            res.json(data.hits.hits);
        } else {
            // 默认文本格式
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', 'attachment; filename="logs.txt"');

            let logText = '';
            data.hits.hits.forEach(hit => {
                const timestamp = hit._source['@timestamp'] || '';
                const logContent = hit._source.log || '';
                const namespace = hit._source.kubernetes?.namespace || '';
                const pod = hit._source.kubernetes?.pod?.name || '';

                logText += `[${timestamp}] [${namespace}/${pod}]: ${logContent}\n`;
            });

            res.send(logText);
        }
    } catch (error) {
        console.error('导出日志错误:', error);
        res.status(500).json({
            error: '导出失败',
            message: error.message
        });
    }
});

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`日志管理系统服务器运行在端口 ${PORT}`);
});