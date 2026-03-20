// /frontend/utils/mqtt.js - MQTT over WebSocket客户端

class MqttManager {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isSocketReady = false;
    this.messageHandlers = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.pendingSubscriptions = [];
    this.options = {
      clientId: 'wx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
      keepalive: 60,
      clean: true
    };
    this.mqttWsUrl = null;
    this.messageId = 1;
    this.notifications = []; // 本地通知列表
  }

  // 获取通知列表
  getNotifications() {
    return this.notifications;
  }

  // 添加通知
  addNotification(notification) {
    const notificationData = {
      id: Date.now(),
      ...notification,
      read: false,
      time: new Date().toISOString()
    };
    this.notifications.unshift(notificationData);
    
    // 最多保留50条通知
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    
    return notificationData;
  }

  // 标记通知已读
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // 全部标记已读
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
  }

  // 清空通知
  clearNotifications() {
    this.notifications = [];
  }

  // 获取未读数量
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  getMqttUrl() {
    if (this.mqttWsUrl) {
      return this.mqttWsUrl;
    }
    try {
      const app = getApp();
      if (app && app.globalData && app.globalData.mqttWsUrl) {
        return app.globalData.mqttWsUrl;
      }
    } catch (e) {
      console.warn('无法获取全局配置');
    }
    return 'ws://192.168.1.64:8083/mqtt';
  }

  connect(onMessageCallback) {
    if (this.ws && this.isConnected) {
      console.log('✅ MQTT已连接');
      return;
    }

    const mqttUrl = this.getMqttUrl();
    console.log('🔌 正在连接MQTT服务器...', mqttUrl);
    
    // 重置状态
    this.isConnected = false;
    this.isSocketReady = false;

    this.ws = wx.connectSocket({
      url: mqttUrl,
      protocols: ['mqtt'],
      success: () => {
        console.log('✅ WebSocket连接创建成功');
      },
      fail: (err) => {
        console.error('❌ WebSocket连接失败:', err);
        this.isConnected = false;
        this.isSocketReady = false;
      }
    });

    this.ws.onOpen(() => {
      console.log('✅ WebSocket已打开');
      this.isSocketReady = true;
      // 发送MQTT连接包
      this.sendConnectPacket();
    });

    this.ws.onMessage((res) => {
      this.handleMessage(res.data, onMessageCallback);
    });

    this.ws.onClose((res) => {
      console.log('🔌 WebSocket连接关闭', res);
      this.isConnected = false;
      this.isSocketReady = false;
      
      // 尝试重连
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => {
          this.connect(onMessageCallback);
        }, 2000);
      }
    });

    this.ws.onError((err) => {
      console.error('❌ WebSocket错误:', err);
      this.isConnected = false;
      this.isSocketReady = false;
    });
  }

  // 发送MQTT连接包
  sendConnectPacket() {
    if (!this.ws) {
      console.warn('⏳ WebSocket不存在');
      return;
    }

    const clientId = this.options.clientId;
    const keepalive = this.options.keepalive;
    
    // 构建MQTT CONNECT包
    const packet = this.buildConnectPacket(clientId, keepalive);
    
    const doSend = () => {
      if (!this.ws || !this.isSocketReady) {
        console.warn('⏳ WebSocket未就绪，稍后重试发送连接包');
        setTimeout(doSend, 200);
        return;
      }

      this.ws.send({
        data: packet,
        success: () => {
          console.log('✅ MQTT连接包已发送');
          this.reconnectAttempts = 0;
          // 等待 CONNACK 响应后在 handleMessage 中设置 isConnected
        },
        fail: (err) => {
          console.error('❌ 发送MQTT连接包失败:', err);
          this.isConnected = false;
        }
      });
    };

    doSend();
  }

  // 构建MQTT CONNECT包
  buildConnectPacket(clientId, keepalive) {
    const protocolName = 'MQTT';
    const protocolLevel = 4; // MQTT 3.1.1
    const connectFlags = 0x02; // Clean Session
    
    const clientIdBytes = this.stringToBytes(clientId);
    const protocolNameBytes = this.stringToBytes(protocolName);
    
    // 可变头长度: 2 + 4 + 1 + 1 + 2 = 10
    // Payload: 2 + clientId.length
    const variableHeaderLength = 2 + protocolNameBytes.length + 1 + 1 + 2;
    const payloadLength = 2 + clientIdBytes.length;
    const remainingLength = variableHeaderLength + payloadLength;
    
    // 创建完整包
    const packet = new Uint8Array(1 + 1 + remainingLength);
    let offset = 0;
    
    // 固定头: Type (1) + Remaining Length (1)
    packet[offset++] = 0x10; // CONNECT
    packet[offset++] = remainingLength;
    
    // 可变头
    // Protocol Name
    packet[offset++] = 0x00;
    packet[offset++] = protocolNameBytes.length;
    for (let i = 0; i < protocolNameBytes.length; i++) {
      packet[offset++] = protocolNameBytes[i];
    }
    
    // Protocol Level
    packet[offset++] = protocolLevel;
    
    // Connect Flags
    packet[offset++] = connectFlags;
    
    // Keep Alive
    packet[offset++] = (keepalive >> 8) & 0xFF;
    packet[offset++] = keepalive & 0xFF;
    
    // Payload: Client ID
    packet[offset++] = 0x00;
    packet[offset++] = clientIdBytes.length;
    for (let i = 0; i < clientIdBytes.length; i++) {
      packet[offset++] = clientIdBytes[i];
    }
    
    console.log('📦 MQTT CONNECT包:', Array.from(packet).map(b => b.toString(16).padStart(2, '0')).join(' '));
    
    return packet.buffer;
  }

  // 字符串转字节数组
  stringToBytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  }

  subscribeDefaultTopics() {
    const app = getApp();
    if (!app || !app.globalData || !app.globalData.userInfo) {
      console.warn('用户未登录，跳过订阅默认主题');
      return;
    }

    const userId = app.globalData.userInfo.user_id;
    if (!userId) return;

    this.subscribe(`user/${userId}/notice`);
    this.subscribe('system/broadcast');

    console.log('📡 已订阅默认主题');
  }

  processPendingSubscriptions() {
    if (this.pendingSubscriptions.length === 0) return;
    
    // 确保连接状态正确
    if (!this.ws || !this.isConnected || !this.isSocketReady) {
      console.log('⏳ 连接未就绪，延迟处理待订阅主题');
      setTimeout(() => this.processPendingSubscriptions(), 500);
      return;
    }
    
    console.log(`📡 处理 ${this.pendingSubscriptions.length} 个待订阅主题`);
    
    // 复制并清空队列，避免重复处理
    const pending = [...this.pendingSubscriptions];
    this.pendingSubscriptions = [];
    
    // 逐个订阅，间隔50ms避免并发问题
    pending.forEach((item, index) => {
      setTimeout(() => {
        this._doSubscribe(item.topic, item.qos);
      }, index * 50);
    });
  }

  subscribe(topic, qos = 0) {
    if (!this.ws || !this.isConnected || !this.isSocketReady) {
      console.warn('⏳ MQTT未连接，加入待订阅队列:', topic);
      this.pendingSubscriptions.push({ topic, qos });
      return;
    }

    this._doSubscribe(topic, qos);
  }

  _doSubscribe(topic, qos = 0) {
    // 检查连接状态
    if (!this.ws || !this.isConnected || !this.isSocketReady) {
      console.warn(`⏳ MQTT未就绪，订阅 ${topic} 加入队列`);
      this.pendingSubscriptions.push({ topic, qos });
      return;
    }

    const packetId = this.messageId++;
    const topicBytes = this.stringToBytes(topic);
    
    // 构建SUBSCRIBE包
    const remainingLength = 2 + 2 + topicBytes.length + 1;
    const fixedHeader = new Uint8Array([0x82, remainingLength]);
    
    const variableHeader = new Uint8Array([
      (packetId >> 8) & 0xFF,
      packetId & 0xFF
    ]);
    
    const payload = new Uint8Array([
      0x00, topicBytes.length,
      ...topicBytes,
      qos
    ]);
    
    const packet = new Uint8Array(fixedHeader.length + variableHeader.length + payload.length);
    packet.set(fixedHeader, 0);
    packet.set(variableHeader, fixedHeader.length);
    packet.set(payload, fixedHeader.length + variableHeader.length);
    
    this.ws.send({
      data: packet.buffer,
      success: () => {
        console.log(`📡 已订阅主题: ${topic}`);
      },
      fail: (err) => {
        console.error(`订阅主题失败 ${topic}:`, err);
        // 如果发送失败，重新加入队列
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.pendingSubscriptions.push({ topic, qos });
        }
      }
    });
  }

  unsubscribe(topic) {
    if (!this.ws || !this.isConnected || !this.isSocketReady) {
      this.pendingSubscriptions = this.pendingSubscriptions.filter(
        item => item.topic !== topic
      );
      return;
    }

    const packetId = this.messageId++;
    const topicBytes = this.stringToBytes(topic);
    
    const remainingLength = 2 + 2 + topicBytes.length;
    const fixedHeader = new Uint8Array([0xA2, remainingLength]);
    
    const variableHeader = new Uint8Array([
      (packetId >> 8) & 0xFF,
      packetId & 0xFF
    ]);
    
    const payload = new Uint8Array([
      0x00, topicBytes.length,
      ...topicBytes
    ]);
    
    const packet = new Uint8Array(fixedHeader.length + variableHeader.length + payload.length);
    packet.set(fixedHeader, 0);
    packet.set(variableHeader, fixedHeader.length);
    packet.set(payload, fixedHeader.length + variableHeader.length);
    
    this.ws.send({
      data: packet.buffer,
      success: () => {
        console.log(`📡 已取消订阅: ${topic}`);
      }
    });
  }

  handleMessage(data, onMessageCallback) {
    try {
      // 检查是否是二进制数据（MQTT 包）
      if (data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(data);
        const packetType = bytes[0] >> 4;
        
        console.log('📨 收到MQTT包, 类型:', packetType, '数据:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
        
        // CONNACK (packet type 2)
        if (packetType === 2) {
          const returnCode = bytes[3];
          if (returnCode === 0) {
            console.log('✅ MQTT连接成功 (CONNACK)');
            this.isConnected = true;
            
            // 延迟订阅主题
            setTimeout(() => {
              this.subscribeDefaultTopics();
              this.processPendingSubscriptions();
            }, 100);
          } else {
            console.error('❌ MQTT连接被拒绝, 返回码:', returnCode);
          }
          return;
        }
        
        // SUBACK (packet type 9)
        if (packetType === 9) {
          console.log('✅ 订阅确认 (SUBACK)');
          return;
        }
        
        // PUBLISH (packet type 3)
        if (packetType === 3) {
          console.log('📨 收到PUBLISH消息');
          const result = this.parsePublishPacket(bytes);
          if (result) {
            console.log('📨 解析PUBLISH消息:', result);
            
            if (onMessageCallback) {
              onMessageCallback({ topic: result.topic, payload: result.payload });
            }

            if (result.topic && this.messageHandlers[result.topic]) {
              this.messageHandlers[result.topic].forEach(handler => handler(result.payload));
            }

            this.handleMessageByType(result.payload);
          }
        }
        
        return;
      }
      
      // 如果是字符串，可能是JSON
      if (typeof data === 'string') {
        const payload = JSON.parse(data);
        console.log('📨 收到MQTT消息:', payload);
        
        if (onMessageCallback) {
          onMessageCallback({ topic: payload.topic, payload });
        }

        if (payload.topic && this.messageHandlers[payload.topic]) {
          this.messageHandlers[payload.topic].forEach(handler => handler(payload));
        }

        this.handleMessageByType(payload);
      }
    } catch (e) {
      console.warn('消息处理异常:', e);
    }
  }

  handleMessageByType(payload) {
    const { type } = payload;

    switch (type) {
      case 'event_create':
        this.addNotification({
          type: 'event_create',
          title: '新活动发布',
          content: `活动「${payload.title || ''}」已发布`,
          event_id: payload.event_id
        });
        wx.showToast({
          title: '新活动发布',
          icon: 'none',
          duration: 3000
        });
        this.refreshEvents();
        break;

      case 'apply_success':
        const app = getApp();
        if (!app || !app.globalData || !app.globalData.userInfo || payload.user_id !== app.globalData.userInfo.user_id) {
          this.addNotification({
            type: 'apply_success',
            title: '新报名通知',
            content: `${payload.user_name} 报名了活动`,
            event_id: payload.event_id
          });
          wx.showToast({
            title: `${payload.user_name} 报名了活动`,
            icon: 'none',
            duration: 2000
          });
        }
        break;

      case 'sign_in':
        this.addNotification({
          type: 'sign_in',
          title: '签到通知',
          content: `${payload.user_name} 签到成功`,
          event_id: payload.event_id
        });
        wx.showToast({
          title: `${payload.user_name} 签到成功`,
          icon: 'none',
          duration: 2000
        });
        this.refreshCurrentPage();
        break;

      case 'event_update':
        this.addNotification({
          type: 'event_update',
          title: '活动更新',
          content: `活动「${payload.event_title || ''}」信息已更新`,
          event_id: payload.event_id
        });
        wx.showToast({
          title: '活动信息已更新',
          icon: 'none',
          duration: 2000
        });
        this.refreshCurrentPage();
        break;

      case 'event_delete':
        this.addNotification({
          type: 'event_delete',
          title: '活动删除',
          content: `活动「${payload.event_title || ''}」已被删除`,
          event_id: payload.event_id
        });
        wx.showToast({
          title: '活动已取消',
          icon: 'none',
          duration: 2000
        });
        this.refreshEvents();
        break;

      case 'event_cancel':
        this.addNotification({
          type: 'event_cancel',
          title: '活动取消',
          content: `活动「${payload.event_title || ''}」已被取消`,
          event_id: payload.event_id
        });
        wx.showModal({
          title: '活动取消通知',
          content: `活动「${payload.event_title || ''}」已被取消`,
          showCancel: false
        });
        this.refreshEvents();
        break;

      default:
        console.log('未知消息类型:', type);
    }
  }

  addMessageHandler(topic, handler) {
    if (!this.messageHandlers[topic]) {
      this.messageHandlers[topic] = [];
    }
    this.messageHandlers[topic].push(handler);
  }

  removeMessageHandler(topic, handler) {
    if (this.messageHandlers[topic]) {
      this.messageHandlers[topic] = this.messageHandlers[topic].filter(h => h !== handler);
    }
  }

  parsePublishPacket(bytes) {
    try {
      console.log('📦 开始解析PUBLISH包, 字节数:', bytes.length);
      console.log('📦 原始字节:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      let offset = 0;
      
      // 固定头第一个字节
      const firstByte = bytes[offset++];
      const qos = (firstByte >> 1) & 0x03; // QoS level
      
      // 解析剩余长度（变长编码）
      let remainingLength = 0;
      let multiplier = 1;
      let byte;
      do {
        byte = bytes[offset++];
        remainingLength += (byte & 127) * multiplier;
        multiplier *= 128;
      } while ((byte & 128) !== 0);
      
      console.log('📦 QoS:', qos, '剩余长度:', remainingLength, '当前偏移:', offset);
      
      // 解析 topic 长度
      const topicLength = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;
      
      // 解析 topic
      const topicBytes = bytes.slice(offset, offset + topicLength);
      const topic = String.fromCharCode.apply(null, topicBytes);
      offset += topicLength;
      
      console.log('📦 Topic:', topic, '长度:', topicLength, '当前偏移:', offset);
      
      // 如果 QoS > 0，跳过 packet identifier (2 bytes)
      if (qos > 0) {
        offset += 2;
        console.log('📦 跳过Packet ID, 当前偏移:', offset);
      }
      
      // 解析 payload（剩余部分）
      const payloadLength = remainingLength - 2 - topicLength - (qos > 0 ? 2 : 0);
      const payloadBytes = bytes.slice(offset, offset + payloadLength);
      const payloadStr = String.fromCharCode.apply(null, payloadBytes);
      
      console.log('📦 Payload长度:', payloadLength, '内容:', payloadStr);
      
      // 尝试解析 JSON
      let payload;
      try {
        payload = JSON.parse(payloadStr);
      } catch (e) {
        payload = { raw: payloadStr };
      }
      
      console.log('📦 最终解析结果 - Topic:', topic, 'Payload:', payload);
      
      return { topic, payload };
    } catch (e) {
      console.error('❌ 解析PUBLISH包失败:', e);
      return null;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isSocketReady = false;
    this.pendingSubscriptions = [];
    console.log('🔌 MQTT已断开');
  }

  refreshEvents() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];

    if (currentPage) {
      // 首页使用loadData
      if (typeof currentPage.loadData === 'function') {
        currentPage.loadData();
      }
      // 活动列表页使用loadEvents
      if (typeof currentPage.loadEvents === 'function') {
        currentPage.loadEvents(true);
      }
    }
  }

  refreshCurrentPage() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];

    if (currentPage && typeof currentPage.loadData === 'function') {
      currentPage.loadData();
    } else if (currentPage && typeof currentPage.onShow === 'function') {
      currentPage.onShow();
    }
  }

  setMqttUrl(url) {
    this.mqttWsUrl = url;
  }
}

const mqttManager = new MqttManager();

module.exports = mqttManager;