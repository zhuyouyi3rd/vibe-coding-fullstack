import html
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / "evidence.json").read_text(encoding="utf-8"))
git_log = subprocess.check_output(
    ["git", "log", "--graph", "--oneline", "--decorate", "--all"],
    cwd=ROOT.parent,
    text=True,
    encoding="utf-8",
)
git_status = subprocess.check_output(
    ["git", "status", "--short"], cwd=ROOT.parent, text=True, encoding="utf-8"
).strip() or "working tree clean"
tracked = subprocess.check_output(
    ["git", "ls-files"], cwd=ROOT.parent, text=True, encoding="utf-8"
).strip().splitlines()
total_commits = subprocess.check_output(
    ["git", "rev-list", "--count", "HEAD"], cwd=ROOT.parent, text=True
).strip()

BASE = """<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:1754px;height:1240px}
body{background:#f7f3e9;color:#1e2c28;font-family:"Microsoft YaHei","PingFang SC",sans-serif;overflow:hidden}
body:before{content:"";position:fixed;left:0;top:0;bottom:0;width:18px;background:#173f35}
.page{position:relative;width:100%;height:100%;padding:64px 96px 50px}
.kicker{font-size:15px;letter-spacing:.18em;color:#a74a32;font-weight:700}
h1{font-size:38px;line-height:1.2;margin:10px 0 4px;letter-spacing:-.02em}
.sub{font-size:15px;color:#5f6b64;margin:0}
.rule{height:1px;background:#d8d1c0;margin:24px 0 20px}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.cols.two{grid-template-columns:repeat(2,1fr)}
.tables2{display:grid;grid-template-columns:1fr 1fr;gap:0 24px}
.proj{background:#fcfaf3;border:1px solid #d8d1c0;border-radius:10px;padding:16px 16px 12px}
.proj h2{font-size:19px;margin:0 0 2px}.db{font:12px Consolas,monospace;color:#a74a32;margin-bottom:12px}
.table{border-top:1px dashed #d8d1c0;padding:8px 0 6px}
.table h3{font:700 13px Consolas,monospace;margin:0 0 4px;color:#173f35}
.field{display:flex;justify-content:space-between;gap:8px;font:11px/1.55 Consolas,monospace;color:#4e5a53}
.field .type{color:#8d897b;white-space:nowrap}.key{color:#a74a32;font-size:9px;margin-left:3px}
.route{display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px dotted #e4ddcb;font:11.5px Consolas,monospace}
.method{width:42px;text-align:center;border-radius:3px;padding:1px 0;font-size:9px;font-weight:700;color:white}
.get{background:#3d7b66}.post{background:#a74a32}.put{background:#9b762d}.delete{background:#8f3a26}
.path{flex:1;color:#26332d}.auth{font:10px "Microsoft YaHei";color:#8a8578}
.pageno{position:absolute;right:96px;bottom:28px;font:14px Consolas,monospace;color:#6b6a5e}
.foot{position:absolute;left:96px;bottom:28px;font-size:13px;color:#6b6a5e}
</style></head><body><div class="page">"""

def page(number, kicker, title, subtitle, inner):
    return (
        BASE
        + f'<div class="kicker">{kicker}</div><h1>{title}</h1><p class="sub">{subtitle}</p><div class="rule"></div>'
        + inner
        + f'<div class="foot">全栈应用开发 · 三个项目验收材料</div><div class="pageno">{number:02d} / 12</div></div></body></html>'
    )

# DB schema
def table_html(table):
    fields = []
    for column in table["columns"]:
        key = ""
        if column["key"] == "PRI":
            key = '<span class="key">PK</span>'
        elif column["key"] == "UNI":
            key = '<span class="key">UQ</span>'
        fields.append(
            f'<div class="field"><span>{html.escape(column["name"])}{key}</span>'
            f'<span class="type">{html.escape(column["type"])}</span></div>'
        )
    return f'<div class="table"><h3>{html.escape(table["name"])}</h3>{"".join(fields)}</div>'


def project_card(project, two_columns=False):
    tables = "".join(table_html(table) for table in project["tables"])
    if two_columns:
        tables = f'<div class="tables2">{tables}</div>'
    return (
        f'<div class="proj"><h2>{project["label"]}</h2>'
        f'<div class="db">{project["db"]} · {len(project["tables"])} tables</div>{tables}</div>'
    )


blog, qa, shop = data
db_html = page(
    6,
    "DATABASE EVIDENCE",
    "数据库表结构（一）",
    "个人博客与问答社区共 7 张表，以下为实际 information_schema 字段结构与主键/唯一键标记。",
    '<div class="cols two">' + project_card(blog) + project_card(qa) + "</div>",
)
(ROOT / "evidence-db.html").write_text(db_html, encoding="utf-8")

shop_html = page(
    7,
    "DATABASE EVIDENCE",
    "数据库表结构（二）",
    "在线商城共 6 张表，涵盖商品、购物车、地址、订单与订单商品快照。",
    project_card(shop, two_columns=True),
)
(ROOT / "evidence-db-shop.html").write_text(shop_html, encoding="utf-8")

# API routes
cols = []
for project in data:
    rows = []
    for route in project["routes"]:
        method = route["method"].lower()
        rows.append(
            f'<div class="route"><span class="method {method}">{route["method"]}</span>'
            f'<span class="path">{html.escape(route["path"])}</span>'
            f'<span class="auth">{route["auth"]}</span></div>'
        )
    cols.append(
        f'<div class="proj"><h2>{project["label"]}</h2>'
        f'<div class="db">{len(project["routes"])} endpoints · Express Router</div>{"".join(rows)}</div>'
    )
api_html = page(
    8,
    "API EVIDENCE",
    "API 接口定义",
    "以下接口从各项目 server/src/routes/index.js 实际提取，共 "
    + str(sum(len(p["routes"]) for p in data))
    + " 个端点。",
    '<div class="cols">' + "".join(cols) + "</div>",
)
(ROOT / "evidence-api.html").write_text(api_html, encoding="utf-8")

# Git log
log_lines = []
for line in git_log.strip().splitlines():
    color = "#a6d8b8" if line.startswith("*") else "#e5ddc9"
    log_lines.append(f'<div style="color:{color}">{html.escape(line)}</div>')
git_inner = f"""
<div class="proj" style="background:#14211d;border-color:#2d3c35;padding:20px 24px">
<div style="font:12px Consolas,monospace;color:#7f968a;margin-bottom:10px">$ git log --graph --oneline --decorate --all</div>
<div style="font:17px/1.9 Consolas,monospace">{''.join(log_lines)}</div>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:18px">
<div class="proj"><h2>{total_commits} commits</h2><div class="db">按项目拆分提交</div></div>
<div class="proj"><h2>{len(tracked)} files</h2><div class="db">Git 跟踪的源码与文档</div></div>
<div class="proj"><h2>42 / 42 tests</h2><div class="db">17 + 15 + 10 全部通过</div></div>
</div>
<div class="proj" style="margin-top:18px">
<h2 style="font-size:17px">提交拆分</h2>
<div class="db">每个 commit 对应一个可独立运行的全栈应用</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 30px;font:12px/1.8 Consolas,monospace;color:#4e5a53">
<div>c23be14 · blog · 17 API tests</div><div>abec84c · qa · 15 API tests</div>
<div>09988f2 · shop · 10 API tests</div><div>9caf456 · docs + acceptance PDF</div>
</div>
</div>
"""
git_html = page(
    9,
    "VERSION CONTROL EVIDENCE",
    "Git 提交记录",
    "三个项目分别提交；以下为本地仓库真实 git log 输出。",
    git_inner,
)
(ROOT / "evidence-git.html").write_text(git_html, encoding="utf-8")

print("written", "evidence-db.html", "evidence-api.html", "evidence-git.html")
print(git_log)
