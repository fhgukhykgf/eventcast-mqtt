// 配置文件
// 根据实际部署情况修改 API_BASE 地址
const config = {
    // 后端 API 地址
    API_BASE: window.location.protocol + '//' + window.location.hostname + ':8000/api',
    
    // 如果前端和后端在同一端口（通过 nginx 代理），使用：
    // API_BASE: '/api',
    
    // 如果是本地开发，可以固定使用：
    // API_BASE: 'http://localhost:8000/api',
};