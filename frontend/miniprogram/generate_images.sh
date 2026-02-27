#!/bin/bash
# 生成所有图片占位文件

cd "$(dirname "$0")/miniprogram/images"

# 创建目录
mkdir -p tabbar

# 1x1像素的透明PNG的base64编码
BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

# 生成tabbar图标
cd tabbar
for img in home.png home-active.png events.png events-active.png profile.png profile-active.png; do
    echo "$BASE64" | base64 -d > "$img"
    echo "✅ 生成: tabbar/$img"
done

cd ..
# 生成其他图片
for img in default-avatar.png loading.gif success.png error.png empty-events.png \
           icon-user.png icon-lock.png icon-scan.png icon-guest.png \
           icon-time.png icon-location.png icon-organizer.png icon-arrow-right.png; do
    echo "$BASE64" | base64 -d > "$img"
    echo "✅ 生成: $img"
done

echo "🎉 所有图片生成完成！"