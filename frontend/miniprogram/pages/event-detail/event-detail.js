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
      signTime: null
    },
    loading: true,
    refreshing: false,
    canManage: false,
    userInfo: null
  },

onLoad(options) {
  console.log('📱 活动详情页加载', options);
  this.eventId = options.eventId;
  this.setData({
    eventId: options.eventId,
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
}

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
      await Promise.all([
        this.loadEventDetail(),
        this.loadUserStatus()
      ]);
      console.log('✅ 活动详情加载完成');
    } catch (err) {
      console.error('❌ 加载失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadEventDetail() {
    try {
      console.log('📡 加载活动详情:', this.eventId);
      const res = await get(`/events/detail/${this.eventId}`);
      console.log('📥 活动详情数据:', res);

      const eventData = res.data || res;
      this.setData({ event: eventData });

      // 检查管理权限
      const userRole = auth.getCurrentUserRole();
      this.setData({
        canManage: userRole === 'admin' || userRole === 'organizer'
      });

    } catch (err) {
      console.error('❌ 加载活动详情失败:', err);
      throw err;
    }
  },

  async loadUserStatus() {
    const userId = auth.getCurrentUserId();
    if (!userId || !this.eventId) return;

    try {
      console.log('📡 加载用户状态:', this.eventId, userId);
      const res = await get(`/sign/status/${this.eventId}/${userId}`);
      console.log('📥 用户状态原始数据:', res);

      // 修复：正确映射字段名
      const statusData = res.data || res;

      // 打印所有字段，看看实际返回的是什么
      console.log('📥 状态数据字段:', Object.keys(statusData));

      this.setData({
        userStatus: {
          hasApplied: statusData.has_applied || statusData.hasApplied || false,
          hasSigned: statusData.has_signed || statusData.hasSigned || false,
          // 尝试多种可能的字段名
          applyTime: statusData.apply_time || statusData.applyTime || statusData.apply_time || null,
          signTime: statusData.sign_time || statusData.signTime || statusData.sign_time || null
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
          signTime: null
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

            // 重新加载用户状态
            await this.loadUserStatus();

          } catch (err) {
            wx.hideLoading();
            console.error('❌ 报名失败:', err);

            if (err.message && err.message.includes('已报名')) {
              // 如果已经报名，手动设置状态
              this.setData({
                'userStatus.hasApplied': true,
                'userStatus.applyTime': new Date().toISOString()
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
              user_id: userId
            });

            wx.hideLoading();
            wx.showToast({ title: '取消成功', icon: 'success' });

            // 重新加载用户状态
            await this.loadUserStatus();

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
      return app.formatTime(time, 'YYYY-MM-DD HH:mm');
    } catch (e) {
      console.error('时间格式化错误:', e);
      return time;
    }
  },

  // 判断是否可签到
  canSign() {
    const { event, userStatus } = this.data;
    if (!event || !userStatus.hasApplied) return false;
    if (userStatus.hasSigned) return false;
    if (event.status !== 'active') return false;

    const now = new Date();
    const eventTime = new Date(event.time);
    // 活动开始前30分钟可签到，活动结束后3小时内可补签
    const signStartTime = new Date(eventTime - 30 * 60 * 1000);
    const signEndTime = new Date(eventTime + 3 * 60 * 60 * 1000);

    return now >= signStartTime && now <= signEndTime;
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

    // 未报名且活动进行中
    if (event.status === 'active') {
      return { type: 'apply', text: '📝 立即报名' };
    }

    return { type: 'hidden' };
  }
});