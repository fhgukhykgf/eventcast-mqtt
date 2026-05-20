// 通用请求工具
const api = {
    // 获取 token
    getToken() {
        return localStorage.getItem('token');
    },

    // 获取用户信息
    getUser() {
        const userStr = localStorage.getItem('userInfo');
        return userStr ? JSON.parse(userStr) : null;
    },

    // 检查登录状态
    checkAuth() {
        const token = this.getToken();
        const user = this.getUser();
        
        if (!token || !user) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    // 判断是否为管理员
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    // 通用请求方法
    async request(url, options = {}) {
        const token = this.getToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        };

        // 合并 headers
        options.headers = { ...defaultOptions.headers, ...options.headers };

        try {
            const response = await fetch(url, options);
            
            // 处理 401 未授权
            if (response.status === 401) {
                localStorage.clear();
                Toast.error('登录已过期，请重新登录');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                throw new Error('Unauthorized');
            }
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || data.msg || `请求失败 (${response.status})`);
            }
            return data;
        } catch (err) {
            console.error('请求失败:', err);
            throw err;
        }
    },

    // GET 请求
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    // POST 请求
    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // PUT 请求
    async put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // DELETE 请求
    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
};

// 退出登录
function handleLogout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// 显示用户名
function showUserName() {
    const user = api.getUser();
    if (user) {
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = user.real_name || user.username || '管理员';
        }
    }
}

// 渲染导航栏
function renderNav(activePage) {
    const isAdmin = api.isAdmin();
    
    let navHtml = `
        <a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">数据看板</a>
        <a href="events.html" class="${activePage === 'events' ? 'active' : ''}">活动管理</a>
        <a href="attendees.html" class="${activePage === 'attendees' ? 'active' : ''}">报名人员</a>
    `;
    
    if (isAdmin) {
        navHtml += `<a href="users.html" class="${activePage === 'users' ? 'active' : ''}">人员管理</a>`;
        navHtml += `<a href="logs.html" class="${activePage === 'logs' ? 'active' : ''}">日志管理</a>`;
    }
    
    navHtml += `<a href="qrcode.html" class="${activePage === 'qrcode' ? 'active' : ''}">签到二维码</a>`;
    
    const navEl = document.querySelector('.nav');
    if (navEl) {
        navEl.innerHTML = navHtml;
    }
}

// ==================== Toast 消息提示 ====================
let toastContainer = null;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

function showToast(message, type = 'info', duration = 3000) {
    const container = getToastContainer();
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <span class="toast-close">×</span>
    `;
    
    container.appendChild(toast);

    // 点击关闭按钮或 Toast 本身关闭
    let timeoutId = null;
    const closeToast = () => {
        if (timeoutId) clearTimeout(timeoutId);
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', closeToast);
    toast.addEventListener('click', (e) => {
        if (e.target.classList.contains('toast-close')) return;
        closeToast();
    });
    
    // 自动关闭
    timeoutId = setTimeout(closeToast, duration);
}

// 快捷方法
const Toast = {
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    warning: (msg, duration) => showToast(msg, 'warning', duration),
    info: (msg, duration) => showToast(msg, 'info', duration)
};

// ==================== 确认弹框 ====================
let confirmModalId = 0;

function showConfirm(options) {
    return new Promise((resolve) => {
        const modalId = `confirmModal${++confirmModalId}`;
        const { title, message, type = 'warning', confirmText = '确定', cancelText = '取消' } = options;
        
        const icons = {
            warning: '⚠',
            danger: '🗑',
            success: '✓',
            info: 'ℹ'
        };
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = modalId;
        overlay.innerHTML = `
            <div class="confirm-modal">
                <div class="confirm-header">
                    <div class="confirm-icon ${type}">${icons[type] || icons.warning}</div>
                    <div class="confirm-title">${title}</div>
                </div>
                <div class="confirm-body">
                    <div class="confirm-message">${message}</div>
                </div>
                <div class="confirm-footer">
                    <button class="btn btn-cancel" data-action="cancel">${cancelText}</button>
                    <button class="btn btn-primary" data-action="confirm">${confirmText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 点击按钮
        overlay.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                overlay.remove();
                resolve(action === 'confirm');
            });
        });
        
        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
        
        // ESC 关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handleEsc);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

// 快捷方法
const Confirm = {
    warning: (title, message) => showConfirm({ title, message, type: 'warning' }),
    danger: (title, message) => showConfirm({ title, message, type: 'danger' }),
    success: (title, message) => showConfirm({ title, message, type: 'success' }),
    info: (title, message) => showConfirm({ title, message, type: 'info' })
};

// 格式化时间
function formatTime(timeStr) {
    if (!timeStr) return '-';
    
    try {
        let date;
        
        if (typeof timeStr === 'string') {
            // 处理 ISO 格式 (2026-03-19T09:24:43.127002)
            if (timeStr.includes('T')) {
                // 移除毫秒部分，保留日期和时间
                const cleanStr = timeStr.split('.')[0].replace('T', ' ');
                const parts = cleanStr.split(' ');
                const dateParts = parts[0].split('-');
                const timeParts = parts[1].split(':');
                
                // 使用本地时间创建 Date 对象
                date = new Date(
                    parseInt(dateParts[0]),
                    parseInt(dateParts[1]) - 1,
                    parseInt(dateParts[2]),
                    parseInt(timeParts[0]),
                    parseInt(timeParts[1]),
                    parseInt(timeParts[2] || 0)
                );
            } 
            // 处理空格分隔格式 (2026-03-19 09:24)
            else if (timeStr.includes(' ')) {
                const parts = timeStr.split(' ');
                const dateParts = parts[0].split('-');
                const timeParts = parts[1].split(':');
                
                date = new Date(
                    parseInt(dateParts[0]),
                    parseInt(dateParts[1]) - 1,
                    parseInt(dateParts[2]),
                    parseInt(timeParts[0]),
                    parseInt(timeParts[1])
                );
            } else {
                date = new Date(timeStr);
            }
        } else {
            date = new Date(timeStr);
        }
        
        if (isNaN(date.getTime())) return timeStr;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
        console.error('时间格式化错误:', e, timeStr);
        return timeStr;
    }
}