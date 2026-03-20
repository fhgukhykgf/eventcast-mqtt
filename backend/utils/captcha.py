"""
验证码工具模块
"""
import random
import string
import io
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# 验证码存储（生产环境应使用 Redis）
_captcha_store: Dict[str, dict] = {}


def generate_captcha_code(length: int = 4) -> str:
    """生成随机验证码"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def generate_captcha_image(code: str, width: int = 120, height: int = 40) -> bytes:
    """生成验证码图片"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # 创建图片
        image = Image.new('RGB', (width, height), color=(255, 255, 255))
        draw = ImageDraw.Draw(image)
        
        # 尝试使用系统字体
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
        except:
            try:
                font = ImageFont.truetype("arial.ttf", 28)
            except:
                font = ImageFont.load_default()
        
        # 绘制背景干扰线
        for _ in range(5):
            x1 = random.randint(0, width)
            y1 = random.randint(0, height)
            x2 = random.randint(0, width)
            y2 = random.randint(0, height)
            draw.line([(x1, y1), (x2, y2)], fill=(200, 200, 200), width=1)
        
        # 绘制干扰点
        for _ in range(50):
            x = random.randint(0, width)
            y = random.randint(0, height)
            draw.point((x, y), fill=(random.randint(150, 255), random.randint(150, 255), random.randint(150, 255)))
        
        # 绘制验证码文字
        colors = [(0, 102, 204), (204, 0, 0), (0, 153, 0), (153, 0, 153)]
        for i, char in enumerate(code):
            color = random.choice(colors)
            x = 15 + i * 25
            y = random.randint(5, 10)
            draw.text((x, y), char, font=font, fill=color)
        
        # 转换为字节
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        return buffer.getvalue()
        
    except ImportError:
        logger.warning("PIL未安装，使用简单验证码")
        return _generate_simple_captcha_image(code, width, height)


def _generate_simple_captcha_image(code: str, width: int, height: int) -> bytes:
    """生成简单的SVG验证码图片（无需PIL）"""
    svg_template = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="50%" font-family="Arial" font-size="28" font-weight="bold" 
        text-anchor="middle" dominant-baseline="middle" fill="#1890ff">{code}</text>
</svg>'''
    svg_content = svg_template.format(width=width, height=height, code=code)
    return svg_content.encode('utf-8')


def create_captcha(captcha_id: str, expires_seconds: int = 300) -> tuple:
    """
    创建验证码
    
    Args:
        captcha_id: 验证码唯一标识
        expires_seconds: 过期时间（秒）
    
    Returns:
        tuple: (验证码内容, 图片字节)
    """
    code = generate_captcha_code()
    image_bytes = generate_captcha_image(code)
    
    # 存储验证码
    _captcha_store[captcha_id] = {
        "code": code.lower(),
        "expires_at": datetime.now() + timedelta(seconds=expires_seconds)
    }
    
    # 清理过期验证码
    _clean_expired_captchas()
    
    return code, image_bytes


def verify_captcha(captcha_id: str, user_input: str) -> bool:
    """
    验证验证码
    
    Args:
        captcha_id: 验证码唯一标识
        user_input: 用户输入的验证码
    
    Returns:
        bool: 是否验证通过
    """
    if not captcha_id or not user_input:
        return False
    
    captcha_data = _captcha_store.get(captcha_id)
    
    if not captcha_data:
        return False
    
    # 检查是否过期
    if datetime.now() > captcha_data["expires_at"]:
        del _captcha_store[captcha_id]
        return False
    
    # 验证（不区分大小写）
    is_valid = captcha_data["code"] == user_input.lower()
    
    # 验证后删除（一次性使用）
    del _captcha_store[captcha_id]
    
    return is_valid


def _clean_expired_captchas():
    """清理过期的验证码"""
    now = datetime.now()
    expired_keys = [k for k, v in _captcha_store.items() if now > v["expires_at"]]
    for key in expired_keys:
        del _captcha_store[key]


def get_captcha_stats() -> dict:
    """获取验证码统计信息"""
    _clean_expired_captchas()
    return {
        "total": len(_captcha_store),
        "store_keys": list(_captcha_store.keys())
    }