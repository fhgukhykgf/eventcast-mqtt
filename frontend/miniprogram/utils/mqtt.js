// /frontend/utils/mqtt.js - MQTT客户端工具
const app = getApp();

class MqttManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.messageHandlers = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * 连接MQTT服务器
   * @param {Function} onMessageCallback 消息回调函数
   */
  connect(onMessageCallback) {
    // 微信小程序使用WebSocket连接MQTT over WebSocket
    // EMQ X默认WebSocket端口是8083 (ws) 或 8084 (wss)
    const mqttWsUrl = 'ws://192.168.1.64:8083/mqtt';  // 修改为你的EMQ X服务器IP

    console.log('🔌 正在连接MQTT服务器...', mqttWsUrl);

    this.client = wx.connectSocket({
      url: mqttWsUrl,
      success: () => {
        console.log('✅ WebSocket连接创建成功');
      },
      fail: (err) => {
        console.error('❌ WebSocket连接失败:', err);
        this.reconnect();
      }
    });

    // 连接打开
    this.client.onOpen(() => {
      console.log('✅ MQTT连接成功');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // 发送MQTT连接包
      this.sendConnectPacket();

      // 订阅默认主题
      this.subscribeDefaultTopics();
    });

    // 收到消息
    this.client.onMessage((res) => {
      this.handleMessage(res);
      if (onMessageCallback) {
        onMessageCallback(res);
      }
    });

    // 连接关闭
    this.client.onClose(() => {
      console.log('🔌 MQTT连接关闭');
      this.isConnected = false;
      this.reconnect();
    });

    // 连接错误
    this.client.onError((err) => {
      console.error('❌ MQTT连接错误:', err);
      this.isConnected = false;
      this.reconnect();
    });
  }

  /**
   * 发送MQTT连接包
   */
  sendConnectPacket() {
    // MQTT over WebSocket 需要发送连接包
    // 这里简化处理，实际需要实现MQTT协议
    const connectPacket = {
      cmd: 'connect',
      protocolVersion: 4,
      cleanSession: true,
      clientId: 'wx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
      keepAlive: 60,
      username: 'admin',      // EMQ X用户名
      password: 'public'      // EMQ X密码
    };

    if (this.client) {
      this.client.send({
        data: JSON.stringify(connectPacket)
      });
    }
  }

  /**
   * 订阅默认主题
   */
  subscribeDefaultTopics() {
    const userId = app.globalData.userInfo?.user_id;
    if (!userId) return;

    // 订阅个人通知
    this.subscribe(`user/${userId}/notice`);

    // 订阅系统广播
    this.subscribe('system/broadcast');

    console.log('📡 已订阅默认主题');
  }

  /**
   * 订阅主题
   * @param {string} topic 主题
   */
  subscribe(topic) {
    if (!this.isConnected || !this.client) {
      console.warn('MQTT未连接，无法订阅');
      return;
    }

    const subscribePacket = {
      cmd: 'subscribe',
      subscriptions: [{
        topic: topic,
        qos: 1
      }]
    };

    this.client.send({
      data: JSON.stringify(subscribePacket)
    });

    console.log(`📡 已订阅主题: ${topic}`);
  }

  /**
   * 取消订阅
   * @param {string} topic 主题
   */
  unsubscribe(topic) {
    if (!this.isConnected || !this.client) return;

    const unsubscribePacket = {
      cmd: 'unsubscribe',
      topics: [topic]
    };

    this.client.send({
      data: JSON.stringify(unsubscribePacket)
    });
  }

  /**
   * 处理接收到的消息
   * @param {Object} res WebSocket消息
   */
  handleMessage(res) {
    try {
      const data = JSON.parse(res.data);
      console.log('📨 收到MQTT消息:', data);

      // 根据消息类型处理
      if (data.cmd === 'publish') {
        const topic = data.topic;
        const payload = JSON.parse(data.payload);

        // 触发对应主题的回调
        if (this.messageHandlers[topic]) {
          this.messageHandlers[topic].forEach(handler => handler(payload));
        }

        // 全局消息处理
        this.handleMessageByType(payload);
      }
    } catch (e) {
      console.error('解析MQTT消息失败:', e, res.data);
    }
  }

  /**
   * 根据消息类型处理
   * @param {Object} payload 消息内容
   */
  handleMessageByType(payload) {
    const { type } = payload;

    switch (type) {
      case 'event_create':
        // 新活动创建通知
        wx.showToast({
          title: '新活动发布',
          icon: 'none',
          duration: 3000
        });
        // 刷新活动列表
        this.refreshEvents();
        break;

      case 'apply_success':
        // 报名成功通知（其他人报名）
        if (payload.user_id !== app.globalData.userInfo?.user_id) {
          wx.showToast({
            title: `${payload.user_name} 报名了活动`,
            icon: 'none',
            duration: 2000
          });
        }
        break;

      case 'sign_in':
        // 签到通知
        wx.showToast({
          title: `${payload.user_name} 签到成功`,
          icon: 'none',
          duration: 2000
        });
        // 刷新当前页面数据
        this.refreshCurrentPage();
        break;

      case 'event_update':
        // 活动更新通知
        wx.showToast({
          title: '活动信息已更新',
          icon: 'none',
          duration: 2000
        });
        this.refreshCurrentPage();
        break;

      case 'event_delete':
        // 活动删除通知
        wx.showToast({
          title: '活动已取消',
          icon: 'none',
          duration: 2000
        });
        this.refreshEvents();
        break;

      default:
        console.log('未知消息类型:', type);
    }
  }

  /**
   * 添加消息处理器
   * @param {string} topic 主题
   * @param {Function} handler 处理函数
   */
  addMessageHandler(topic, handler) {
    if (!this.messageHandlers[topic]) {
      this.messageHandlers[topic] = [];
    }
    this.messageHandlers[topic].push(handler);
  }

  /**
   * 移除消息处理器
   * @param {string} topic 主题
   * @param {Function} handler 处理函数
   */
  removeMessageHandler(topic, handler) {
    if (this.messageHandlers[topic]) {
      this.messageHandlers[topic] = this.messageHandlers[topic].filter(h => h !== handler);
    }
  }

  /**
   * 重连机制
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ 重连次数已达上限');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`🔄 ${delay}ms后尝试重连... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.client) {
      this.client.close();
      this.isConnected = false;
    }
  }

  /**
   * 刷新活动列表
   */
  refreshEvents() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];

    if (currentPage && typeof currentPage.loadEvents === 'function') {
      currentPage.loadEvents(true);
    }
  }

  /**
   * 刷新当前页面
   */
  refreshCurrentPage() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];

    if (currentPage && typeof currentPage.loadData === 'function') {
      currentPage.loadData();
    } else if (currentPage && typeof currentPage.onShow === 'function') {
      currentPage.onShow();
    }
  }
}

// 创建单例
const mqttManager = new MqttManager();

module.exports = mqttManager;