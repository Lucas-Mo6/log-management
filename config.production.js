// 生产环境配置
module.exports = {
    opensearch: {
        node: process.env.OPENSEARCH_NODE || 'https://opensearch-dashboards.qcore-preprod.qima.com',
        username: process.env.OPENSEARCH_USERNAME || 'readall',
        password: process.env.OPENSEARCH_PASSWORD || 'YHmtL2Nq6wsYydee3B1zcfD9nalZx9x'
    },
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0' // 监听所有网络接口
    }
};