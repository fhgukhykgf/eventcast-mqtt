// pages/event-detail/event-detail.js - 活动详情页
const { get, post, del } = require('../../utils/request');
const auth = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    event: null,
    eventId: '',
    userStatus: {
      hasApplied: false,
      hasSigned: false,
      applyTime: null,
      signTime: null,
      applyTimeText: '',
      signTimeText: ''
    },
    loading: true,
    refreshing: false,
    canManage: false,
    userInfo: null
  },

onLoad(options) {
  console.log('📱 活动详情页加载', options);
  // 兼容两种参数名: eventId 和 event_id
  this.eventId = options.eventId || options.event_id;
  this.setData({
    eventId: this.eventId,
    userInfo: app.globalData.userInfo
  });



  // 加载数据
  this.loadData();

  // 订阅该活动的通知
  this.subscribeEventTopic();
},
// 订阅活动主题
subscribeEventTopic() {
  const mqttManager = require('../../utils/mqtt.js');

  // 订阅活动通知
  mqttManager.subscribe(`event/${this.eventId}/notice`);
  mqttManager.subscribe(`event/${this.eventId}/sign_in`);

  // 添加消息处理器
  mqttManager.addMessageHandler(`event/${this.eventId}/notice`, (payload) => {
    console.log('收到活动通知:', payload);

    if (payload.type === 'event_update') {
      // 活动更新，刷新数据
      this.loadEventDetail();
      wx.showToast({
        title: '活动信息已更新',
        icon: 'none'
      });
    } else if (payload.type === 'event_delete') {
      // 活动删除，返回列表页
      wx.showModal({
        title: '提示',
        content: '活动已取消',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  });

   mqttManager.addMessageHandler(`event/${this.eventId}/sign_in`, (payload) => {
    console.log('收到签到通知:', payload);

    // 刷新签到数据
    this.loadEventDetail();
    this.loadUserStatus();

    // 如果不是自己签到，显示提示
    if (payload.user_id !== app.globalData.userInfo?.user_id) {
      wx.showToast({
        title: `${payload.user_name} 签到成功`,
        icon: 'none'
      });
    }
  });
},

// 页面卸载时取消订阅
onUnload() {
  const mqttManager = require('../../utils/mqtt.js');
  mqttManager.unsubscribe(`event/${this.eventId}/notice`);
  mqttManager.unsubscribe(`event/${this.eventId}/sign_in`);
},

  onShow() {
    console.log('📱 活动详情页显示');
    this.setData({ userInfo: app.globalData.userInfo });
    if (this.eventId) {
      this.loadUserStatus();
    }
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadData().finally(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      // 先加载活动详情，确保eventId和event数据已设置
      await this.loadEventDetail();
      // 然后加载用户状态
      await this.loadUserStatus();
      console.log('✅ 活动详情加载完成');
    } catch (err) {
      console.error('❌ 加载失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadEventDetail() {
    const eventId = this.eventId || this.data.eventId;
    
    if (!eventId || eventId === 'undefined') {
      console.error('❌ 活动ID无效:', eventId);
      wx.showToast({ title: '活动不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    
    try {
      console.log('📡 加载活动详情:', eventId);
      const res = await get(`/events/detail/${eventId}`);
      console.log('📥 活动详情数据:', res);

      // 检查是否是 404 响应
      if (res.code === 404 || !res.data) {
        console.error('❌ 活动不存在:', res.detail);
        wx.showModal({
          title: '提示',
          content: '该活动不存在或已被删除',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
        return;
      }

      // 正确处理API响应格式
      let eventData;
      if (res.code === 200 && res.data) {
        eventData = res.data;
      } else if (res.data) {
        eventData = res.data;
      } else {
        eventData = res;
      }
      console.log('📥 处理后的eventData:', eventData);
      
      // 确保eventData至少是一个空对象
      if (!eventData) {
        eventData = {};
      }
      
      console.log('📥 eventData字段:', Object.keys(eventData));
      
      // 确保eventData有必要的字段
      // 确保时间字段 - 尝试所有可能的字段名
      eventData.time = eventData.time || eventData.start_time || eventData.StartTime || eventData.startTime || eventData.Start_Time || '时间待定';
      // 确保开始时间字段
      eventData.start_time = eventData.start_time || eventData.time || eventData.StartTime || eventData.startTime || eventData.Start_Time || '时间待定';
      // 确保结束时间字段
      eventData.end_time = eventData.end_time || eventData.EndTime || eventData.endTime || eventData.End_Time || eventData.time || '时间待定';
      
      // 根据时间判断活动状态
      const now = new Date();
      const eventTime = this.parseDate(eventData.start_time || eventData.time);
      const eventEndTime = eventData.end_time && eventData.end_time !== '时间待定' 
        ? this.parseDate(eventData.end_time) 
        : new Date(eventTime.getTime() + 2 * 60 * 60 * 1000);
      
      // 优先保留后端设置的 cancelled 状态
      if (eventData.status === 'cancelled') {
        // 保持 cancelled 状态
      } else if (eventData.status === 'ended' || now > eventEndTime) {
        eventData.status = 'ended';
      } else {
        eventData.status = 'active';
      }
      
      this.setData({ event: eventData });
      console.log('📥 设置后的this.data.event:', this.data.event);
      console.log('📥 时间字段检查 - time:', eventData.time, 'start_time:', eventData.start_time, 'end_time:', eventData.end_time);

      // 检查管理权限
      const userRole = auth.getCurrentUserRole();
      this.setData({
        canManage: userRole === 'admin' || userRole === 'organizer'
      });

    } catch (err) {
      console.error('❌ 加载活动详情失败:', err);
      // 即使出错，也要确保event对象存在
      this.setData({
        event: {
          time: '时间待定',
          start_time: '时间待定',
          end_time: '时间待定',
          status: 'active'
        }
      });
      throw err;
    }
  },

  async loadUserStatus() {
    const userId = auth.getCurrentUserId();
    const eventId = this.eventId || this.data.eventId;
    if (!userId || !eventId) return;

    try {
      console.log('📡 加载用户状态:', eventId, userId);
      const res = await get(`/sign/status/${eventId}/${userId}`);
      console.log('📥 用户状态原始数据:', res);

      // 修复：正确处理API响应格式
      let statusData;
      if (res.code === 200 && res.data) {
        statusData = res.data;
      } else if (res.data) {
        statusData = res.data;
      } else {
        statusData = res;
      }

      // 打印所有字段，看看实际返回的是什么
      console.log('📥 状态数据字段:', Object.keys(statusData));

      this.setData({
        userStatus: {
          hasApplied: statusData.has_applied || statusData.hasApplied || false,
          hasSigned: statusData.has_signed || statusData.hasSigned || false,
          applyTime: statusData.apply_time || statusData.applyTime || null,
          signTime: statusData.sign_time || statusData.signTime || null,
          applyTimeText: statusData.apply_time || statusData.applyTime ? this.formatTime(statusData.apply_time || statusData.applyTime) : '',
          signTimeText: statusData.sign_time || statusData.signTime ? this.formatTime(statusData.sign_time || statusData.signTime) : ''
        }
      });

      console.log('✅ 用户状态更新后:', this.data.userStatus);

    } catch (err) {
      console.error('❌ 加载状态失败:', err);
      // 如果接口返回错误（如未报名），设置默认状态
      this.setData({
        userStatus: {
          hasApplied: false,
          hasSigned: false,
          applyTime: null,
          signTime: null,
          applyTimeText: '',
          signTimeText: ''
        }
      });
    }
  },

  // 添加一个方法来获取报名时间
  getApplyTime() {
    const { userStatus } = this.data;
    if (userStatus.applyTime) {
      return this.formatTime(userStatus.applyTime);
    }
    return '未知';
  },

  // 添加一个方法来获取签到时间
  getSignTime() {
    const { userStatus } = this.data;
    if (userStatus.signTime) {
      return this.formatTime(userStatus.signTime);
    }
    return '未知';
  },

  async onApply() {
    const userId = auth.getCurrentUserId();
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    // 检查活动是否已结束
    if (this.data.event && this.data.event.status === 'ended') {
      wx.showToast({ title: '活动已结束，无法报名', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认报名',
      content: '确定要报名参加此活动吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '报名中...' });

            await post('/sign/apply', {
              event_id: this.eventId,
              user_id: userId,
              user_name: auth.getCurrentUser().real_name || auth.getCurrentUser().user_name
            });

            wx.hideLoading();
            wx.showToast({ title: '报名成功', icon: 'success' });

            // 手动设置报名时间，确保立即显示
            const now = new Date();
            this.setData({
              'userStatus.hasApplied': true,
              'userStatus.applyTime': now.toISOString(),
              'userStatus.applyTimeText': this.formatTime(now.toISOString())
            });

            // 重新加载用户状态和活动详情，确保报名数量更新
            await this.loadUserStatus();
            await this.loadEventDetail();

          } catch (err) {
            wx.hideLoading();
            console.error('❌ 报名失败:', err);

            if (err.message && err.message.includes('已报名')) {
              // 如果已经报名，手动设置状态
              const now = new Date();
              this.setData({
                'userStatus.hasApplied': true,
                'userStatus.applyTime': now.toISOString(),
                'userStatus.applyTimeText': this.formatTime(now.toISOString())
              });
              wx.showToast({ title: '您已报名', icon: 'none' });
            } else {
              wx.showToast({ title: err.message || '报名失败', icon: 'none' });
            }
          }
        }
      }
    });
  },

  async onCancelApply() {
    // 检查活动是否已结束
    if (this.data.event && this.data.event.status === 'ended') {
      wx.showToast({ title: '活动已结束', icon: 'none' });
      return;
    }

    const userId = auth.getCurrentUserId();

    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '取消中...' });

            await post('/sign/cancel', {
              event_id: this.eventId,
              user_id: userId,
              user_name: auth.getCurrentUser().real_name || auth.getCurrentUser().user_name
            });

            wx.hideLoading();
            wx.showToast({ title: '取消成功', icon: 'success' });

            // 重新加载用户状态和活动详情，确保报名数量更新
            await this.loadUserStatus();
            await this.loadEventDetail();

          } catch (err) {
            wx.hideLoading();
            console.error('❌ 取消失败:', err);
            wx.showToast({ title: err.message || '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  onSign() {
    // 检查活动是否已结束
    if (this.data.event && this.data.event.status === 'ended') {
      wx.showToast({ title: '活动已结束，无法签到', icon: 'none' });
      return;
    }
    // 跳转到签到页
    wx.navigateTo({ url: `/pages/signin/signin?eventId=${this.eventId}` });
  },

  async onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此活动吗？此操作不可恢复！',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });

            await del(`/events/delete/${this.eventId}`);

            wx.hideLoading();
            wx.showToast({ title: '删除成功', icon: 'success' });

            setTimeout(() => wx.navigateBack(), 1500);

          } catch (err) {
            wx.hideLoading();
            console.error('❌ 删除失败:', err);
            wx.showToast({ title: err.message || '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  formatTime(time) {
    if (!time) return '时间待定';
    try {
      const formatted = app.formatTime(time, 'YYYY-MM-DD HH:mm');
      return formatted === '时间格式错误' ? '时间待定' : formatted;
    } catch (e) {
      console.error('时间格式化错误:', e);
      return '时间待定';
    }
  },

  // 判断是否可签到
  canSign() {
    const { event, userStatus } = this.data;
    if (!event || !userStatus.hasApplied) return false;
    if (userStatus.hasSigned) return false;
    // 只要活动未结束、未取消就可以签到
    if (event.status === 'ended' || event.status === 'cancelled') return false;

    return true;
  },

  // 获取按钮状态
  getButtonState() {
    const { event, userStatus } = this.data;

    if (!event) return { type: 'hidden' };

    // 已签到
    if (userStatus.hasSigned) {
      return { type: 'signed', text: '✅ 已签到' };
    }

    // 活动已结束
    if (event.status === 'ended') {
      return { type: 'ended', text: '⏰ 活动已结束' };
    }

    // 已报名但未签到
    if (userStatus.hasApplied) {
      if (this.canSign()) {
        return { type: 'sign', text: '📷 扫码签到' };
      } else {
        return { type: 'cancel', text: '❌ 取消报名' };
      }
    }

    // 未报名且活动未结束
    return { type: 'apply', text: '📝 立即报名' };
  },

  // 解析日期，兼容iOS
  parseDate(date) {
    if (typeof date === 'string' && date.includes(' ') && date.includes('-')) {
      // 将 'YYYY-MM-DD HH:mm' 转换为 'YYYY/MM/DD HH:mm'
      const iosFriendlyDate = date.replace(/-/g, '/');
      return new Date(iosFriendlyDate);
    }
    return new Date(date);
  },

  getEventStatus() {
    const { event } = this.data;
    if (!event) return { text: '未知', class: 'unknown' };

    const now = new Date();
    const eventTime = this.parseDate(event.start_time || event.time);
    const eventEndTime = event.end_time ? this.parseDate(event.end_time) : new Date(eventTime.getTime() + 2 * 60 * 60 * 1000);

    if (event.status === 'ended' || now > eventEndTime) {
      return { text: '已结束', class: 'ended', canApply: false };
    }
    
    if (now >= eventTime && now <= eventEndTime) {
      return { text: '进行中', class: 'ongoing', canApply: true };
    }

    const diffMs = eventTime - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return { text: `${diffDays}天后开始`, class: 'upcoming', canApply: true };
    } else if (diffHours > 0) {
      return { text: `${diffHours}小时后开始`, class: 'soon', canApply: true };
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return { text: `${diffMins}分钟后开始`, class: 'soon', canApply: true };
    }
  }
});