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
      // 筛选时一次性加载更多数据
      const params = {
        skip: 0,
        limit: 100
      };

      // 不传status给后端，前端统一筛选
      console.log('📡 请求参数:', params);
      const res = await get('/events/list', params);
      console.log('📥 完整响应:', res);

      // 关键修复：根据实际数据结构解析
      let newEvents = [];

      // 判断 res 的结构
      if (Array.isArray(res)) {
        // 如果直接返回数组
        newEvents = res;
      } else if (res && res.code === 200 && Array.isArray(res.data)) {
        // 如果返回 {code:200, data: [...]}
        newEvents = res.data;
      } else if (res && res.data && Array.isArray(res.data.data)) {
        // 如果返回 {code:200, data: {data: [...]}}
        newEvents = res.data.data;
      }

      console.log('📊 解析后的活动数据:', newEvents);
      console.log('📊 数据长度:', newEvents.length);

      // 为每个活动计算状态
      newEvents = newEvents.map(event => {
        const statusInfo = this.getEventStatus(event);
        return {
          ...event,
          statusText: statusInfo.text,
          statusClass: statusInfo.class,
          computedStatus: statusInfo.class
        };
      });

      // 按活动时间倒排序
      newEvents.sort((a, b) => {
        const timeA = this.parseDate(a.start_time || a.time).getTime();
        const timeB = this.parseDate(b.start_time || b.time).getTime();
        return timeB - timeA; // 倒序排列
      });

      // 前端根据筛选条件过滤
      let filteredEvents = newEvents;
      if (this.data.filterStatus !== 'all') {
        filteredEvents = newEvents.filter(event => event.computedStatus === this.data.filterStatus);
      }

      this.setData({
        events: filteredEvents,
        'pagination.hasMore': false
      });

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
    // 先检查是否已取消（多种可能的值）
    if (event.status === 'cancelled' || event.status === 'Canceled' || event.status === 'CANCELED') {
      return { text: '已取消', class: 'cancelled' };
    }

    // 检查是否有状态字段
    if (!event.status) {
      console.warn('活动缺少状态字段:', event.event_id, event.title);
    }

    const now = new Date();
    const eventTime = this.parseDate(event.start_time || event.time);
    
    // 处理结束时间
    let eventEndTime;
    if (event.end_time && event.end_time !== '时间待定' && event.end_time !== event.start_time) {
      eventEndTime = this.parseDate(event.end_time);
    } else {
      // 默认活动时长2小时
      eventEndTime = new Date(eventTime.getTime() + 2 * 60 * 60 * 1000);
    }

    // 如果后端状态为已结束，或者结束时间已过
    if (event.status === 'ended' || now > eventEndTime) {
      return { text: '已结束', class: 'ended' };
    }
    
    // 活动正在进行中
    if (now >= eventTime && now <= eventEndTime) {
      return { text: '进行中', class: 'active' };
    }

    // 活动未开始
    return { text: '未开始', class: 'upcoming' };
  },

  // 解析日期，兼容iOS
  parseDate(date) {
    if (typeof date === 'string' && date.includes(' ') && date.includes('-')) {
      // 将 'YYYY-MM-DD HH:mm' 转换为 'YYYY/MM/DD HH:mm'
      const iosFriendlyDate = date.replace(/-/g, '/');
      return new Date(iosFriendlyDate);
    }
    return new Date(date);
  }
});