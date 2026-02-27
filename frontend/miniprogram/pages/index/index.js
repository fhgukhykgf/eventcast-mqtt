// pages/index/index.js - 首页
const app = getApp();
const { get } = require('../../utils/request');
const auth = require('../../utils/auth');

Page({
  data: {
    userInfo: null,
    stats: {
      totalEvents: 0,
      signedEvents: 0,
      signRate: '0%'
    },
    upcomingEvents: [],
    recentEvents: [],
    loading: true,
    refreshing: false
  },

  onLoad() {
    console.log('📱 首页加载');

    if (!auth.checkLogin()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }

    this.setData({ userInfo: app.globalData.userInfo });
    this.loadData();
  },

  onShow() {
    console.log('📱 首页显示');
    this.setData({ userInfo: app.globalData.userInfo });
    this.loadData();
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadData().finally(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  async loadData() {
    console.log('🔄 开始加载数据');
    this.setData({ loading: true });

    try {
      await Promise.all([
        this.loadStats(),
        this.loadUpcomingEvents(),
        this.loadRecentEvents()
      ]);
      console.log('✅ 所有数据加载完成');
    } catch (err) {
      console.error('❌ 加载失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadStats() {
    const userId = auth.getCurrentUserId();
    if (!userId) return;

    try {
      console.log('📡 加载统计数据:', userId);
      const res = await get(`/users/statistics/${userId}`);
      console.log('📥 统计数据:', res);

      // 修复：确保数据正确映射
      this.setData({
        stats: {
          totalEvents: res.apply_count || res.totalEvents || 0,
          signedEvents: res.sign_count || res.signedEvents || 0,
          signRate: res.sign_rate || res.signRate || '0%'
        }
      });
    } catch (err) {
      console.error('❌ 加载统计失败:', err);
    }
  },

  async loadUpcomingEvents() {
    try {
      const res = await get('/events/list', { status: 'active', limit: 3 });
      console.log('📥 即将开始的活动:', res);

      // 修复：res.data 才是真正的数据数组
      const events = res.data || [];
      this.setData({ upcomingEvents: events });
    } catch (err) {
      console.error('❌ 加载活动失败:', err);
    }
  },

  async loadRecentEvents() {
    const userId = auth.getCurrentUserId();
    if (!userId) return;

    try {
      const res = await get(`/sign/user/${userId}`, { limit: 3 });
      console.log('📥 最近参与的活动:', res);

      // 修复：res.data 才是真正的数据数组
      const events = res.data || [];
      this.setData({ recentEvents: events });
    } catch (err) {
      console.error('❌ 加载最近活动失败:', err);
    }
  },

  // 修复扫码签到函数
  onScanTap() {
    console.log('📷 点击扫码签到');

    // 检查是否登录
    if (!auth.checkLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    // 调用微信扫码API
    wx.scanCode({
      onlyFromCamera: false, // 允许从相册选择
      scanType: ['qrCode'], // 只扫描二维码
      success: (res) => {
        console.log('✅ 扫码成功:', res);
        const eventId = res.result;

        if (eventId) {
          // 跳转到签到页面
          wx.navigateTo({
            url: `/pages/signin/signin?eventId=${eventId}`,
            success: () => console.log('跳转到签到页成功'),
            fail: (err) => console.error('跳转失败:', err)
          });
        } else {
          wx.showToast({ title: '无效的二维码', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('❌ 扫码失败:', err);
        if (!err.errMsg.includes('cancel')) {
          wx.showToast({ title: '扫码失败', icon: 'none' });
        }
      }
    });
  },

  onEventTap(e) {
    const eventId = e.currentTarget.dataset.eventId;
    console.log('👆 点击活动:', eventId);
    if (eventId) {
      wx.navigateTo({ url: `/pages/event-detail/event-detail?eventId=${eventId}` });
    }
  },

  onViewAllEvents() {
    wx.switchTab({ url: '/pages/events/events' });
  },

  // 获取活动状态文本
  getEventStatusText(item) {
    if (item.sign_time) {
      return '已签到';
    }
    const now = new Date();
    const eventTime = new Date(item.event_time || item.time);
    if (eventTime < now) {
      return '未签到';
    }
    return '待参加';
  },

  // 获取活动状态类名
  getEventStatusClass(item) {
    if (item.sign_time) {
      return 'signed';
    }
    const now = new Date();
    const eventTime = new Date(item.event_time || item.time);
    if (eventTime < now) {
      return 'missed';
    }
    return 'upcoming';
  },

  formatTime(time) {
    return app.formatTime(time);
  },

  getTimeDiff(time) {
    return app.getTimeDiff(time);
  }
});