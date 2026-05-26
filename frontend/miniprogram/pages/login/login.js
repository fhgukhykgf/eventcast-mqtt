// 登录页
const auth = require('../../utils/auth');

Page({
  data: {
    isLogin: true,
    loginForm: {
      identifier: '',
      password: '',
      captchaCode: ''
    },
    captchaId: '',
    captchaImage: '',
    registerForm: {
      user_id: '',
      username: '',
      password: '',
      confirmPassword: '',
      real_name: '',
      email: '',
      phone: '',
      role: 'student'
    },
    loading: false,
    agreeProtocol: false,
    errors: {}
  },

  onLoad() {
    if (auth.checkLogin()) {
      wx.switchTab({ url: '/pages/index/index' });
    } else {
      this.loadCaptcha();
    }
  },

  async loadCaptcha() {
    try {
      const captchaData = await auth.getCaptcha();
      console.log('验证码获取成功:', captchaData);
      this.setData({
        captchaId: captchaData.captcha_id,
        captchaImage: captchaData.captcha_image
      });
    } catch (err) {
      console.error('获取验证码失败:', err);
    }
  },

  refreshCaptcha() {
    this.setData({ 'loginForm.captchaCode': '' });
    this.loadCaptcha();
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
    this.setData({ agreeProtocol: e.detail.value.includes('agree') });
  },

  // 验证登录表单
  validateLogin() {
    const { identifier, password, captchaCode } = this.data.loginForm;
    const errors = {};

    if (!identifier) errors.identifier = '请输入用户名';
    if (!password) errors.password = '请输入密码';
    else if (password.length < 6) errors.password = '密码至少6位';
    if (!captchaCode) errors.captchaCode = '请输入验证码';

    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  // 验证注册表单
  validateRegister() {
    const form = this.data.registerForm;
    const errors = {};

    if (!form.user_id) errors.user_id = '请输入学号';
    else if (form.user_id.length < 3) errors.user_id = '学号至少3位';
    
    if (!form.username) errors.username = '请输入用户名';
    else if (form.username.length < 3) errors.username = '用户名至少3位';
    
    if (!form.real_name) errors.real_name = '请输入真实姓名';
    else if (form.real_name.length < 2) errors.real_name = '姓名至少2位';
    
    if (!form.password) errors.password = '请输入密码';
    else if (form.password.length < 6) errors.password = '密码至少6位';
    
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = '两次密码不一致';
    }
    
    // 前端预验证邮箱格式
    if (form.email && form.email.trim()) {
      const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
      if (!emailRegex.test(form.email)) {
        errors.email = '邮箱格式不正确';
      }
    }
    
    // 前端预验证手机号格式
    if (form.phone && form.phone.trim()) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(form.phone)) {
        errors.phone = '手机号格式不正确（11位）';
      }
    }
    
    if (!this.data.agreeProtocol) {
      wx.showToast({ title: '请同意用户协议', icon: 'none' });
      return false;
    }

    this.setData({ errors });
    
    if (Object.keys(errors).length > 0) {
      // 显示第一个错误
      const firstError = Object.values(errors)[0];
      wx.showToast({ title: firstError, icon: 'none', duration: 2000 });
      return false;
    }
    
    return Object.keys(errors).length === 0;
  },

  // 处理登录
  async onLogin() {
    if (!this.validateLogin()) return;

    this.setData({ loading: true });

    try {
      await auth.login(
        this.data.loginForm.identifier,
        this.data.loginForm.password,
        this.data.captchaId,
        this.data.loginForm.captchaCode
      );
    } catch (err) {
      console.error('登录失败:', err);
      // 登录失败刷新验证码
      this.refreshCaptcha();
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
      // 错误信息已经在 request.js 中通过 toast 显示了
      // 这里可以添加额外的错误处理逻辑
    } finally {
      this.setData({ loading: false });
    }
  },

  // 清除表单
  clearForm() {
    this.setData({
      loginForm: { identifier: '', password: '', captchaCode: '' },
      registerForm: {
        user_id: '', username: '', password: '',
        confirmPassword: '', real_name: '', email: '', phone: ''
      }
    });
  }
});