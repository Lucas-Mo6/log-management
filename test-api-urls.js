// 测试API URLs

// 1. 健康检查
// GET http://localhost:3000/api/health

// 2. 搜索日志
// POST http://localhost:3000/api/search-logs
// Content-Type: application/json
/*
{
  "indexPattern": "kube-*",
  "appName": "lab-service-cloud",
  "searchTerm": "error",
  "timeRange": "12h",
  "maxResults": "50"
}
*/

// 3. 导出日志为TXT格式
// POST http://localhost:3000/api/export-logs
// Content-Type: application/json
/*
{
  "indexPattern": "kube-*",
  "appName": "lab-service-cloud",
  "searchTerm": "error",
  "timeRange": "12h",
  "format": "txt"
}
*/

// 4. 导出日志为JSON格式
// POST http://localhost:3000/api/export-logs
// Content-Type: application/json
/*
{
  "indexPattern": "kube-*",
  "appName": "lab-service-cloud",
  "searchTerm": "error",
  "timeRange": "12h",
  "format": "json"
}
*/

// 5. 自定义时间范围搜索
// POST http://localhost:3000/api/search-logs
// Content-Type: application/json
/*
{
  "indexPattern": "kube-*",
  "appName": "lab-service-cloud",
  "searchTerm": "error",
  "timeRange": "custom",
  "startTime": "2023-01-01T00:00:00Z",
  "endTime": "2023-01-02T00:00:00Z",
  "maxResults": "100"
}
*/