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
    recentActivities: [],
    menuList: [
      { id: 'my-events', icon: '📋', title: '我的活动', action: 'myEvents' },
      { id: 'settings', icon: '⚙️', title: '设置', action: 'settings' },
      { id: 'about', icon: 'ℹ️', title: '关于我们', action: 'about' }
    ]
  },

  onLoad() {
    if (!auth.checkLogin()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }

    this.setData({ userInfo: getApp().globalData.userInfo });
    this.initMenuList();
    this.loadStats();
    this.loadRecentActivities();
  },

  onShow() {
    this.setData({ userInfo: getApp().globalData.userInfo });
    this.loadStats();
    this.loadRecentActivities();
  },

  initMenuList() {
    const role = auth.getCurrentUserRole();
    let menuList = [
      { id: 'my-events', icon: '📋', title: '我的活动', action: 'myEvents' },
      { id: 'settings', icon: '⚙️', title: '设置', action: 'settings' },
      { id: 'about', icon: 'ℹ️', title: '关于我们', action: 'about' }
    ];

    // 组织者和管理员添加签到二维码入口
    if (role === 'admin' || role === 'organizer') {
      menuList.unshift({
        id: 'qrcode',
        icon: '📱',
        title: '签到二维码',
        action: 'qrcode'
      });
    }

    this.setData({ menuList });
  },

  async loadStats() {
    const userId = auth.getCurrentUserId();
    if (!userId) return;

    try {
      const res = await get(`/users/statistics/${userId}`);
      if (res && res.data) {
        this.setData({
          stats: {
            applyCount: res.data.apply_count || 0,
            signCount: res.data.sign_count || 0,
            signRate: res.data.sign_rate || '0%'
          }
        });
      }
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  },

  async loadRecentActivities() {
    const userId = auth.getCurrentUserId();
    if (!userId) return;

    try {
      const res = await get(`/sign/user/${userId}`, { limit: 5 });
      if (res && res.data) {
        this.setData({ recentActivities: res.data });
      }
    } catch (err) {
      console.error('加载活动记录失败:', err);
    }
  },

  onMenuTap(e) {
    const { action } = e.currentTarget.dataset;
    
    switch (action) {
      case 'qrcode':
        wx.navigateTo({ url: '/pages/qrcode/qrcode' });
        break;
      case 'myEvents':
        wx.switchTab({ url: '/pages/events/events' });
        break;
      case 'settings':
        wx.showToast({ title: '设置功能开发中', icon: 'none' });
        break;
      case 'about':
        wx.showModal({
          title: '关于我们',
          content: '活动快传 v1.0.0\n\n一款轻量化的校园活动管理工具',
          showCancel: false
        });
        break;
      default:
        break;
    }
  },

  onActivityTap(e) {
    const { eventId } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/event-detail/event-detail?eventId=${eventId}` });
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