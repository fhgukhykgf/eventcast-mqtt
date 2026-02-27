// pages/events/events.js - 活动列表页
const { get } = require('../../utils/request');
const auth = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    events: [],
    loading: true,
    refreshing: false,
    filterStatus: 'all', // 默认改为 'all'
    pagination: {
      page: 1,
      hasMore: true,
      pageSize: 20
    }
  },

  onLoad() {
    console.log('📱 活动列表页加载');
    // 默认加载全部活动
    this.setData({ filterStatus: 'all' });
    this.loadEvents(true);
  },

  onShow() {
    console.log('📱 活动列表页显示');
    this.loadEvents(true);
  },

  onPullDownRefresh() {
    this.setData({
      refreshing: true,
      'pagination.page': 1,
      events: []
    });
    this.loadEvents(true).finally(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.pagination.hasMore && !this.data.loading) {
      this.loadEvents(false);
    }
  },

  async loadEvents(isRefresh = true) {
    if (this.data.loading && !isRefresh) return;

    this.setData({ loading: true });

    try {
      const params = {
        skip: isRefresh ? 0 : (this.data.pagination.page - 1) * this.data.pagination.pageSize,
        limit: this.data.pagination.pageSize
      };

      // 添加状态筛选
      if (this.data.filterStatus !== 'all') {
        params.status = this.data.filterStatus;
      }

      console.log('📡 请求参数:', params);
      const res = await get('/events/list', params);
      console.log('📥 完整响应:', res);

      // 关键修复：根据实际数据结构解析
      let newEvents = [];

      // 判断 res 的结构
      if (Array.isArray(res)) {
        // 如果直接返回数组
        newEvents = res;
      } else if (res && Array.isArray(res.data)) {
        // 如果返回 {code:200, data: [...]}
        newEvents = res.data;
      } else if (res && res.data && Array.isArray(res.data.data)) {
        // 如果返回 {code:200, data: {data: [...]}}
        newEvents = res.data.data;
      }

      console.log('📊 解析后的活动数据:', newEvents);
      console.log('📊 数据长度:', newEvents.length);

      if (isRefresh) {
        this.setData({
          events: newEvents,
          'pagination.page': 2,
          'pagination.hasMore': newEvents.length >= this.data.pagination.pageSize
        });
      } else {
        this.setData({
          events: [...this.data.events, ...newEvents],
          'pagination.page': this.data.pagination.page + 1,
          'pagination.hasMore': newEvents.length >= this.data.pagination.pageSize
        });
      }

      console.log('✅ 加载完成，当前活动数:', this.data.events.length);

    } catch (err) {
      console.error('❌ 加载活动列表失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onFilterChange(e) {
    const status = e.currentTarget.dataset.status;
    console.log('🔍 筛选条件变更为:', status);

    this.setData({
      filterStatus: status,
      'pagination.page': 1,
      events: []
    });

    this.loadEvents(true);
  },

  onEventTap(e) {
    const eventId = e.currentTarget.dataset.eventId;
    console.log('👆 点击活动:', eventId);
    if (eventId) {
      wx.navigateTo({ url: `/pages/event-detail/event-detail?eventId=${eventId}` });
    }
  },

  formatTime(time) {
    return app.formatTime(time);
  },

  getEventStatus(event) {
    const now = new Date();
    const eventTime = new Date(event.time);

    if (event.status === 'ended') return { text: '已结束', class: 'ended' };
    if (eventTime < now) return { text: '进行中', class: 'active' };
    return { text: '即将开始', class: 'upcoming' };
  }
});