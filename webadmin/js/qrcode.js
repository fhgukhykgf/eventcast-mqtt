var QRCode = (function() {
    var QRCode = {};
    
    QRCode.toCanvas = function(canvas, text, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        
        options = options || {};
        var width = options.width || 256;
        var margin = options.margin || 4;
        var color = options.color || { dark: '#000000', light: '#ffffff' };
        
        try {
            var modules = QRCode.createQRCode(text);
            var moduleCount = modules.length;
            var totalSize = moduleCount + margin * 2;
            var scale = width / totalSize;
            
            canvas.width = width;
            canvas.height = width;
            
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = color.light;
            ctx.fillRect(0, 0, width, width);
            
            ctx.fillStyle = color.dark;
            for (var y = 0; y < moduleCount; y++) {
                for (var x = 0; x < moduleCount; x++) {
                    if (modules[y][x]) {
                        ctx.fillRect(
                            (x + margin) * scale,
                            (y + margin) * scale,
                            scale,
                            scale
                        );
                    }
                }
            }
            
            callback(null, canvas);
        } catch (err) {
            callback(err);
        }
    };
    
    var gfExp = [];
    var gfLog = [];
    (function() {
        var x = 1;
        for (var i = 0; i < 256; i++) {
            gfExp[i] = x;
            gfLog[x] = i;
            x <<= 1;
            if (x & 256) x ^= 285;
        }
    })();
    
    function gfMul(a, b) {
        if (a === 0 || b === 0) return 0;
        return gfExp[(gfLog[a] + gfLog[b]) % 255];
    }
    
    function gfPow(a, b) {
        return gfExp[(gfLog[a] * b) % 255];
    }
    
    function generatePolynomial(degree) {
        var poly = [1];
        for (var i = 0; i < degree; i++) {
            poly = gfPolyMul(poly, [1, gfPow(2, i)]);
        }
        return poly;
    }
    
    function gfPolyMul(a, b) {
        var result = new Array(a.length + b.length - 1).fill(0);
        for (var i = 0; i < a.length; i++) {
            for (var j = 0; j < b.length; j++) {
                result[i + j] ^= gfMul(a[i], b[j]);
            }
        }
        return result;
    }
    
    function encodeData(text) {
        var mode = text.length > 0 && /^[\x00-\x7F]*$/.test(text) ? 4 : 8;
        var length = text.length;
        
        var data = [];
        data.push((mode << 4) | (length >> 8));
        data.push(length & 0xff);
        
        for (var i = 0; i < text.length; i++) {
            var code = text.charCodeAt(i);
            if (mode === 4) {
                data.push(code);
            } else {
                data.push((code >> 8) & 0xff);
                data.push(code & 0xff);
            }
        }
        
        return data;
    }
    
    QRCode.createQRCode = function(text) {
        var data = encodeData(text);
        var version = 1;  // 使用最小版本，提高扫描成功率
        var errorLevel = 2;
        
        var totalDataBits = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
        var dataBits = totalDataBits[version - 1] - 8 - 2;
        var dataBytes = Math.floor(dataBits / 8);
        
        var eccLevel = [[7, 10, 13, 17], [10, 16, 22, 28], [13, 22, 32, 43], [17, 28, 43, 58]];
        var eccBytes = eccLevel[errorLevel][version - 1];
        
        var paddedData = data.slice();
        var padByte = 236;
        while (paddedData.length < dataBytes) {
            paddedData.push(padByte);
            padByte = padByte === 236 ? 17 : 236;
        }
        
        var generator = generatePolynomial(eccBytes);
        var codewords = paddedData.slice();
        for (var i = 0; i < eccBytes; i++) codewords.push(0);
        
        for (var i = 0; i < paddedData.length; i++) {
            var coef = codewords[i];
            if (coef !== 0) {
                for (var j = 0; j < generator.length; j++) {
                    codewords[i + j] ^= gfMul(generator[j], coef);
                }
            }
        }
        
        var eccData = codewords.slice(-eccBytes);
        codewords = paddedData.concat(eccData);
        
        var moduleCount = 21;  // 版本1: 21x21模块
        var modules = createEmptyMatrix(moduleCount);
        
        addFinderPatterns(modules);
        addTimingPatterns(modules);
        fillCodewords(modules, codewords);
        applyMask(modules);
        
        return modules;
    };
    
    function createEmptyMatrix(size) {
        var matrix = [];
        for (var y = 0; y < size; y++) {
            matrix[y] = [];
            for (var x = 0; x < size; x++) {
                matrix[y][x] = null;
            }
        }
        return matrix;
    }
    
    function addFinderPatterns(modules) {
        var size = modules.length;
        
        for (var i = 0; i < 7; i++) {
            for (var j = 0; j < 7; j++) {
                modules[i][j] = (i < 3 || i > 3 || j < 3 || j > 3);
            }
        }
        
        for (var i = size - 7; i < size; i++) {
            for (var j = 0; j < 7; j++) {
                modules[i][j] = (i < size - 4 || i > size - 4 || j < 3 || j > 3);
            }
        }
        
        for (var i = 0; i < 7; i++) {
            for (var j = size - 7; j < size; j++) {
                modules[i][j] = (i < 3 || i > 3 || j < size - 4 || j > size - 4);
            }
        }
    }
    
    function addTimingPatterns(modules) {
        var size = modules.length;
        
        for (var i = 8; i < size - 8; i++) {
            modules[6][i] = (i % 2 === 0);
            modules[i][6] = (i % 2 === 0);
        }
    }
    
    function fillCodewords(modules, codewords) {
        var size = modules.length;
        var bitIndex = 0;
        var byteIndex = 0;
        var direction = -1;
        var y = size - 1;
        var x = size - 1;
        
        while (x > 0) {
            if (x === 6) x--;
            
            for (var i = 0; i < size; i++) {
                y += direction;
                if (y < 0 || y >= size) {
                    direction *= -1;
                    y += direction;
                    x -= 2;
                    if (x < 0) break;
                    if (x === 6) x--;
                }
                
                if (modules[y][x] !== null) continue;
                
                var bit = (codewords[byteIndex] >> (7 - bitIndex)) & 1;
                modules[y][x] = (bit === 1);
                
                bitIndex++;
                if (bitIndex === 8) {
                    bitIndex = 0;
                    byteIndex++;
                    if (byteIndex >= codewords.length) break;
                }
            }
            
            if (byteIndex >= codewords.length) break;
        }
    }
    
    function applyMask(modules) {
        var size = modules.length;
        for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
                if (modules[y][x] === null) {
                    modules[y][x] = ((x + y) % 2 === 0);
                }
            }
        }
    }
    
    return QRCode;
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRCode;
}