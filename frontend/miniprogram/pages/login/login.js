// 登录页
const auth = require('../../utils/auth');

Page({
  data: {
    isLogin: true,
    loginForm: {
      identifier: '',
      password: ''
    },
    registerForm: {
      user_id: '',
      username: '',
      password: '',
      confirmPassword: '',
      real_name: '',
      email: '',
      phone: ''
    },
    loading: false,
    agreeProtocol: false,
    errors: {}
  },

  onLoad() {
    if (auth.checkLogin()) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  // 切换模式
  switchMode() {
    this.setData({
      isLogin: !this.data.isLogin,
      errors: {}
    });
  },

  // 登录表单输入
  onLoginInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`loginForm.${field}`]: e.detail.value,
      [`errors.${field}`]: ''
    });
  },

  // 注册表单输入
  onRegisterInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`registerForm.${field}`]: e.detail.value,
      [`errors.${field}`]: ''
    });
  },

  // 协议勾选
  onAgreeChange(e) {
    this.setData({ agreeProtocol: e.detail.value.length > 0 });
  },

  // 验证登录表单
  validateLogin() {
    const { identifier, password } = this.data.loginForm;
    const errors = {};

    if (!identifier) errors.identifier = '请输入用户名';
    if (!password) errors.password = '请输入密码';
    else if (password.length < 6) errors.password = '密码至少6位';

    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  // 验证注册表单
  validateRegister() {
    const form = this.data.registerForm;
    const errors = {};

    if (!form.user_id) errors.user_id = '请输入学号';
    if (!form.username) errors.username = '请输入用户名';
    if (!form.real_name) errors.real_name = '请输入真实姓名';
    if (!form.password) errors.password = '请输入密码';
    else if (form.password.length < 6) errors.password = '密码至少6位';
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = '两次密码不一致';
    }
    if (!this.data.agreeProtocol) {
      wx.showToast({ title: '请同意用户协议', icon: 'none' });
      return false;
    }

    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  // 处理登录
  async onLogin() {
    if (!this.validateLogin()) return;

    this.setData({ loading: true });

    try {
      await auth.login(this.data.loginForm.identifier, this.data.loginForm.password);
    } catch (err) {
      console.error('登录失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 处理注册
  async onRegister() {
    if (!this.validateRegister()) return;

    this.setData({ loading: true });

    try {
      await auth.register(this.data.registerForm);
      wx.showToast({ title: '注册成功', icon: 'success' });
      setTimeout(() => this.setData({ isLogin: true }), 1500);
    } catch (err) {
      console.error('注册失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 游客登录
  onGuestLogin() {
    wx.showModal({
      title: '游客模式',
      content: '游客模式只能浏览活动，无法报名和签到。确定继续？',
      success: (res) => {
        if (res.confirm) {
          const guestInfo = {
            user_id: 'guest',
            user_name: '游客',
            real_name: '游客',
            role: 'guest'
          };
          wx.setStorageSync('userInfo', guestInfo);
          wx.setStorageSync('token', 'guest-token');
          getApp().globalData.userInfo = guestInfo;
          getApp().globalData.token = 'guest-token';
          wx.switchTab({ url: '/pages/index/index' });
        }
      }
    });
  },

  // 清除表单
  clearForm() {
    this.setData({
      loginForm: { identifier: '', password: '' },
      registerForm: {
        user_id: '', username: '', password: '',
        confirmPassword: '', real_name: '', email: '', phone: ''
      }
    });
  }
});