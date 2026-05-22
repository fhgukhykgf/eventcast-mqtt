// 签到页
const { get, post } = require('../../utils/request');
const auth = require('../../utils/auth');

Page({
  data: {
    event: null,
    eventId: '',
    userStatus: {
      hasApplied: false,
      hasSigned: false
    },
    signing: false,
    loading: false,
    showSuccess: false,
    signResult: {
      sign_time: ''
    }
  },

  onLoad(options) {
    if (!auth.checkLogin()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }

    if (options.eventId) {
      this.setData({ eventId: options.eventId });
      this.loadEventInfo(options.eventId);
    }
  },

  onShow() {
    if (this.data.eventId) {
      this.loadUserStatus();
    }
  },

  async loadEventInfo(eventId) {
    if (!eventId || eventId === 'undefined') {
      console.error('❌ 活动ID无效:', eventId);
      this.setData({ loading: false, event: null });
      return;
    }
    
    this.setData({ loading: true });
    
    try {
      const res = await get(`/events/detail/${eventId}`);
      const eventData = res.code === 200 && res.data ? res.data : res;
      
      eventData.time = eventData.start_time || eventData.time || '时间待定';
      eventData.end_time = eventData.end_time || '时间待定';
      
      const now = new Date();
      const eventTime = this.parseDate(eventData.start_time || eventData.time);
      const eventEndTime = eventData.end_time && eventData.end_time !== '时间待定' 
        ? this.parseDate(eventData.end_time) 
        : new Date(eventTime.getTime() + 2 * 60 * 60 * 1000);
      
      if (now > eventEndTime) {
        eventData.status = 'ended';
      }
      
      this.setData({ event: eventData, loading: false });
      this.loadUserStatus();
    } catch (err) {
      console.error('加载活动失败:', err);
      this.setData({ loading: false, event: null });
      wx.showToast({ title: '活动不存在', icon: 'none' });
    }
  },

  async loadUserStatus() {
    const userId = auth.getCurrentUserId();
    if (!userId || !this.data.eventId) return;

    try {
      console.log('📡 加载用户状态:', this.data.eventId, userId);
      const res = await get(`/sign/status/${this.data.eventId}/${userId}`);
      console.log('📥 用户状态API响应:', res);
      
      let statusData = res;
      if (res.code === 200 && res.data) {
        statusData = res.data;
      } else if (res.data) {
        statusData = res.data;
      }
      
      const userStatus = {
        hasApplied: !!(statusData.has_applied || statusData.hasApplied || statusData.applied || false),
        hasSigned: !!(statusData.has_signed || statusData.hasSigned || statusData.signed || false)
      };
      
      console.log('📥 最终用户状态:', userStatus);
      this.setData({ userStatus });
    } catch (err) {
      console.error('❌ 加载状态失败:', err);
      this.setData({ 
        userStatus: { hasApplied: false, hasSigned: false }
      });
    }
  },

  onScan() {
    // 检查是否已报名
    if (!this.data.userStatus.hasApplied) {
      wx.showToast({ title: '请先报名活动', icon: 'none' });
      return;
    }

    // 检查是否已签到
    if (this.data.userStatus.hasSigned) {
      wx.showToast({ title: '您已签到', icon: 'none' });
      return;
    }

    // 检查活动是否已结束
    if (this.data.event && this.data.event.status === 'ended') {
      wx.showToast({ title: '活动已结束', icon: 'none' });
      return;
    }

    // 检查签到时间：活动当天，开始前3小时到结束后3小时
    if (!this.canSign()) {
      return;
    }

    const that = this;
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: (res) => {
        console.log('扫码结果:', res.result);
        
        // 解析二维码内容
        let scannedEventId = res.result;
        
        // 尝试解析JSON格式
        try {
          const qrData = JSON.parse(res.result);
          if (qrData.event_id) {
            scannedEventId = qrData.event_id;
          }
        } catch (e) {
          // 不是JSON，直接使用扫描结果作为活动ID
          console.log('非JSON格式，直接作为活动ID:', scannedEventId);
        }
        
        // 检查扫描的活动ID是否匹配当前活动
        if (scannedEventId !== that.data.eventId) {
          wx.showToast({ title: '二维码不匹配此活动', icon: 'none' });
          return;
        }
        
        // 签到
        that.doSignIn();
      },
      fail: (err) => {
        if (!err.errMsg.includes('cancel')) {
          wx.showToast({ title: '扫码失败', icon: 'none' });
        }
      }
    });
  },

  canSign() {
    const { event } = this.data;
    if (!event) return false;

    const now = new Date();
    const eventTime = this.parseDate(event.start_time || event.time);
    const eventEndTime = event.end_time && event.end_time !== '时间待定'
      ? this.parseDate(event.end_time)
      : new Date(eventTime.getTime() + 2 * 60 * 60 * 1000);

    // 检查是否是活动当天
    const nowDate = now.toDateString();
    const eventDate = eventTime.toDateString();
    
    if (nowDate !== eventDate) {
      // 不是活动当天
      if (now < eventTime) {
        const diffDays = Math.ceil((eventTime - now) / (1000 * 60 * 60 * 24));
        wx.showToast({ title: `签到未开始，还有${diffDays}天`, icon: 'none' });
      } else {
        wx.showToast({ title: '已过活动当天，无法签到', icon: 'none' });
      }
      return false;
    }

    // 活动当天，检查时间范围：开始前3小时到结束后3小时
    const signStartTime = new Date(eventTime.getTime() - 3 * 60 * 60 * 1000);
    const signEndTime = new Date(eventEndTime.getTime() + 3 * 60 * 60 * 1000);

    if (now < signStartTime) {
      const diffMins = Math.ceil((signStartTime - now) / (1000 * 60));
      if (diffMins > 60) {
        const diffHours = Math.ceil(diffMins / 60);
        wx.showToast({ title: `签到未开始，还需${diffHours}小时`, icon: 'none' });
      } else {
        wx.showToast({ title: `签到未开始，还需${diffMins}分钟`, icon: 'none' });
      }
      return false;
    }

    if (now > signEndTime) {
      wx.showToast({ title: '签到已结束', icon: 'none' });
      return false;
    }

    return true;
  },

  async doSignIn() {
    this.setData({ signing: true });

    try {
      const user = auth.getCurrentUser() || {};
      const res = await post('/sign/in', {
        event_id: this.data.eventId,
        user_id: auth.getCurrentUserId(),
        user_name: user.real_name || user.user_name || '未知用户',
        sign_location: ''
      });

      console.log('签到响应:', res);

      const data = res.data || res;
      let signTimeText = '';
      if (data.sign_time) {
        signTimeText = this.formatTime(data.sign_time);
      } else {
        signTimeText = this.formatTime(new Date().toISOString());
      }

      this.setData({
        showSuccess: true,
        signResult: {
          sign_time: signTimeText
        },
        'userStatus.hasSigned': true
      });

      setTimeout(() => {
        this.setData({ showSuccess: false });
        wx.navigateBack();
      }, 2000);

    } catch (err) {
      console.error('签到失败:', err);
      wx.showToast({ title: err.message || '签到失败', icon: 'none' });
    } finally {
      this.setData({ signing: false });
    }
  },

  goToEventDetail() {
    if (this.data.eventId) {
      wx.navigateTo({ url: `/pages/event-detail/event-detail?eventId=${this.data.eventId}` });
    }
  },

  formatTime(date) {
    if (!date) return '时间待定';
    let d;
    if (typeof date === 'string') {
      if (date.includes('T')) {
        const iosFriendlyDate = date.replace('T', ' ').replace(/\..*/, '');
        d = new Date(iosFriendlyDate.replace(/-/g, '/'));
      } else if (date.includes(' ') && date.includes('-')) {
        d = new Date(date.replace(/-/g, '/'));
      } else {
        d = new Date(date);
      }
    } else {
      d = new Date(date);
    }
    
    if (isNaN(d.getTime())) {
      return '时间格式错误';
    }
    
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    const second = d.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  },

  parseDate(date) {
    if (typeof date === 'string' && date.includes(' ') && date.includes('-')) {
      const iosFriendlyDate = date.replace(/-/g, '/');
      return new Date(iosFriendlyDate);
    }
    return new Date(date);
  }
});