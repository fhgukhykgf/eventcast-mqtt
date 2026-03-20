// 小程序入口文件
const mqttManager = require('./utils/mqtt.js');

App({
  globalData: {
    baseUrl: 'http://192.168.115.4:8000/api',
    mqttWsUrl: 'ws://192.168.1.64:8083/mqtt',
    userInfo: null,
    token: null
  },

  onLaunch() {
    console.log('🚀 小程序启动');
    this.checkLogin();
  },
   onShow() {
    // 小程序显示时，如果已登录则连接MQTT
    if (this.globalData.userInfo) {
      this.connectMqtt();
    }
  },

  onHide() {
    // 小程序隐藏时断开MQTT连接
    mqttManager.disconnect();
  },

  checkLogin() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      console.log('✅ 用户已登录:', userInfo);

      // 登录成功后连接MQTT
      this.connectMqtt();
    }
  },

 // 连接MQTT
  connectMqtt() {
    if (!this.globalData.userInfo) return;

    mqttManager.connect((message) => {
      console.log('收到MQTT消息:', message);
    });

    // 订阅个人通知
    setTimeout(() => {
      mqttManager.subscribe(`user/${this.globalData.userInfo.user_id}/notice`);
    }, 1000);
  },

  // 断开MQTT
  disconnectMqtt() {
    mqttManager.disconnect();
  },

  login(userId, userName) {
    return new Promise((resolve) => {
      const userInfo = {
        user_id: userId,
        user_name: userName,
        login_time: new Date().toISOString()
      };
      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('token', 'token-' + Date.now());
      this.globalData.userInfo = userInfo;
      this.globalData.token = wx.getStorageSync('token');
      resolve(userInfo);
    });
  },

  logout() {
    wx.clearStorageSync();
    this.globalData.userInfo = null;
    this.globalData.token = null;
    wx.reLaunch({ url: '/pages/login/login' });
  },

  formatTime(date, format = 'YYYY-MM-DD HH:mm') {
    if (!date) return '时间待定';
    let d;
    // 处理时间字符串
    if (typeof date === 'string') {
      // 转换为iOS支持的格式
      if (date.includes('T')) {
        // 处理ISO格式时间字符串
        const iosFriendlyDate = date.replace('T', ' ').replace(/\..*/, '');
        d = new Date(iosFriendlyDate);
      } else if (date.includes(' ') && date.includes('-')) {
        // 将 'YYYY-MM-DD HH:mm' 转换为 'YYYY/MM/DD HH:mm'
        const iosFriendlyDate = date.replace(/-/g, '/');
        d = new Date(iosFriendlyDate);
      } else {
        d = new Date(date);
      }
    } else {
      d = new Date(date);
    }
    
    // 检查是否为有效日期
    if (isNaN(d.getTime())) {
      return '时间格式错误';
    }
    
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute);
  },

  getTimeDiff(startTime) {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diff = now - start;

    if (diff < 0) return '未开始';
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return Math.floor(diff / 86400000) + '天前';
  },

  showToast(title, icon = 'none') {
    wx.showToast({ title, icon, duration: 2000 });
  },

  showLoading(title = '加载中...') {
    wx.showLoading({ title, mask: true });
  },

  hideLoading() {
    wx.hideLoading();
  }
});