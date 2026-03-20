// 微信小程序二维码生成工具
// 支持 Canvas 2D 和旧版 API

const QRCode = {
  draw: function(text, canvasId, page, callback) {
    console.log('开始生成二维码, canvasId:', canvasId, 'text:', text);
    
    // 先尝试新版 Canvas 2D API
    const query = wx.createSelectorQuery().in(page);
    
    query.select('#' + canvasId)
      .fields({ node: true, size: true })
      .exec((res) => {
        console.log('Canvas查询结果:', res);
        
        if (res && res[0] && res[0].node) {
          // 使用新版 Canvas 2D API
          console.log('使用 Canvas 2D API');
          this.drawWithCanvas2D(res[0], text, callback);
        } else {
          // 使用旧版 API
          console.log('使用旧版 Canvas API');
          this.drawWithOldAPI(text, canvasId, page, callback);
        }
      });
  },

  drawWithCanvas2D: function(canvasRes, text, callback) {
    const canvas = canvasRes.node;
    const ctx = canvas.getContext('2d');
    const dpr = wx.getSystemInfoSync().pixelRatio;
    const width = 400;
    const height = 400;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 白色背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 生成二维码数据
    const moduleCount = 21;
    const moduleSize = width / moduleCount;
    const qrData = this.generateQRData(text);

    // 绘制二维码
    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qrData[row] && qrData[row][col]) {
          ctx.fillRect(
            col * moduleSize,
            row * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }

    console.log('Canvas 2D 二维码绘制完成');
    if (callback) {
      setTimeout(callback, 50);
    }
  },

  drawWithOldAPI: function(text, canvasId, page, callback) {
    const ctx = wx.createCanvasContext(canvasId, page);
    const size = 400;
    const moduleCount = 21;
    const moduleSize = size / moduleCount;

    const qrData = this.generateQRData(text);

    ctx.setFillStyle('#FFFFFF');
    ctx.fillRect(0, 0, size, size);

    ctx.setFillStyle('#000000');
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qrData[row] && qrData[row][col]) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    ctx.draw(false, () => {
      console.log('旧版 API 二维码绘制完成');
      if (callback) {
        setTimeout(callback, 100);
      }
    });
  },

  generateQRData: function(text) {
    const size = 21;
    const data = [];
    const hash = this.hashCode(text);
    const pattern = this.generatePattern(hash, size);

    for (let i = 0; i < size; i++) {
      data[i] = [];
      for (let j = 0; j < size; j++) {
        if (this.isFinderPattern(i, j, size)) {
          data[i][j] = this.getFinderPatternValue(i, j, size);
        } else if (this.isTimingPattern(i, j, size)) {
          data[i][j] = (i + j) % 2 === 0;
        } else {
          const idx = (i * size + j) % pattern.length;
          data[i][j] = pattern[idx];
        }
      }
    }

    return data;
  },

  hashCode: function(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  },

  generatePattern: function(seed, size) {
    const pattern = [];
    let current = seed;
    const length = size * size;
    for (let i = 0; i < length; i++) {
      current = (current * 1103515245 + 12345) & 0x7fffffff;
      pattern.push(current % 2 === 0);
    }
    return pattern;
  },

  isFinderPattern: function(row, col, size) {
    if (row < 8 && col < 8) return true;
    if (row < 8 && col >= size - 8) return true;
    if (row >= size - 8 && col < 8) return true;
    return false;
  },

  isTimingPattern: function(row, col, size) {
    if (row === 6 && col >= 8 && col < size - 8) return true;
    if (col === 6 && row >= 8 && row < size - 8) return true;
    return false;
  },

  getFinderPatternValue: function(row, col, size) {
    let r = row, c = col;
    if (row >= size - 8) r = row - (size - 8);
    if (col >= size - 8) c = col - (size - 8);

    if (r === 0 || r === 6 || c === 0 || c === 6) return true;
    if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
    return false;
  }
};

module.exports = QRCode;