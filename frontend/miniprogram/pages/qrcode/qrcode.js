// 签到二维码页面
const { get } = require('../../utils/request');
const auth = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    hasPermission: false,
    events: [],
    eventIndex: -1,
    currentEvent: null,
    showQRCode: false,
    expireTime: ''
  },

  onLoad() {
    this.checkPermission();
  },

  onShow() {
    if (this.data.hasPermission) {
      this.loadEvents();
    }
  },

  checkPermission() {
    const role = auth.getCurrentUserRole();
    const hasPermission = role === 'admin' || role === 'organizer';
    this.setData({ hasPermission });

    if (!hasPermission) {
      wx.showModal({
        title: '权限不足',
        content: '仅组织者和管理员可以使用签到二维码功能',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  async loadEvents() {
    try {
      wx.showLoading({ title: '加载中...' });
      const res = await get('/events/list', { limit: 100 });
      wx.hideLoading();

      if (res.code === 200 && res.data) {
        const now = new Date();
        // 过滤掉已结束和已取消的活动
        const activeEvents = res.data.filter(event => {
          if (event.status === 'cancelled') return false;
          const endTime = this.parseDate(event.end_time || event.start_time || event.time);
          return endTime >= now;
        });

        // 按时间排序
        activeEvents.sort((a, b) => {
          const timeA = this.parseDate(a.start_time || a.time).getTime();
          const timeB = this.parseDate(b.start_time || b.time).getTime();
          return timeA - timeB;
        });

        this.setData({ 
          events: activeEvents,
          eventIndex: activeEvents.length > 0 ? 0 : -1,
          currentEvent: activeEvents.length > 0 ? activeEvents[0] : null
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('加载活动失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onEventChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      eventIndex: index,
      currentEvent: this.data.events[index],
      showQRCode: false
    });
  },

  generateQRCode() {
    if (!this.data.currentEvent) {
      wx.showToast({ title: '请先选择活动', icon: 'none' });
      return;
    }

    const event = this.data.currentEvent;
    const timestamp = Date.now();
    const validUntil = timestamp + 30 * 60 * 1000;

    // 二维码内容：活动ID
    const qrString = event.event_id;
    console.log('二维码内容:', qrString);

    // 使用标准的 weapp-qrcode-canvas-2d 库
    const drawQrcode = require('../../utils/weapp.qrcode.min.js');
    const that = this;

    // 显示生成中的提示
    that.setData({ showQRCode: true });
    
    // 延迟确保 canvas 已渲染
    setTimeout(() => {
      try {
        // 使用 Canvas 2D API
        const query = wx.createSelectorQuery().in(that);
        query.select('#qrcode')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res && res[0] && res[0].node) {
              // Canvas 2D 模式
              const canvas = res[0].node;
              
              drawQrcode({
                canvas: canvas,
                width: 280,
                height: 280,
                text: qrString,
                correctLevel: 3, // Q级别纠错
                padding: 0
              });
              
              console.log('二维码生成成功 (Canvas 2D)');
              
              const expireDate = new Date(validUntil);
              const expireTime = that.formatTime(expireDate);

              that.setData({
                expireTime: expireTime
              });
            } else {
              // 旧版 API 模式
              drawQrcode({
                canvasId: 'qrcode',
                width: 280,
                height: 280,
                text: qrString,
                correctLevel: 3,
                padding: 0
              });
              
              console.log('二维码生成成功 (旧版 API)');
              
              const expireDate = new Date(validUntil);
              const expireTime = that.formatTime(expireDate);

              that.setData({
                expireTime: expireTime
              });
            }
          });
      } catch (err) {
        console.error('生成二维码失败:', err);
        wx.showToast({ title: '生成失败，请重试', icon: 'none' });
      }
    }, 100);
  },

  saveQRCode() {
    // 先尝试新版API
    const query = wx.createSelectorQuery().in(this);
    query.select('#qrcode')
      .fields({ node: true })
      .exec((res) => {
        if (res && res[0] && res[0].node) {
          // 新版 Canvas 2D
          const canvas = res[0].node;
          wx.canvasToTempFilePath({
            canvas: canvas,
            success: (res) => {
              this.saveToAlbum(res.tempFilePath);
            },
            fail: () => {
              // 失败时尝试旧版API
              this.saveWithOldAPI();
            }
          }, this);
        } else {
          // 使用旧版API
          this.saveWithOldAPI();
        }
      });
  },

  saveWithOldAPI() {
    wx.canvasToTempFilePath({
      canvasId: 'qrcode',
      success: (res) => {
        this.saveToAlbum(res.tempFilePath);
      },
      fail: () => {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }, this);
  },

  saveToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        wx.showToast({ title: '保存成功', icon: 'success' });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '请授权保存图片到相册',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  parseDate(dateStr) {
    if (!dateStr) return new Date();
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      return new Date(dateStr.replace(/-/g, '/'));
    }
    return new Date(dateStr);
  },

  formatTime(date) {
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
  }
});