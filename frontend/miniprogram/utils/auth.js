// 登录认证工具
const app = getApp();
const { post } = require('./request');

function checkLogin() {
  const token = wx.getStorageSync('token');
  const userInfo = wx.getStorageSync('userInfo');

  if (token && userInfo) {
    app.globalData.token = token;
    app.globalData.userInfo = userInfo;
    return true;
  }
  return false;
}

function login(identifier, password) {
  return new Promise((resolve, reject) => {
    console.log('🔑 尝试登录:', identifier);

    post('/users/login', { identifier, password }, { showLoading: true })
      .then(res => {
        console.log('✅ 登录成功:', res);

        const { user_info, token } = res;

        // 保存用户信息
        wx.setStorageSync('userInfo', user_info);
        wx.setStorageSync('token', token);

        // 更新全局数据
        app.globalData.userInfo = user_info;
        app.globalData.token = token;

        // 显示成功提示
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });

        // 延迟跳转
        setTimeout(() => {
          // 获取重定向地址
          const redirectUrl = wx.getStorageSync('loginRedirectUrl');

          if (redirectUrl) {
            wx.removeStorageSync('loginRedirectUrl');
            wx.redirectTo({ url: redirectUrl });
          } else {
            wx.switchTab({ url: '/pages/index/index' });
          }
        }, 1500);

        resolve(user_info);
      })
      .catch(err => {
        console.error('❌ 登录失败:', err);
        reject(err);
      });
  });
}

function register(userData) {
  return post('/users/register', userData);
}

function logout() {
  wx.clearStorageSync();
  app.globalData.userInfo = null;
  app.globalData.token = null;
  wx.reLaunch({ url: '/pages/login/login' });
}

function getCurrentUser() {
  return app.globalData.userInfo;
}

function getCurrentUserId() {
  return app.globalData.userInfo?.user_id;
}

function getCurrentUserRole() {
  return app.globalData.userInfo?.role;
}

function hasRole(roles) {
  const userRole = getCurrentUserRole();
  if (!userRole) return false;
  if (Array.isArray(roles)) return roles.includes(userRole);
  return userRole === roles;
}

module.exports = {
  checkLogin,
  login,
  register,
  logout,
  getCurrentUser,
  getCurrentUserId,
  getCurrentUserRole,
  hasRole
};