// 个人中心
const { get } = require('../../utils/request');
const auth = require('../../utils/auth');

Page({
  data: {
    userInfo: null,
    stats: {
      applyCount: 0,
      signCount: 0,
      signRate: '0%'
    },
    menuList: [
      { id: 'my-events', icon: '📋', title: '我的活动', url: '/pages/my-events/my-events' },
      { id: 'settings', icon: '⚙️', title: '设置', url: '/pages/settings/settings' },
      { id: 'about', icon: 'ℹ️', title: '关于我们', url: '' }
    ]
  },

  onLoad() {
    if (!auth.checkLogin()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }

    this.setData({ userInfo: getApp().globalData.userInfo });
    this.loadStats();
  },

  onShow() {
    this.setData({ userInfo: getApp().globalData.userInfo });
    this.loadStats();
  },

  async loadStats() {
    const userId = auth.getCurrentUserId();
    if (!userId) return;

    try {
      const res = await get(`/users/statistics/${userId}`);
      this.setData({ stats: res });
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  },

  onMenuTap(e) {
    const { url } = e.currentTarget.dataset;
    if (url) {
      wx.navigateTo({ url });
    } else {
      wx.showModal({
        title: '关于我们',
        content: '活动快传 v1.0.0\n\n一款轻量化的校园活动管理工具',
        showCancel: false
      });
    }
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          auth.logout();
        }
      }
    });
  }
});