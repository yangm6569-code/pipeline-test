from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(r"E:\DownLoad\Idea-project\gaoxiaokeyan-front\docs\prototype\taskflow_images")
ROOT.mkdir(parents=True, exist_ok=True)

WIDTH = 1700
HEIGHT = 900
BORDER = 4

FONT_PATHS = [
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
]


def load_font(size: int):
    for path in FONT_PATHS:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


FONT_TITLE = load_font(34)
FONT_TEXT = load_font(28)
FONT_SMALL = load_font(24)


def wrap_text(text: str, width: int) -> str:
    parts = []
    line = ""
    for ch in text:
        if len(line) >= width:
            parts.append(line)
            line = ch
        else:
            line += ch
    if line:
        parts.append(line)
    return "\n".join(parts)


def draw_box(draw: ImageDraw.ImageDraw, xy, text: str, shape: str = "rect"):
    x1, y1, x2, y2 = xy
    if shape == "diamond":
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        pts = [(cx, y1), (x2, cy), (cx, y2), (x1, cy)]
        draw.polygon(pts, outline="black", fill="white", width=3)
    elif shape == "terminal":
        draw.rounded_rectangle(xy, radius=24, outline="black", fill="white", width=3)
    else:
        draw.rectangle(xy, outline="black", fill="white", width=3)

    wrapped = wrap_text(text, 8)
    bbox = draw.multiline_textbbox((0, 0), wrapped, font=FONT_TEXT, spacing=8, align="center")
    tx = x1 + (x2 - x1 - (bbox[2] - bbox[0])) / 2
    ty = y1 + (y2 - y1 - (bbox[3] - bbox[1])) / 2
    draw.multiline_text((tx, ty), wrapped, fill="black", font=FONT_TEXT, spacing=8, align="center")


def draw_arrow(draw: ImageDraw.ImageDraw, p1, p2):
    draw.line([p1, p2], fill="black", width=3)
    x1, y1 = p1
    x2, y2 = p2
    if abs(x2 - x1) >= abs(y2 - y1):
        sign = 1 if x2 >= x1 else -1
        draw.line([(x2, y2), (x2 - 16 * sign, y2 - 10)], fill="black", width=3)
        draw.line([(x2, y2), (x2 - 16 * sign, y2 + 10)], fill="black", width=3)
    else:
        sign = 1 if y2 >= y1 else -1
        draw.line([(x2, y2), (x2 - 10, y2 - 16 * sign)], fill="black", width=3)
        draw.line([(x2, y2), (x2 + 10, y2 - 16 * sign)], fill="black", width=3)


def create_canvas(title: str):
    img = Image.new("RGB", (WIDTH, HEIGHT), "white")
    draw = ImageDraw.Draw(img)
    bbox = draw.textbbox((0, 0), title, font=FONT_TITLE)
    draw.text(((WIDTH - (bbox[2] - bbox[0])) / 2, 34), title, fill="black", font=FONT_TITLE)
    return img, draw


def render_linear(name: str, title: str, steps: list[str]):
    img, draw = create_canvas(title)
    left = 90
    top = 310
    box_w = 250
    box_h = 100
    gap = 58

    for idx, step in enumerate(steps):
        x1 = left + idx * (box_w + gap)
        y1 = top
        x2 = x1 + box_w
        y2 = y1 + box_h
        shape = "terminal" if idx in (0, len(steps) - 1) else "rect"
        draw_box(draw, (x1, y1, x2, y2), step, shape)
        if idx < len(steps) - 1:
            draw_arrow(draw, (x2, y1 + box_h // 2), (x2 + gap, y1 + box_h // 2))

    img.save(ROOT / name)


def render_branch(name: str, title: str, top_steps: list[str], decision: str, branch_steps: list[str]):
    img, draw = create_canvas(title)
    top = 220
    box_w = 240
    box_h = 96
    gap = 60
    start_x = 110

    for idx, step in enumerate(top_steps):
        x1 = start_x + idx * (box_w + gap)
        y1 = top
        x2 = x1 + box_w
        y2 = y1 + box_h
        shape = "terminal" if idx == 0 else "rect"
        draw_box(draw, (x1, y1, x2, y2), step, shape)
        if idx < len(top_steps) - 1:
            draw_arrow(draw, (x2, y1 + box_h // 2), (x2 + gap, y1 + box_h // 2))

    dec_x1 = start_x + len(top_steps) * (box_w + gap)
    dec_y1 = top - 4
    dec_x2 = dec_x1 + 180
    dec_y2 = dec_y1 + 110
    draw_box(draw, (dec_x1, dec_y1, dec_x2, dec_y2), decision, "diamond")
    draw_arrow(draw, (start_x + (len(top_steps) - 1) * (box_w + gap) + box_w, top + box_h // 2), (dec_x1, top + box_h // 2))

    branch_y = 530
    branch_w = 220
    branch_h = 96
    total_w = len(branch_steps) * branch_w + (len(branch_steps) - 1) * 45
    branch_start_x = (WIDTH - total_w) // 2
    center_x = (dec_x1 + dec_x2) // 2
    center_y = dec_y2
    for idx, step in enumerate(branch_steps):
        x1 = branch_start_x + idx * (branch_w + 45)
        y1 = branch_y
        x2 = x1 + branch_w
        y2 = y1 + branch_h
        draw_box(draw, (x1, y1, x2, y2), step, "rect")
        draw_arrow(draw, (center_x, center_y), (x1 + branch_w // 2, y1))

    img.save(ROOT / name)


def main():
    render_linear("fig4-1-login.png", "登录模块任务流图", [
        "进入登录页",
        "输入账号密码",
        "点击登录",
        "校验身份信息",
        "跳转默认模块",
    ])

    render_linear("fig4-2-dashboard.png", "首页工作台模块任务流图", [
        "进入工作台",
        "加载项目数据",
        "统计关键指标",
        "展示通知待办",
        "完成首页查看",
    ])

    render_branch("fig4-3-project-list.png", "项目管理模块任务流图", [
        "进入项目管理",
        "条件查询",
        "查看项目列表",
    ], "选择操作", [
        "新增项目",
        "编辑项目",
        "删除项目",
        "导出数据",
        "进入详情",
    ])

    render_branch("fig4-4-project-detail.png", "项目详情与报销申请任务流图", [
        "进入项目详情",
        "查看基础信息",
        "查看预算与报销",
    ], "选择操作", [
        "申请报销",
        "上传凭证",
        "提交报销",
        "查看报销详情",
    ])

    render_branch("fig4-5-process-detail.png", "项目流程详情模块任务流图", [
        "进入流程详情",
        "选择流程阶段",
        "查看阶段信息",
    ], "是否提交材料", [
        "上传附件",
        "提交阶段",
        "查看附件",
        "下载附件",
    ])

    render_branch("fig4-6-process-approval.png", "项目流程审批模块任务流图", [
        "进入审批页面",
        "条件筛选",
        "查看审批任务",
    ], "审批处理", [
        "填写审批意见",
        "审批通过",
        "审批驳回",
        "刷新状态",
    ])

    render_branch("fig4-7-application-approval.png", "申请审批模块任务流图", [
        "进入申请审批",
        "条件检索",
        "查看申请列表",
    ], "选择操作", [
        "查看申请详情",
        "查看审批记录",
        "审批通过",
        "审批拒绝",
    ])

    render_branch("fig4-8-achievement.png", "成果管理模块任务流图", [
        "进入成果管理",
        "条件查询",
        "查看成果列表",
    ], "选择操作", [
        "导出成果",
        "查看详情",
        "删除成果",
    ])

    render_branch("fig4-9-reimbursement.png", "报销管理模块任务流图", [
        "进入报销管理",
        "条件筛选",
        "查看报销单",
    ], "审批或查看", [
        "查看详情",
        "预览附件",
        "审批通过",
        "审批拒绝",
    ])

    render_branch("fig4-10-user.png", "用户管理模块任务流图", [
        "进入用户管理",
        "选择部门节点",
        "查看用户列表",
    ], "选择操作", [
        "新增用户",
        "编辑用户",
        "删除用户",
        "维护部门",
        "导出数据",
    ])

    render_branch("fig4-11-role.png", "角色管理模块任务流图", [
        "进入角色管理",
        "查看角色列表",
    ], "选择操作", [
        "新增角色",
        "编辑角色",
        "删除角色",
    ])

    print(ROOT)


if __name__ == "__main__":
    main()
