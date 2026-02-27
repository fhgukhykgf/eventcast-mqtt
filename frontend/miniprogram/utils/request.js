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

        if (res.statusCode === 200) {
          // 统一处理响应格式
          if (res.data && res.data.code === 200) {
            // 标准格式：{code:200, data: ...}
            resolve(res.data);
          } else if (Array.isArray(res.data)) {
            // 如果直接返回数组，包装成标准格式
            resolve({ code: 200, data: res.data });
          } else {
            // 其他情况，直接返回
            resolve(res.data);
          }
        } else {
          wx.showToast({
            title: `HTTP ${res.statusCode}`,
            icon: 'none'
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