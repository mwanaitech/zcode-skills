---
name: ls-gm-img
description: >
  处理任何图像处理任务：格式转换（92+ 种格式）、缩放、裁剪、旋转、色彩调整、降噪、锐化、水印、阴影、图片拼接、批量处理、GIF 动画、图片蒙太奇、元数据提取、像素级对比。
  基于 GraphicsMagick (gm)，跨平台支持 Linux / Windows / macOS。
  内置 8 个高频预设：公众号配图、公众号头图、电商主图、电商详情图、头像、朋友圈图、横版海报、证件照。

tags:
  - image-processing
  - graphicsmagick
  - photo
  - image-conversion
  - resizing
  - watermark

metadata:
  hermes:
    triggers:
      - image
      - image processing
      - image manipulation
      - photo editing
      - picture
      - format conversion
      - convert png
      - convert jpg
      - convert webp
      - resize image
      - resize photo
      - crop image
      - crop photo
      - rotate image
      - rotate photo
      - redimensionner
      - recadrer
      - pivoter
      - rogner
      - image traitement
      - retouche photo
      - retoucher
      - watermark
      - filigrane
      - batch image
      - lot images
      - format image
      - convertir png
      - convertir jpg
      - convertir webp
      - logo
      - miniaturiser
      - thumbnail
      - vignette
      - redimensionner image
      - traiter image
      - image magick
      - graphicsmagick
      - gm command
      - metadata image
      - gif
      - gif animation
      - image montage
      - image comparison

when_to_use: |
  通用图像处理场景：
  - 用户要求转换图片格式（如"把这个 PNG 转成 WebP"、"JPG 转 PDF"）
  - 用户要求缩放、裁剪、旋转图片
  - 用户要求调整亮度、饱和度、对比度、降噪、锐化
  - 用户要求加水印、加边框、加文字
  - 用户要求批量处理图片
  - 用户要求查看图片元数据信息
  - 用户要求对比两张图片的差异
  - 用户要求拼接图片（横向拼接、纵向拼接、多图拼接）
  - 用户要求创建 GIF 动画或缩略图网格

  预设触发场景（关键词匹配）：
  - 用户说"公众号配图"、"文章配图" → 公众号配图预设
  - 用户说"公众号头图"、"封面图" → 公众号头图预设
  - 用户说"电商主图"、"淘宝主图"、"商品主图"、"产品图" → 电商主图预设
  - 用户说"电商详情图"、"详情页图片" → 电商详情图预设
  - 用户说"头像"、"微信头像"、"抖音头像" → 头像预设
  - 用户说"朋友圈图"、"朋友圈配图" → 朋友圈图预设
  - 用户说"海报"、"横版海报"、"宣传图" → 横版海报预设
  - 用户说"证件照"、"一寸照"、"二寸照" → 证件照预设

  不适用的场景：
  - 不要用 AI 生图/绘图（这是图片处理，不是图片生成）
  - 不要处理矢量图的复杂编辑（如 SVG 路径修改）

argument-hint: "[预设名] 图片路径，如：电商主图 D:\\photos\\product.jpg"

arguments:
  - name: preset
    description: |
      预设名称（可选），支持以下值：
      - 公众号配图：宽度800px等比缩放 + 标准阴影 + 转WebP
      - 公众号头图：1080×608居中裁剪 + 标准阴影 + 转WebP
      - 电商主图：800×800正方形 + 白色背景 + 柔和阴影
      - 电商详情图：宽度750px等比缩放 + 转WebP
      - 头像：400×400正方形裁剪 + 圆形白边
      - 朋友圈图：1080×1080正方形裁剪 + 轻微锐化
      - 横版海报：1920×1080强制缩放 + 转JPG高质量
      - 证件照：295×413一寸 + 白色背景 + 边缘优化
      不填则执行自定义图像处理操作。
    required: false
    default: ""
  - name: input
    description: 输入图片路径，支持 jpg/png/webp/tiff/gif/bmp 等 92+ 种格式。也可以是目录路径（批量处理）。
    required: true
  - name: output
    description: 输出路径。默认输出到输入图片同目录，文件名自动加预设名后缀（如 product_电商主图.jpg）。
    required: false
    default: auto

allowed-tools:
  - Bash
  - Read
  - Write
  - Glob

effort: medium
---

# ls-gm-img — 企业级图像处理引擎

GraphicsMagick（"图像处理的瑞士军刀"）是核心引擎，所有操作通过 `gm` 命令行工具执行。稳定高效，经过 Flickr/Etsy 等数十亿张图片的生产环境验证，完美适合批量处理大量图片。跨平台支持 Linux / Windows / macOS。

## 功能总览

### 8 个高频预设

| 预设 | 触发关键词 | 输出规格 |
|------|-----------|---------|
| 公众号配图 | "公众号配图"、"文章配图" | 宽800px等比 + 阴影 + WebP |
| 公众号头图 | "公众号头图"、"封面图" | 1080×608 居中裁剪 + 阴影 + WebP |
| 电商主图 | "电商主图"、"淘宝主图"、"商品主图"、"产品图" | 800×800 正方形 + 白底 + 柔和阴影 |
| 电商详情图 | "电商详情图"、"详情页图片" | 宽750px等比 + WebP |
| 头像 | "头像"、"微信头像"、"抖音头像" | 400×400 + 圆形白边 |
| 朋友圈图 | "朋友圈图"、"朋友圈配图" | 1080×1080 正方形 + 锐化 |
| 横版海报 | "海报"、"横版海报"、"宣传图" | 1920×1080 强制缩放 + JPG 95 |
| 证件照 | "证件照"、"一寸照"、"二寸照" | 295×413 + 白底 + 锐化 |

### 13 个通用操作分类

| 编号 | 分类 | 功能说明 |
|------|------|----------|
| 1 | 格式转换 | 92+ 格式互转，PDF 转图片 |
| 2 | 缩放 | 精确尺寸、等比缩放、百分比、区域填充 |
| 3 | 裁剪 | 指定区域、居中裁剪、自动裁白边 |
| 4 | 旋转与翻转 | 任意角度旋转、垂直/水平翻转 |
| 5 | 色彩与画质调整 | 亮度/饱和度/色相、对比度、色深、灰度、降噪/加噪、自动色阶、反色 |
| 6 | 锐化与模糊 | 普通锐化、USM 锐化、模糊、高斯模糊 |
| 7 | 特效与装饰 | 边框、文字叠加、炭笔素描、内爆/旋涡/波浪、浮雕/边缘检测/曝光、水印合成 |
| 8 | 批量处理 | mogrify 原地批处理、convert 安全批处理（Bash + PowerShell） |
| 9 | GIF 动画 | 多图合成 GIF、逐帧延迟、体积优化 |
| 10 | 图片拼接 | 左右拼接、上下拼接、统一尺寸拼接、带间距拼接、多图拼接 |
| 11 | 图片蒙太奇 | 缩略图网格、带文件名标签 |
| 12 | 图片对比 | 差异可视化、平均绝对误差 |
| 13 | 元数据与图片信息 | 简要/详细信息、属性打印、批量查看 |

### 辅助内容

多步流水线（单命令链式操作）、性能优化建议、跨平台注意事项（Linux/macOS/Windows 差异表）、GraphicsMagick 与 ImageMagick 差异表、错误处理、环境检测脚本。

## 前置条件 — 环境检测

执行任何 `gm` 命令前，先运行环境检测脚本：

```bash
# Linux / macOS
bash scripts/check_gm.sh

# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts/check_gm.ps1
```

脚本会自动完成以下检测：
1. 检查 `gm` 是否在 PATH 中，报告版本号
2. 如果未安装，输出对应平台的安装命令
3. 列出当前编译版本支持的格式

### 安装命令速查

| 平台 | 命令 |
|------|------|
| Ubuntu/Debian | `sudo apt-get install -y graphicsmagick` |
| CentOS/RHEL | `sudo yum install -y GraphicsMagick` |
| macOS (Homebrew) | `brew install graphicsmagick` |
| Windows (Chocolatey) | `choco install graphicsmagick` |
| Windows (Scoop) | `scoop install graphicsmagick` |
| Windows (winget) | `winget install GraphicsMagick.GraphicsMagick` |

## 核心命令速查

| 命令 | 用途 |
|------|------|
| `gm convert` | 格式转换、缩放、特效处理 — 主力命令 |
| `gm mogrify` | 原地批量处理（覆盖原文件） |
| `gm identify` | 读取图片元数据（格式、尺寸、色深） |
| `gm composite` | 图片叠加 / 混合 |
| `gm montage` | 生成缩略图网格 / 联系表 |
| `gm animate` | 播放或创建 GIF 动画 |
| `gm compare` | 两张图片的像素级差异对比 |

## 预设具体命令

以下是 8 个预设的完整 bash 命令实现。用户只需提供"预设名 + 图片路径"，agent 自动执行对应命令，输出到同目录并加预设名后缀。

> **注意**：GM 1.3.35 不支持 `-shadow` 选项。带阴影的预设使用多步 composite 方案实现阴影效果。

**公众号配图** — 宽度800px等比缩放 + 阴影 + WebP（4步）：
```bash
# 1) 等比缩放到宽度800
gm convert input.jpg -resize 800x -background white -flatten base.png
# 2) 生成阴影层（灰色模糊）
gm convert base.png -fill "#cccccc" -colorize 100 -blur 0x6 shadow.png
# 3) 获取尺寸，创建白底画布（base + 20px padding）
W=$(gm identify -format '%w' base.png) && H=$(gm identify -format '%h' base.png)
gm convert -size $((W+20))x$((H+20)) xc:white canvas.png
# 4) 阴影偏移合成 + 原图居中合成
gm composite -geometry +10+10 shadow.png canvas.png canvas_shadow.png
gm composite -gravity center base.png canvas_shadow.png -quality 85 output.webp
```

**公众号头图** — 1080×608居中裁剪 + 阴影 + WebP（4步）：
```bash
gm convert input.jpg -resize 1080x608^ -gravity center -extent 1080x608 -background white -flatten base.png
gm convert base.png -fill "#cccccc" -colorize 100 -blur 0x6 shadow.png
# 尺寸固定 1080x608，画布加 20px padding
gm convert -size 1100x628 xc:white canvas.png
gm composite -geometry +10+10 shadow.png canvas.png canvas_shadow.png
gm composite -gravity center base.png canvas_shadow.png -quality 85 output.webp
```

**电商主图** — 800×800正方形 + 白底 + 柔和阴影（3步）：
```bash
# 1) 缩放到760x760居中白底
gm convert input.jpg -resize 760x760 -gravity center -extent 760x760 -background white -flatten base.png
# 2) 生成柔和阴影
gm convert base.png -fill "#cccccc" -colorize 100 -blur 0x8 shadow.png
# 3) 800x800白底画布 + 阴影偏移 + 合成
gm convert -size 800x800 xc:white canvas.png
gm composite -geometry +26+26 shadow.png canvas.png canvas_shadow.png
gm composite -gravity center base.png canvas_shadow.png -quality 90 output.jpg
```

**电商详情图** — 宽度750px等比缩放 + WebP：
```bash
gm convert input.jpg -resize 750x -quality 85 output.webp
```

**头像** — 400×400正方形裁剪 + 圆形白边：
```bash
gm convert input.jpg -resize 400x400^ -gravity center -extent 400x400 \
  -bordercolor white -border 4x4 \
  \( +clone -threshold -1 -negate -fill white -draw "circle 200,200 200,0" \) \
  -compose CopyOpacity -composite \
  output.png
```

**朋友圈图** — 1080×1080正方形裁剪 + 轻微锐化：
```bash
gm convert input.jpg -resize 1080x1080^ -gravity center -extent 1080x1080 \
  -unsharp 0x0.6+0.3+0.01 -quality 90 output.jpg
```

**横版海报** — 1920×1080强制缩放 + JPG高质量：
```bash
gm convert input.jpg -resize 1920x1080! -quality 95 output.jpg
```

**证件照** — 295×413一寸 + 白底 + 边缘优化：
```bash
gm convert input.jpg -resize 295x413! -background white -flatten \
  -sharpen 0x0.8 -quality 95 output.jpg
```

## 通用操作

### 1. 格式转换

```bash
# 基础转换（格式由扩展名自动推断）
gm convert input.png output.webp

# 有损格式指定质量
gm convert -quality 85 input.tiff output.jpg

# PDF 转图片（每页一张）
gm convert document.pdf page-%03d.png
```

**支持格式（92+）：** JPEG、PNG、GIF、BMP、TIFF、PNM、WebP、AVIF、HEIC/HEIF、JPEG XL (JXL)、JPEG-2000、DPX、PDF、SVG、PSD、RAW 等。完整列表见 [reference.md](reference.md)。

### 2. 缩放

```bash
# 精确尺寸（可能变形）
gm convert input.jpg -resize 800x600 output.jpg

# 限定范围内等比缩放（不放大）
gm convert input.jpg -resize 800x600> output.jpg

# 按百分比缩放
gm convert input.jpg -resize 50% output.jpg

# 区域填充（等比缩放后居中裁剪）
gm convert input.jpg -resize 800x600^ -gravity center -extent 800x600 output.jpg
```

### 3. 裁剪

```bash
# 从左上角偏移 +X+Y 处裁剪 WxH
gm convert input.jpg -crop 400x300+50+50 output.jpg

# 居中裁剪
gm convert input.jpg -gravity center -crop 400x300+0+0 +repage output.jpg

# 自动裁掉白色边框
gm convert input.jpg -trim +repage output.jpg
```

### 4. 旋转与翻转

```bash
gm convert input.jpg -rotate 90  output.jpg   # 顺时针旋转 90°
gm convert input.jpg -rotate -90 output.jpg   # 逆时针旋转 90°
gm convert input.jpg -flip  output.jpg        # 垂直翻转
gm convert input.jpg -flop  output.jpg        # 水平翻转
```

### 5. 色彩与画质调整

```bash
# 亮度 / 饱和度 / 色相（通过 -modulate 调节）
# -modulate 亮度%,饱和度%,色相%（100 = 不变）
gm convert input.jpg -modulate 120,100,100 output.jpg   # 亮度 +20%
gm convert input.jpg -modulate 100,150,100 output.jpg   # 饱和度 +50%
gm convert input.jpg -modulate 110,130,100 output.jpg   # 组合调整

# 对比度
gm convert input.jpg -contrast -contrast output.jpg     # 增强（执行两次）
gm convert input.jpg +contrast +contrast output.jpg     # 降低

# 色彩深度
gm convert input.png -depth 8 output.png

# 转灰度图
gm convert input.jpg -colorspace GRAY output.jpg

# 降噪 / 加噪
gm convert input.jpg -noise 0 output.jpg          # 降噪
gm convert input.jpg +noise gaussian output.jpg   # 添加高斯噪声

# 自动色阶（拉伸直方图）
gm convert input.jpg -normalize output.jpg

# 反色（颜色反转）
gm convert input.jpg -negate output.jpg
```

### 6. 锐化与模糊

```bash
gm convert input.jpg -sharpen 0x1.5 output.jpg
gm convert input.jpg -unsharp 0x1.0+0.5+0.01 output.jpg  # USM 锐化
gm convert input.jpg -blur 0x3 output.jpg                 # 模糊
gm convert input.jpg -gaussian 0x2 output.jpg             # 高斯模糊
```

### 7. 特效与装饰

```bash
# 添加边框（颜色 + 宽度）
gm convert input.jpg -bordercolor '#333333' -border 10x10 output.jpg

# 文字叠加（GM 使用 -draw，不是 ImageMagick 的 -annotate）
# 重要：Windows 下必须指定字体完整路径
gm convert input.jpg -font "C:/Windows/Fonts/arial.ttf" -fill white \
  -draw "font-size 24 text 10,580 '版权所有 2026'" output.jpg
# Linux/macOS:
gm convert input.jpg -font "Helvetica" -fill white \
  -draw "font-size 24 text 10,580 '版权所有 2026'" output.jpg

# 炭笔素描效果
gm convert input.jpg -charcoal 2 output.jpg

# 内爆 / 旋涡 / 波浪
gm convert input.jpg -implode 0.5 output.jpg
gm convert input.jpg -swirl 90 output.jpg
gm convert input.jpg -wave 10x50 output.jpg

# 浮雕 / 边缘检测 / 曝光
gm convert input.jpg -emboss 2 output.jpg
gm convert input.jpg -edge 2 output.jpg
gm convert input.jpg -solarize 50% output.jpg

# 水印合成（使用 gm composite 叠加 logo 图片）
# -dissolve 控制透明度（0=全透明，100=不透明），-gravity 控制位置
gm composite -gravity SouthEast -dissolve 30 logo.png input.jpg output.jpg        # 右下角半透明
gm composite -gravity SouthWest -dissolve 40 logo.png input.jpg output.jpg        # 左下角
gm composite -gravity Center -dissolve 20 logo.png input.jpg output.jpg           # 居中大水印
gm composite -geometry +20+20 -dissolve 50 logo.png input.jpg output.jpg          # 指定坐标偏移

# 平铺水印（先制作平铺底图，再合成）
gm convert -size 800x600 tile:logo.png watermark_tile.png
gm composite -dissolve 15 watermark_tile.png input.jpg output.jpg
```

### 8. 批量处理

```bash
# mogrify 会覆盖原文件，请谨慎使用
# 将所有 PNG 转为 WebP，质量 80
gm mogrify -format webp -quality 80 *.png

# 将所有 JPEG 缩放到最大宽度 1200px（原地覆盖）
gm mogrify -resize 1200x *.jpg

# 批量处理到另一个目录（convert 比 mogrify 更安全）
for f in input_dir/*.jpg; do
  gm convert "$f" -resize 800x -quality 85 "output_dir/$(basename "$f" .jpg).webp"
done

# Windows PowerShell 批量
Get-ChildItem *.jpg | ForEach-Object {
  gm convert $_.FullName -resize 800x -quality 85 "output\$($_.BaseName).webp"
}
```

### 9. GIF 动画

```bash
# 从多张图片创建 GIF
gm convert -delay 20 -loop 0 frame-*.png animation.gif

# 逐帧设置延迟（单位为 1/100 秒）
gm convert -delay 10 frame1.png -delay 50 frame2.png -delay 10 frame3.png -loop 0 anim.gif

# 优化 GIF 体积
gm convert animation.gif -layers optimize output.gif
```

### 10. 图片拼接

```bash
# 左右拼接（横向）
gm convert left.jpg right.jpg +append output.jpg

# 上下拼接（纵向）
gm convert top.jpg bottom.jpg -append output.jpg

# 拼接时统一高度（左右拼接时以较高的一张为准）
gm convert left.jpg right.jpg -resize x800 +append output.jpg

# 拼接时统一宽度（上下拼接时以较宽的一张为准）
gm convert top.jpg bottom.jpg -resize 800x -append output.jpg

# 带间距和背景色
gm convert left.jpg right.jpg -background "#f0f0f0" -splice 0x20 +append output.jpg

# 多张图片拼接
gm convert img1.jpg img2.jpg img3.jpg +append output.jpg
```

> **注意**：`+append` 和 `-append` 要求图片的拼接边尺寸一致，否则会出现错位。建议先用 `-resize` 统一高度（横向拼接）或宽度（纵向拼接），再执行拼接。

### 11. 图片蒙太奇（缩略图网格）

```bash
# 4 列缩略图网格
gm montage *.jpg -tile 4x -geometry 200x200+5+5 -background '#f0f0f0' grid.jpg

# 带文件名标签
gm montage *.jpg -tile 3x -geometry 150x150+4+4 -label '%f' grid.jpg
```

### 12. 图片对比

```bash
# 生成差异可视化图片
gm compare image1.png image2.png diff.png

# 输出平均绝对误差
gm compare -metric mae image1.png image2.png null:
```

### 13. 元数据与图片信息

```bash
# 简要信息
gm identify image.jpg
# 输出: image.jpg JPEG 1920x1080+0+0 DirectClass 8-bit 1.2Mi 0.050u 0:01

# 详细元数据
gm identify -verbose image.jpg

# 打印特定属性
gm identify -format '%w x %h, %[bit-depth]-bit, %[colorspace]' image.jpg

# 批量查看
gm identify -format '%f: %wx%h %m\n' *.jpg

# 清除所有元数据（减小体积、移除 GPS/EXIF 隐私信息）
gm convert input.jpg -strip output.jpg

# 写入版权信息
gm convert input.jpg -set Copyright "2026 公司名称" -set Author "摄影师名" output.jpg
```

## 多步流水线（单命令执行）

GraphicsMagick 从左到右依次处理操作，可以在一条命令中链式执行多步操作，避免生成中间文件：

```bash
# 缩放 → 锐化 → 加水印 → 转 WebP
gm convert input.jpg \
  -resize 1200x \
  -unsharp 0x0.8+0.5+0.01 \
  -font "C:/Windows/Fonts/arial.ttf" -fill "rgba(255,255,255,0.5)" \
  -draw "font-size 18 text 1100,1070 '示例水印'" \
  -quality 82 output.webp
```

## 性能优化建议

- **OpenMP 多线程**：GraphicsMagick 自动使用所有 CPU 核心。设置 `OMP_NUM_THREADS=N` 限制线程数。
- **大文件内存映射**：自动处理 GB 级图片，无需全部加载到内存。
- **避免不必要的格式转换**：链式操作时使用无损中间格式（PNG、TIFF）。
- **`-limit` 限制资源**：服务器环境下约束内存和磁盘使用：
  ```bash
  gm convert -limit memory 512MB -limit map 1GB input.jpg ...
  ```

## 跨平台注意事项

| 问题 | Linux/macOS | Windows |
|------|-------------|---------|
| 路径分隔符 | `/` | gm 命令中用 `/`（正斜杠可用） |
| 通配符展开 | Shell 自动处理 `*.jpg` | PowerShell: `Get-ChildItem *.jpg`；CMD: `*.jpg` 可用 |
| 克隆用括号 | `\( +clone ... \)` | CMD 中用 `^( +clone ... ^)`，PowerShell 中用 `(` `)` |
| 引号 | 单引号 `'...'` | CMD 中用双引号 `"..."` |
| 换行符 | `\` | CMD 中用 `^`，PowerShell 中用 `` ` `` |

## 错误处理

执行 `gm` 命令后始终检查退出码：

```bash
gm convert input.jpg -resize 800x output.webp
if [ $? -ne 0 ]; then
  echo "GraphicsMagick 错误：转换失败"
fi
```

常见错误及解决方法：
- `unable to open image`：文件路径错误或无权限
- `no decode delegate for this image format`：当前 GM 编译版本未包含该格式支持；用 `gm version` 检查
- `cache resources exhausted`：图片过大；使用 `-limit` 参数或增加交换空间
- `Unable to read font (n019003l.pfb)`：未指定默认字体；Windows 下加 `-font "C:/Windows/Fonts/arial.ttf"`，Linux 下加 `-font "/usr/share/fonts/.../DejaVuSans.ttf"`

## 更多资源


- GraphicsMagick 官方文档：http://www.graphicsmagick.org/

