from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "三个全栈项目_验收截图.pdf"

W, H = 1754, 1240  # A4 landscape @ 150dpi
BG = "#f7f3e9"
INK = "#1e2c28"
MUTED = "#5f6b64"
LINE = "#d8d1c0"
ACCENT = "#a74a32"
DEEP = "#173f35"
GOLD = "#c9943f"

FONT_REG = "C:/Windows/Fonts/msyh.ttc"
FONT_BOLD = "C:/Windows/Fonts/msyhbd.ttc"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size, index=0)


def draw_text(draw, xy, text, size, color=INK, bold=False, anchor=None, spacing=8):
    draw.multiline_text(xy, text, font=font(size, bold), fill=color, anchor=anchor, spacing=spacing)


def base_page():
    page = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(page)
    # subtle paper texture lines
    for y in range(0, H, 6):
        draw.line([(0, y), (W, y)], fill=(238, 232, 219), width=1)
    draw.rectangle([0, 0, 18, H], fill=DEEP)
    return page, draw


def fit(img, max_w, max_h):
    ratio = min(max_w / img.width, max_h / img.height)
    return img.resize((round(img.width * ratio), round(img.height * ratio)), Image.LANCZOS)


def framed(page, img, x, y, max_w, max_h, border=LINE, pad=0):
    img = fit(img.convert("RGB"), max_w, max_h)
    draw = ImageDraw.Draw(page)
    draw.rectangle([x - 2, y - 2, x + img.width + 2, y + img.height + 2], fill="white", outline=border, width=2)
    page.paste(img, (x, y))
    return img


# ---------- Page 1: cover ----------
page, draw = base_page()
draw_text(draw, (110, 92), "FULL-STACK PORTFOLIO  ·  2026", 18, ACCENT, True)
draw_text(draw, (110, 150), "全栈应用开发", 72, INK, True)
draw_text(draw, (110, 245), "三个项目实战 · 验收截图", 52, DEEP, True)
draw.line([(112, 335), (640, 335)], fill=ACCENT, width=4)
draw_text(
    draw,
    (110, 380),
    "依据《Vibe Coding 全栈应用开发》项目实战部分完成\n"
    "每个项目均包含前端、后端、数据库与自动化测试",
    22,
    MUTED,
    spacing=16,
)

cards = [
    ("01", "个人博客", "拾语", "文章 · 分类 · 搜索 · 个人中心", "127.0.0.1:4000"),
    ("02", "问答社区", "问渠", "提问 · 回答 · 点赞 · 采纳 · 积分", "127.0.0.1:4101"),
    ("03", "在线商城", "云市", "商品 · 购物车 · 地址 · 订单", "127.0.0.1:4201"),
]
cx, cy = 110, 620
for i, (num, name, brand, desc, url) in enumerate(cards):
    x = cx + i * 520
    draw.rounded_rectangle([x, cy, x + 470, cy + 330], radius=14, fill="#fcfaf3", outline=LINE, width=2)
    draw_text(draw, (x + 30, cy + 28), num, 22, ACCENT, True)
    draw_text(draw, (x + 30, cy + 72), f"{name}「{brand}」", 30, INK, True)
    draw_text(draw, (x + 30, cy + 135), desc, 17, MUTED, spacing=12)
    draw.line([(x + 30, cy + 235), (x + 440, cy + 235)], fill=LINE, width=1)
    draw_text(draw, (x + 30, cy + 258), url, 15, ACCENT, True)

draw_text(draw, (110, 1050), "验收材料  ·  2026 年 11 月", 18, MUTED)
draw_text(draw, (W - 110, 1050), "01 / 12", 18, MUTED, anchor="ra")
page.save(ROOT / "page-1.png")

# ---------- Page 2: AI assessment ----------
page, draw = base_page()
draw_text(draw, (110, 88), "COURSE ASSESSMENT", 17, ACCENT, True)
draw_text(draw, (110, 128), "课程平台 AI 评估结果", 46, INK, True)
draw_text(draw, (110, 196), "三个项目全部完成后的平台评估：共作答 15 题，正确 15 题，正确率 100%。", 19, MUTED)

shot = Image.open(ROOT / "ai-assessment.jpg")
thumb = fit(shot.convert("RGB"), 1450, 790)
shot_x = (W - thumb.width) // 2
shot_y = 245
draw.rectangle([shot_x - 2, shot_y - 2, shot_x + thumb.width + 2, shot_y + thumb.height + 2], fill="white", outline="#cfd8e8", width=2)
page.paste(thumb, (shot_x, shot_y))

draw_text(draw, (110, 1080), "AI 评估结果", 24, INK, True)
draw_text(draw, (110, 1118), "来源：课程平台截图  ·  共作答 / 正确题量 / 正确率", 16, MUTED)
draw_text(draw, (W - 110, 1118), "02 / 12", 18, MUTED, anchor="ra")
page.save(ROOT / "page-2.png")

# ---------- Pages 3-5: project screenshots ----------
projects = [
    {
        "no": "01",
        "name": "个人博客「拾语」",
        "stack": "React + TypeScript + Vite + Tailwind / Node.js + Express / MySQL · JWT",
        "desc": "文章发布与编辑、Markdown 实时预览、分类与标签、搜索分页、个人中心。",
        "url": "http://127.0.0.1:4000",
        "file": "screenshots/blog-home.png",
    },
    {
        "no": "02",
        "name": "问答社区「问渠」",
        "stack": "React + TypeScript + Vite + Tailwind / Node.js + Express / MySQL · JWT",
        "desc": "提问与回答、点赞、采纳、积分体系、热门/未解决排序、标签筛选。",
        "url": "http://127.0.0.1:4101",
        "file": "screenshots/qa-home.png",
    },
    {
        "no": "03",
        "name": "在线商城「云市」",
        "stack": "React + TypeScript + Vite + Tailwind / Node.js + Express / MySQL · JWT",
        "desc": "商品浏览、购物车、收货地址、订单创建与取消、库存事务与快照。",
        "url": "http://127.0.0.1:4201",
        "file": "screenshots/shop-home.png",
    },
]

for index, item in enumerate(projects, start=3):
    page, draw = base_page()
    draw_text(draw, (110, 70), f"PROJECT {item['no']}", 16, ACCENT, True)
    draw_text(draw, (110, 105), item["name"], 42, INK, True)
    draw_text(draw, (110, 170), item["stack"], 15, MUTED)
    draw_text(draw, (110, 202), item["desc"], 17, MUTED)
    draw_text(draw, (W - 110, 105), item["url"], 16, ACCENT, True, anchor="ra")
    draw.line([(110, 238), (W - 110, 238)], fill=LINE, width=1)

    shot = Image.open(ROOT / item["file"])
    framed(page, shot, 110, 268, W - 220, H - 330)
    draw_text(draw, (110, H - 38), "首页截图 · 1440 × 1050", 13, MUTED)
    draw_text(draw, (W - 110, H - 38), f"{index:02d} / 12", 15, MUTED, anchor="ra")
    page.save(ROOT / f"page-{index}.png")

# ---------- Pages 6-9: code-level evidence screenshots ----------
for page_no, filename in [
    (6, "evidence-db.png"),
    (7, "evidence-db-shop.png"),
    (8, "evidence-api.png"),
    (9, "evidence-git.png"),
]:
    evidence = Image.open(ROOT / filename).convert("RGB")
    evidence.save(ROOT / f"page-{page_no}.png")

# ---------- Page 10: GitHub / Git course completion ----------
page, draw = base_page()
draw_text(draw, (110, 88), "LEARNING RECORD", 17, ACCENT, True)
draw_text(draw, (110, 128), "GitHub 与 Git 基础学习", 46, INK, True)
draw_text(draw, (110, 194), "课程平台学习记录：GitHub 的使用方法、GIT 入门教程均已完成。", 19, MUTED)

learning = Image.open(ROOT / "git-learning.png").convert("RGB")
thumb = fit(learning, 1534, 620)
x = (W - thumb.width) // 2
y = 260
draw.rectangle([x - 2, y - 2, x + thumb.width + 2, y + thumb.height + 2], fill="white", outline=LINE, width=2)
page.paste(thumb, (x, y))

notes = [
    ("GitHub 的使用方法", "已完成"),
    ("GIT 入门教程", "已完成"),
    ("本地仓库", "4 次项目提交"),
]
for i, (name, value) in enumerate(notes):
    nx = 110 + i * 520
    draw.rounded_rectangle([nx, 960, nx + 480, 1080], radius=10, fill="#fcfaf3", outline=LINE, width=1)
    draw_text(draw, (nx + 24, 980), name, 20, INK, True)
    draw_text(draw, (nx + 24, 1022), value, 16, ACCENT, True)

draw_text(draw, (110, 1128), "以上截图为课程平台学习完成记录；Git 提交记录见上一页。", 15, MUTED)
draw_text(draw, (W - 110, 1128), "10 / 12", 18, MUTED, anchor="ra")
page.save(ROOT / "page-10.png")

# ---------- Pages 11-12: quiz records ----------
quiz_pages = [
    (
        11,
        "课程练习记录（一）",
        "Vibe Coding 与 AI 编程概念练习：第 1 题、第 3 题。",
        [("quiz-01.jpg", "第 1 / 15 题"), ("quiz-03.jpg", "第 3 / 15 题")],
    ),
    (
        12,
        "课程练习记录（二）",
        "Vibe Coding 与 AI 编程概念练习：第 4 题、第 5 题。",
        [("quiz-04.jpg", "第 4 / 15 题"), ("quiz-05.jpg", "第 5 / 15 题")],
    ),
]

for page_no, title, subtitle, items in quiz_pages:
    page, draw = base_page()
    draw_text(draw, (110, 70), "LEARNING RECORD · QUIZ", 17, ACCENT, True)
    draw_text(draw, (110, 108), title, 42, INK, True)
    draw_text(draw, (110, 168), subtitle, 17, MUTED)
    draw.line([(110, 205), (W - 110, 205)], fill=LINE, width=1)

    images = []
    for filename, caption in items:
        source = Image.open(ROOT / filename).convert("RGB")
        images.append((fit(source, 470, 930), caption))

    gap = 150
    total_width = sum(img.width for img, _ in images) + gap
    x = (W - total_width) // 2
    for img, caption in images:
        y = 228
        draw.rectangle([x - 2, y - 2, x + img.width + 2, y + img.height + 2], fill="white", outline=LINE, width=2)
        page.paste(img, (x, y))
        draw_text(draw, (x + img.width // 2, y + img.height + 22), caption, 17, INK, True, anchor="ma")
        x += img.width + gap

    draw_text(draw, (W - 110, H - 38), f"{page_no:02d} / 12", 15, MUTED, anchor="ra")
    draw_text(draw, (110, H - 38), "课程平台练习记录截图", 13, MUTED)
    page.save(ROOT / f"page-{page_no}.png")

pages = [Image.open(ROOT / f"page-{i}.png").convert("RGB") for i in range(1, 13)]
pages[0].save(
    OUT,
    "PDF",
    resolution=150.0,
    save_all=True,
    append_images=pages[1:],
    title="全栈应用开发 · 三个项目验收截图",
    author="拾语 / 问渠 / 云市",
    subject="个人博客、问答社区、在线商城验收材料",
)
print(OUT)
print("pages:", len(pages), "size:", OUT.stat().st_size)
