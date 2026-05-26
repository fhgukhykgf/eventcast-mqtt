// 网络请求封装
const app = getApp();

function request(options) {
  return new Promise((resolve, reject) => {
    if (options.showLoading !== false) {
      wx.showLoading({
        title: options.loadingText || '加载中...',
        mask: true
      });
    }

    const url = options.url.startsWith('http')
      ? options.url
      : app.globalData.baseUrl + options.url;

    console.log('📡 请求:', options.method || 'GET', url, options.data || {});

    wx.request({
      url: url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : ''
      },
      timeout: options.timeout || 10000,
      success: (res) => {
        console.log('📥 响应:', res.statusCode, res.data);

        if (options.showLoading !== false) {
          wx.hideLoading();
        }

        if (res.statusCode === 401) {
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          });
          
          wx.clearStorageSync();
          app.globalData.userInfo = null;
          app.globalData.token = null;
          
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/login/login' });
          }, 1500);
          
          reject(new Error('Unauthorized'));
          return;
        }

        if (res.statusCode === 200) {
          if (res.data && res.data.code === 200) {
            resolve(res.data);
          } else if (Array.isArray(res.data)) {
            resolve({ code: 200, data: res.data });
          } else {
            resolve(res.data);
          }
        } else if (res.statusCode === 403) {
          wx.showToast({
            title: res.data?.detail || '权限不足',
            icon: 'none'
          });
          reject(new Error('Forbidden'));
        } else if (res.statusCode === 404) {
          // 404 不显示 toast，让调用方处理
          resolve({ code: 404, data: null, detail: res.data?.detail || '资源不存在' });
        } else {
          // 处理 422 验证错误
          let errorMsg = res.data?.detail || `请求失败 (${res.statusCode})`;
          
          // 如果是 422 错误，尝试解析详细错误信息
          if (res.statusCode === 422 && res.data?.detail && Array.isArray(res.data.detail)) {
            const errors = res.data.detail.map(err => {
              const field = err.loc ? err.loc.join('.') : '';
              const msg = err.msg || '';
              return `${field}: ${msg}`;
            });
            errorMsg = errors.join('; ');
          }
          
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          });
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('❌ 请求失败:', err);

        if (options.showLoading !== false) {
          wx.hideLoading();
        }

        let errorMsg = '网络连接失败';
        if (err.errMsg && err.errMsg.includes('domain list')) {
          errorMsg = '请在开发者工具中勾选「不校验合法域名」';
        }

        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        });

        reject(err);
      }
    });
  });
}

function get(url, data = {}, options = {}) {
  return request({ url, method: 'GET', data, ...options });
}

function post(url, data = {}, options = {}) {
  return request({ url, method: 'POST', data, ...options });
}

function put(url, data = {}, options = {}) {
  return request({ url, method: 'PUT', data, ...options });
}

function del(url, data = {}, options = {}) {
  return request({ url, method: 'DELETE', data, ...options });
}

module.exports = {
  request,
  get,
  post,
  put,
  del
};