// 使用动态导入方式引入node-fetch v3
async function testSearchLogs() {
    const fetch = (await import('node-fetch')).default;

    try {
        const response = await fetch('http://localhost:3000/api/search-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                indexPattern: 'kube-*',
                appName: 'lab-service-cloud',
                searchTerm: 'error',
                timeRange: '12h',
                maxResults: '50'
            })
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testSearchLogs();