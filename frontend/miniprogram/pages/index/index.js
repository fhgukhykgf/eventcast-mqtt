// pages/index/index.js - 首页
const app = getApp();
const { get } = require('../../utils/request');
const auth = require('../../utils/auth');
const mqttManager = require('../../utils/mqtt.js');

Page({
  data: {
    userInfo: null,
    stats: {
      totalEvents: 0,
      signedEvents: 0,
      signRate: '0%'
    },
    ongoingEvents: [],
    upcomingEvents: [],
    recentEvents: [],
    loading: true,
    refreshing: false,
    unreadCount: 0
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
    this.setData({ 
      userInfo: app.globalData.userInfo,
      unreadCount: mqttManager.getUnreadCount()
    });
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
        this.loadOngoingEvents(),
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

      const statsData = res.code === 200 && res.data ? res.data : res;
      console.log('📥 处理后的统计数据:', statsData);

      this.setData({
        stats: {
          totalEvents: statsData.apply_count || statsData.totalEvents || 0,
          signedEvents: statsData.sign_count || statsData.signedEvents || 0,
          signRate: statsData.sign_rate || statsData.signRate || '0%'
        }
      });
    } catch (err) {
      console.error('❌ 加载统计失败:', err);
    }
  },

  async loadOngoingEvents() {
    try {
      const res = await get('/events/list', { status: 'active', limit: 10 });
      console.log('📥 所有活动:', res);

      let events = [];
      if (res.code === 200 && res.data) {
        events = res.data;
      } else if (Array.isArray(res)) {
        events = res;
      }

      const now = new Date();
      
      // 筛选进行中的活动（开始时间<=现在<=结束时间）
      const ongoingEvents = events.filter(event => {
        if (event.status === 'cancelled') return false;
        
        const startTime = this.parseDate(event.start_time || event.time);
        const endTime = event.end_time && event.end_time !== '时间待定' 
          ? this.parseDate(event.end_time) 
          : new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
        
        return now >= startTime && now <= endTime;
      });

      // 按开始时间排序
      ongoingEvents.sort((a, b) => {
        const timeA = this.parseDate(a.start_time || a.time).getTime();
        const timeB = this.parseDate(b.start_time || b.time).getTime();
        return timeA - timeB;
      });

      this.setData({ ongoingEvents: ongoingEvents.slice(0, 3) });
      console.log('📥 进行中的活动:', ongoingEvents.slice(0, 3));
    } catch (err) {
      console.error('❌ 加载进行中活动失败:', err);
    }
  },

  async loadUpcomingEvents() {
    try {
      const res = await get('/events/list', { status: 'active', limit: 10 });
      console.log('📥 即将开始的活动:', res);

      let events = [];
      if (res.code === 200 && res.data) {
        events = res.data;
      } else if (Array.isArray(res)) {
        events = res;
      }

      const now = new Date();
      
      // 筛选即将开始的活动（开始时间>现在）
      const upcomingEvents = events.filter(event => {
        if (event.status === 'cancelled') return false;
        
        const startTime = this.parseDate(event.start_time || event.time);
        
        return now < startTime;
      });

      // 按开始时间正序排列
      upcomingEvents.sort((a, b) => {
        const timeA = this.parseDate(a.start_time || a.time).getTime();
        const timeB = this.parseDate(b.start_time || b.time).getTime();
        return timeA - timeB;
      });

      this.setData({ upcomingEvents: upcomingEvents.slice(0, 3) });
      console.log('📥 即将开始的活动:', upcomingEvents.slice(0, 3));
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

      let events = [];
      if (res.code === 200 && res.data) {
        events = res.data;
      } else if (Array.isArray(res)) {
        events = res;
      }
      
      events = events.map(event => {
        const statusInfo = this.getEventStatusInfo(event);
        return {
          ...event,
          statusText: statusInfo.text,
          statusClass: statusInfo.className
        };
      });
      
      this.setData({ recentEvents: events });
      console.log('📥 处理后的最近活动数据:', events);
    } catch (err) {
      console.error('❌ 加载最近活动失败:', err);
    }
  },

  onScanTap() {
    console.log('📷 点击扫码签到');

    if (!auth.checkLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode'],
      success: (res) => {
        console.log('✅ 扫码成功:', res);
        let eventId = res.result;
        
        try {
          const qrData = JSON.parse(res.result);
          if (qrData.event_id) {
            eventId = qrData.event_id;
            console.log('解析到活动ID:', eventId);
          }
        } catch (e) {
          console.log('非JSON格式，直接使用:', eventId);
        }

        if (eventId) {
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

  onNotificationTap() {
    const notifications = mqttManager.getNotifications();
    const unreadCount = mqttManager.getUnreadCount();
    
    if (notifications.length === 0) {
      wx.showToast({
        title: '暂无通知',
        icon: 'none'
      });
      return;
    }

    // 显示通知列表
    const itemList = notifications.slice(0, 10).map(n => 
      `${n.read ? '  ' : '🔴 '}${n.title}`
    );

    wx.showActionSheet({
      itemList: itemList,
      itemColor: '#333',
      success: (res) => {
        const notification = notifications[res.tapIndex];
        if (notification) {
          mqttManager.markAsRead(notification.id);
          this.setData({ unreadCount: mqttManager.getUnreadCount() });
          
          // 如果有活动ID，跳转到活动详情
          if (notification.event_id) {
            wx.navigateTo({ url: `/pages/event-detail/event-detail?eventId=${notification.event_id}` });
          }
        }
      }
    });

    // 标记全部已读
    mqttManager.markAllAsRead();
    this.setData({ unreadCount: 0 });
  },

  getEventStatusInfo(item) {
    // 先检查活动是否已取消（使用 event_status 字段）
    if (item.event_status === 'cancelled') {
      return { text: '已取消', className: 'cancelled' };
    }

    if (item.sign_time) {
      return { text: '已签到', className: 'signed' };
    }
    
    const now = new Date();
    const eventTime = this.parseDate(item.event_time || item.time);
    const eventEndTime = item.event_end_time ? this.parseDate(item.event_end_time) : new Date(eventTime.getTime() + 2 * 60 * 60 * 1000);
    
    if (now > eventEndTime) {
      if (!item.sign_time) {
        return { text: '未签到', className: 'missed' };
      }
    }
    
    if (now >= eventTime && now <= eventEndTime) {
      return { text: '进行中', className: 'active' };
    }
    
    return { text: '待参加', className: 'upcoming' };
  },

  formatTime(time) {
    return app.formatTime(time);
  },

  getTimeDiff(time) {
    return app.getTimeDiff(time);
  },

  parseDate(date) {
    if (typeof date === 'string' && date.includes(' ') && date.includes('-')) {
      const iosFriendlyDate = date.replace(/-/g, '/');
      return new Date(iosFriendlyDate);
    }
    return new Date(date);
  }
});