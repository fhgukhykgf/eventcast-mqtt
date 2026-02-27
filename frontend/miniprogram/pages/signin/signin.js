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
    showSuccess: false,
    signResult: {
      sign_time: ''
    },
    location: {
      available: false,
      address: '正在获取位置...'
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

    this.getLocation();
  },

  onShow() {
    if (this.data.eventId) {
      this.loadUserStatus();
    }
  },

  async loadEventInfo(eventId) {
    try {
      const res = await get(`/events/detail/${eventId}`);
      this.setData({ event: res });
      this.loadUserStatus();
    } catch (err) {
      console.error('加载活动失败:', err);
      getApp().showToast('加载活动失败');
    }
  },

  async loadUserStatus() {
    const userId = auth.getCurrentUserId();
    if (!userId || !this.data.eventId) return;

    try {
      const res = await get(`/sign/status/${this.data.eventId}/${userId}`);
      this.setData({ userStatus: res });
    } catch (err) {
      console.error('加载状态失败:', err);
    }
  },

  getLocation() {
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        this.setData({
          location: {
            available: true,
            latitude: res.latitude,
            longitude: res.longitude,
            address: `${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)}`
          }
        });
      },
      fail: () => {
        this.setData({
          'location.available': false,
          'location.address': '获取位置失败'
        });
      }
    });
  },

  onScan() {
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        const eventId = res.result;
        this.setData({ eventId });
        this.loadEventInfo(eventId);

        // 如果可以签到，自动触发
        if (this.canSign()) {
          this.onSign();
        }
      },
      fail: (err) => {
        if (!err.errMsg.includes('cancel')) {
          getApp().showToast('扫码失败');
        }
      }
    });
  },

  async onSign() {
    if (!this.canSign()) {
      getApp().showToast('当前无法签到');
      return;
    }

    this.setData({ signing: true });

    try {
      const res = await post('/sign/in', {
        event_id: this.data.eventId,
        user_id: auth.getCurrentUserId(),
        user_name: auth.getCurrentUser().real_name,
        sign_location: this.data.location.address
      });

      this.setData({
        showSuccess: true,
        signResult: {
          sign_time: res.sign_time || new Date().toLocaleString()
        },
        'userStatus.hasSigned': true
      });

      // 3秒后关闭成功提示
      setTimeout(() => {
        this.setData({ showSuccess: false });
        wx.navigateBack();
      }, 3000);

    } catch (err) {
      console.error('签到失败:', err);
      getApp().showToast(err.message || '签到失败');
    } finally {
      this.setData({ signing: false });
    }
  },

  canSign() {
    const { event, userStatus } = this.data;
    if (!event || !userStatus.hasApplied) return false;
    if (userStatus.hasSigned) return false;

    const now = new Date();
    const eventTime = new Date(event.time);
    // 活动开始前30分钟可签到
    return now >= new Date(eventTime - 30 * 60 * 1000);
  },

  onInputEventId(e) {
    this.setData({ eventId: e.detail.value });
    if (e.detail.value) {
      this.loadEventInfo(e.detail.value);
    }
  }
});