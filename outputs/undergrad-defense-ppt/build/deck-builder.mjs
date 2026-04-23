const fs = await import("node:fs/promises");
const path = await import("node:path");
const { Presentation, PresentationFile } = await import("@oai/artifact-tool");

const W = 1280;
const H = 720;

const ROOT = "E:\\DownLoad\\Idea-project\\gaoxiaokeyan-front";
const OUT_DIR = path.join(ROOT, "outputs", "undergrad-defense-ppt", "final");
const PREVIEW_DIR = path.join(OUT_DIR, "preview");
const FINAL_PPTX = path.join(OUT_DIR, "output.pptx");
const NAMED_PPTX = path.join(OUT_DIR, "高校科研管理系统-本科论文答辩.pptx");

const IMG = {
  loginBg: path.join(ROOT, "src", "assets", "login-bg-uploaded.png"),
  moduleLogin: path.join(ROOT, "word", "usecase_images", "module_01.png"),
  flowProjectList: path.join(ROOT, "docs", "prototype", "taskflow_images", "fig4-3-project-list.png"),
  flowProcessDetail: path.join(ROOT, "docs", "prototype", "taskflow_images", "fig4-5-process-detail.png"),
  flowApplication: path.join(ROOT, "docs", "prototype", "taskflow_images", "fig4-7-application-approval.png"),
  flowReimbursement: path.join(ROOT, "docs", "prototype", "taskflow_images", "fig4-9-reimbursement.png"),
  flowAchievement: path.join(ROOT, "docs", "prototype", "taskflow_images", "fig4-8-achievement.png"),
};

const COLORS = {
  navy: "#0C2438",
  deepTeal: "#12364F",
  teal: "#18B6B0",
  tealSoft: "#E7FBF9",
  gold: "#F2B35E",
  goldSoft: "#FFF6E9",
  coral: "#F1765B",
  coralSoft: "#FFF0EC",
  ink: "#102A43",
  text: "#243B53",
  muted: "#486581",
  slate: "#7B8794",
  bg: "#F5F7FB",
  line: "#D9E2EC",
  panel: "#FFFFFF",
  panelSoft: "#FBFDFF",
  success: "#2BB673",
  successSoft: "#EAFBF4",
  danger: "#D64545",
  dangerSoft: "#FFF1F1",
  white: "#FFFFFF",
  transparent: "#00000000",
};

const FONT = {
  body: "Microsoft YaHei",
  mono: "Consolas",
};

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function line(fill = COLORS.transparent, width = 0) {
  return { style: "solid", fill, width };
}

function addShape(slide, geometry, left, top, width, height, fill = COLORS.transparent, lineFill = COLORS.transparent, lineWidth = 0, extra = {}) {
  return slide.shapes.add({
    geometry,
    position: { left, top, width, height, ...extra.position },
    fill,
    line: line(lineFill, lineWidth),
    ...extra,
  });
}

function addText(
  slide,
  text,
  left,
  top,
  width,
  height,
  {
    size = 16,
    color = COLORS.text,
    bold = false,
    align = "left",
    valign = "top",
    face = FONT.body,
    fill = COLORS.transparent,
    lineFill = COLORS.transparent,
    lineWidth = 0,
    autoFit = null,
    insets = { left: 0, right: 0, top: 0, bottom: 0 },
  } = {},
) {
  const box = addShape(slide, "rect", left, top, width, height, fill, lineFill, lineWidth);
  box.text = text;
  box.text.fontSize = size;
  box.text.color = color;
  box.text.bold = bold;
  box.text.alignment = align;
  box.text.verticalAlignment = valign;
  box.text.typeface = face;
  box.text.insets = insets;
  if (autoFit) {
    box.text.autoFit = autoFit;
  }
  return box;
}

function addShadowPanel(slide, left, top, width, height, { fill = COLORS.panel, lineFill = COLORS.line, lineWidth = 1, shadow = true, shadowOffset = 10 } = {}) {
  if (shadow) {
    addShape(slide, "roundRect", left + shadowOffset, top + shadowOffset, width, height, "#0C243810", COLORS.transparent, 0);
  }
  return addShape(slide, "roundRect", left, top, width, height, fill, lineFill, lineWidth);
}

function addPill(slide, label, left, top, width, { fill = COLORS.tealSoft, color = COLORS.teal, border = COLORS.transparent } = {}) {
  addShape(slide, "roundRect", left, top, width, 28, fill, border, border === COLORS.transparent ? 0 : 1);
  addText(slide, label, left + 12, top + 4, width - 24, 20, {
    size: 12,
    color,
    bold: true,
    valign: "middle",
  });
}

function addBulletList(slide, items, left, top, width, {
  bulletColor = COLORS.teal,
  textColor = COLORS.text,
  size = 16,
  gap = 16,
  bulletSize = 8,
  lineHeight = 44,
} = {}) {
  items.forEach((item, index) => {
    const y = top + index * lineHeight;
    addShape(slide, "ellipse", left, y + 8, bulletSize, bulletSize, bulletColor, bulletColor, 0);
    addText(slide, item, left + 20, y, width - 20, lineHeight - 2, {
      size,
      color: textColor,
      autoFit: "shrinkText",
    });
  });
}

function addSectionHeader(slide, no, section, title, subtitle = "") {
  slide.background.fill = COLORS.bg;
  addShape(slide, "ellipse", 1018, -60, 320, 220, "#18B6B018", COLORS.transparent, 0);
  addShape(slide, "ellipse", -70, 520, 260, 180, "#F2B35E12", COLORS.transparent, 0);
  addText(slide, section, 72, 34, 240, 20, {
    size: 12,
    color: COLORS.teal,
    bold: true,
    face: FONT.mono,
  });
  addText(slide, String(no).padStart(2, "0"), 1160, 30, 52, 20, {
    size: 12,
    color: COLORS.slate,
    bold: true,
    face: FONT.mono,
    align: "right",
  });
  addText(slide, title, 72, 62, 840, 44, {
    size: 29,
    color: COLORS.ink,
    bold: true,
  });
  if (subtitle) {
    addText(slide, subtitle, 72, 104, 990, 28, {
      size: 13,
      color: COLORS.muted,
    });
  }
  addShape(slide, "rect", 72, 146, 1136, 2, COLORS.line, COLORS.transparent, 0);
}

async function addImage(slide, imagePath, left, top, width, height, fit = "contain", alt = "") {
  if (!(await exists(imagePath))) {
    addShadowPanel(slide, left, top, width, height, { fill: COLORS.panel, lineFill: COLORS.line, shadow: false });
    addText(slide, "素材缺失", left + 20, top + height / 2 - 12, width - 40, 24, {
      size: 16,
      color: COLORS.slate,
      align: "center",
      valign: "middle",
    });
    return null;
  }
  const image = slide.images.add({ blob: await readImageBlob(imagePath), fit, alt });
  image.position = { left, top, width, height };
  return image;
}

function drawBrowserFrame(slide, left, top, width, height, title) {
  addShadowPanel(slide, left, top, width, height, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1.2, shadow: true });
  addShape(slide, "roundRect", left + 14, top + 14, width - 28, 38, "#F8FAFC", COLORS.line, 1);
  addShape(slide, "ellipse", left + 28, top + 28, 9, 9, COLORS.coral, COLORS.transparent, 0);
  addShape(slide, "ellipse", left + 44, top + 28, 9, 9, COLORS.gold, COLORS.transparent, 0);
  addShape(slide, "ellipse", left + 60, top + 28, 9, 9, COLORS.success, COLORS.transparent, 0);
  addText(slide, title, left + 88, top + 23, width - 130, 18, {
    size: 12,
    color: COLORS.slate,
    bold: true,
  });
  return {
    innerLeft: left + 20,
    innerTop: top + 64,
    innerWidth: width - 40,
    innerHeight: height - 84,
  };
}

function drawLoginMock(slide, left, top, width, height) {
  const frame = drawBrowserFrame(slide, left, top, width, height, "登录界面");
  addShape(slide, "roundRect", frame.innerLeft, frame.innerTop, frame.innerWidth * 0.52, frame.innerHeight, "#12364F", COLORS.transparent, 0);
  addShape(slide, "ellipse", frame.innerLeft + 40, frame.innerTop + 26, 140, 100, "#18B6B030", COLORS.transparent, 0);
  addShape(slide, "ellipse", frame.innerLeft + 182, frame.innerTop + 118, 110, 80, "#F2B35E30", COLORS.transparent, 0);
  addText(slide, "高校科研\n管理系统", frame.innerLeft + 40, frame.innerTop + 42, 220, 110, {
    size: 24,
    color: COLORS.white,
    bold: true,
  });
  addText(slide, "统一身份认证、菜单分发与路由鉴权", frame.innerLeft + 40, frame.innerTop + 164, 240, 40, {
    size: 12,
    color: "#D9F7F4",
  });

  const cardLeft = frame.innerLeft + frame.innerWidth * 0.58;
  addShadowPanel(slide, cardLeft, frame.innerTop + 34, frame.innerWidth * 0.32, 188, {
    fill: COLORS.panel,
    lineFill: "#E5EDF5",
    lineWidth: 1,
    shadow: false,
  });
  addText(slide, "欢迎登录", cardLeft + 24, frame.innerTop + 54, 140, 22, {
    size: 20,
    color: COLORS.ink,
    bold: true,
  });
  addShape(slide, "roundRect", cardLeft + 24, frame.innerTop + 92, frame.innerWidth * 0.32 - 48, 34, "#F8FAFC", COLORS.line, 1);
  addShape(slide, "roundRect", cardLeft + 24, frame.innerTop + 138, frame.innerWidth * 0.32 - 48, 34, "#F8FAFC", COLORS.line, 1);
  addShape(slide, "roundRect", cardLeft + 24, frame.innerTop + 186, frame.innerWidth * 0.32 - 48, 34, COLORS.teal, COLORS.transparent, 0);
  addText(slide, "账号", cardLeft + 40, frame.innerTop + 101, 80, 16, { size: 11, color: COLORS.slate });
  addText(slide, "密码", cardLeft + 40, frame.innerTop + 147, 80, 16, { size: 11, color: COLORS.slate });
  addText(slide, "登录", cardLeft + 24, frame.innerTop + 194, frame.innerWidth * 0.32 - 48, 18, {
    size: 13,
    color: COLORS.white,
    bold: true,
    align: "center",
    valign: "middle",
  });
}

function drawDashboardMock(slide, left, top, width, height) {
  const frame = drawBrowserFrame(slide, left, top, width, height, "首页工作台");
  addShape(slide, "roundRect", frame.innerLeft, frame.innerTop, 82, frame.innerHeight, "#12364F", COLORS.transparent, 0);
  ["首页", "项目", "审批", "成果", "报销", "用户"].forEach((item, index) => {
    addShape(slide, "roundRect", frame.innerLeft + 12, frame.innerTop + 18 + index * 42, 58, 26, index === 0 ? "#18B6B028" : COLORS.transparent, COLORS.transparent, 0);
    addText(slide, item, frame.innerLeft + 24, frame.innerTop + 24 + index * 42, 40, 14, {
      size: 10,
      color: COLORS.white,
      bold: index === 0,
      align: "center",
    });
  });
  addShape(slide, "roundRect", frame.innerLeft + 96, frame.innerTop, frame.innerWidth - 96, 30, "#F8FAFC", COLORS.line, 1);
  addText(slide, "数据总览 / 待办中心 / 预算对比", frame.innerLeft + 116, frame.innerTop + 8, 220, 14, {
    size: 11,
    color: COLORS.slate,
  });
  const statW = (frame.innerWidth - 130) / 4;
  ["总项目数", "待审批", "执行中", "已完成"].forEach((label, index) => {
    const x = frame.innerLeft + 96 + index * (statW + 8);
    addShadowPanel(slide, x, frame.innerTop + 42, statW, 66, { fill: COLORS.panelSoft, lineFill: COLORS.line, lineWidth: 1, shadow: false });
    addText(slide, label, x + 14, frame.innerTop + 56, statW - 28, 14, { size: 10, color: COLORS.slate });
    addText(slide, index === 0 ? "项目概览" : index === 1 ? "待办追踪" : index === 2 ? "进度状态" : "结题情况", x + 14, frame.innerTop + 74, statW - 28, 20, {
      size: 12,
      color: COLORS.ink,
      bold: true,
    });
  });
  addShadowPanel(slide, frame.innerLeft + 96, frame.innerTop + 120, frame.innerWidth * 0.56, frame.innerHeight - 132, {
    fill: COLORS.panel,
    lineFill: COLORS.line,
    lineWidth: 1,
    shadow: false,
  });
  addText(slide, "预算与实际支出对比", frame.innerLeft + 112, frame.innerTop + 136, 190, 18, {
    size: 12,
    color: COLORS.ink,
    bold: true,
  });
  [62, 84, 48, 96, 70].forEach((barH, index) => {
    const barLeft = frame.innerLeft + 132 + index * 52;
    addShape(slide, "rect", barLeft, frame.innerTop + 270 - barH, 16, barH, COLORS.teal, COLORS.transparent, 0);
    addShape(slide, "rect", barLeft + 22, frame.innerTop + 270 - (barH - 12), 16, barH - 12, COLORS.gold, COLORS.transparent, 0);
  });
  addShadowPanel(slide, frame.innerLeft + 96 + frame.innerWidth * 0.58, frame.innerTop + 120, frame.innerWidth * 0.30, frame.innerHeight - 132, {
    fill: COLORS.panel,
    lineFill: COLORS.line,
    lineWidth: 1,
    shadow: false,
  });
  addText(slide, "待办事项", frame.innerLeft + 96 + frame.innerWidth * 0.58 + 16, frame.innerTop + 136, 100, 18, {
    size: 12,
    color: COLORS.ink,
    bold: true,
  });
  ["流程审批", "报销审核", "阶段提交", "成果维护"].forEach((item, index) => {
    const itemTop = frame.innerTop + 166 + index * 44;
    addShape(slide, "roundRect", frame.innerLeft + 96 + frame.innerWidth * 0.58 + 16, itemTop, frame.innerWidth * 0.30 - 32, 30, "#F8FAFC", COLORS.line, 1);
    addText(slide, item, frame.innerLeft + 96 + frame.innerWidth * 0.58 + 28, itemTop + 8, 90, 14, { size: 10, color: COLORS.text });
    addPill(slide, "处理中", frame.innerLeft + 96 + frame.innerWidth * 0.58 + 118, itemTop + 2, 74, { fill: COLORS.tealSoft, color: COLORS.teal });
  });
}

function drawProjectMock(slide, left, top, width, height) {
  const frame = drawBrowserFrame(slide, left, top, width, height, "项目管理");
  addShape(slide, "roundRect", frame.innerLeft, frame.innerTop, frame.innerWidth, 36, "#F8FAFC", COLORS.line, 1);
  ["项目名称", "项目类型", "状态"].forEach((item, index) => {
    addShape(slide, "roundRect", frame.innerLeft + 10 + index * 96, frame.innerTop + 7, 84, 22, COLORS.panel, COLORS.line, 1);
    addText(slide, item, frame.innerLeft + 24 + index * 96, frame.innerTop + 13, 60, 10, {
      size: 9,
      color: COLORS.slate,
      align: "center",
    });
  });
  addShape(slide, "roundRect", frame.innerLeft + frame.innerWidth - 156, frame.innerTop + 7, 62, 22, COLORS.tealSoft, COLORS.transparent, 0);
  addShape(slide, "roundRect", frame.innerLeft + frame.innerWidth - 86, frame.innerTop + 7, 62, 22, COLORS.goldSoft, COLORS.transparent, 0);
  addText(slide, "查询", frame.innerLeft + frame.innerWidth - 156, frame.innerTop + 13, 62, 10, {
    size: 9,
    color: COLORS.teal,
    bold: true,
    align: "center",
  });
  addText(slide, "导出", frame.innerLeft + frame.innerWidth - 86, frame.innerTop + 13, 62, 10, {
    size: 9,
    color: COLORS.gold,
    bold: true,
    align: "center",
  });
  addShape(slide, "rect", frame.innerLeft, frame.innerTop + 50, frame.innerWidth, 26, "#F1F5F9", COLORS.transparent, 0);
  ["编号", "名称", "负责人", "状态", "阶段", "操作"].forEach((item, index) => {
    addText(slide, item, frame.innerLeft + 8 + index * ((frame.innerWidth - 16) / 6), frame.innerTop + 57, 70, 10, {
      size: 9,
      color: COLORS.slate,
      bold: true,
    });
  });
  ["申报中", "进行中", "已完成", "中期检查"].forEach((status, index) => {
    const rowTop = frame.innerTop + 82 + index * 34;
    addShape(slide, "rect", frame.innerLeft, rowTop, frame.innerWidth, 1, COLORS.line, COLORS.transparent, 0);
    addText(slide, `GXKY-00${index + 1}`, frame.innerLeft + 10, rowTop + 8, 60, 10, { size: 9, color: COLORS.text });
    addText(slide, `项目示例 ${index + 1}`, frame.innerLeft + 86, rowTop + 8, 76, 10, { size: 9, color: COLORS.text });
    addText(slide, "教师用户", frame.innerLeft + 186, rowTop + 8, 60, 10, { size: 9, color: COLORS.text });
    addPill(slide, status, frame.innerLeft + 264, rowTop + 3, 72, {
      fill: index === 0 ? COLORS.goldSoft : index === 1 ? COLORS.tealSoft : COLORS.successSoft,
      color: index === 0 ? COLORS.gold : index === 1 ? COLORS.teal : COLORS.success,
    });
    addText(slide, index === 2 ? "结题归档" : index === 3 ? "中期检查" : "流程推进", frame.innerLeft + 358, rowTop + 8, 68, 10, { size: 9, color: COLORS.text });
    addText(slide, "详情 / 编辑", frame.innerLeft + 442, rowTop + 8, 70, 10, { size: 9, color: COLORS.teal, bold: true });
  });
}

function drawApprovalMock(slide, left, top, width, height) {
  const frame = drawBrowserFrame(slide, left, top, width, height, "审批与报销");
  addShape(slide, "roundRect", frame.innerLeft, frame.innerTop, frame.innerWidth * 0.54, frame.innerHeight, COLORS.panel, COLORS.line, 1);
  addText(slide, "待审批记录", frame.innerLeft + 16, frame.innerTop + 14, 120, 18, {
    size: 12,
    color: COLORS.ink,
    bold: true,
  });
  ["项目流程审批", "申请审批", "报销审批"].forEach((item, index) => {
    const itemTop = frame.innerTop + 44 + index * 54;
    addShape(slide, "roundRect", frame.innerLeft + 14, itemTop, frame.innerWidth * 0.54 - 28, 42, "#F8FAFC", COLORS.line, 1);
    addText(slide, item, frame.innerLeft + 28, itemTop + 10, 90, 14, { size: 10, color: COLORS.text, bold: true });
    addText(slide, "待处理事项进入详情后可填写意见并执行通过/驳回", frame.innerLeft + 28, itemTop + 24, frame.innerWidth * 0.54 - 60, 10, {
      size: 8,
      color: COLORS.slate,
    });
    addPill(slide, "待处理", frame.innerLeft + frame.innerWidth * 0.54 - 100, itemTop + 7, 72, { fill: COLORS.goldSoft, color: COLORS.gold });
  });
  addShape(slide, "roundRect", frame.innerLeft + frame.innerWidth * 0.58, frame.innerTop, frame.innerWidth * 0.42, frame.innerHeight, COLORS.panel, COLORS.line, 1);
  addText(slide, "审批详情", frame.innerLeft + frame.innerWidth * 0.58 + 16, frame.innerTop + 14, 100, 18, {
    size: 12,
    color: COLORS.ink,
    bold: true,
  });
  ["项目名称：高校科研管理系统", "当前节点：二级审批", "附件：阶段材料 / 报销凭证"].forEach((item, index) => {
    addText(slide, item, frame.innerLeft + frame.innerWidth * 0.58 + 16, frame.innerTop + 42 + index * 20, frame.innerWidth * 0.42 - 32, 16, {
      size: 9,
      color: COLORS.text,
    });
  });
  addShape(slide, "roundRect", frame.innerLeft + frame.innerWidth * 0.58 + 16, frame.innerTop + 116, frame.innerWidth * 0.42 - 32, 78, "#F8FAFC", COLORS.line, 1);
  addText(slide, "审批意见输入区", frame.innerLeft + frame.innerWidth * 0.58 + 28, frame.innerTop + 145, frame.innerWidth * 0.42 - 56, 18, {
    size: 11,
    color: COLORS.slate,
    align: "center",
  });
  addShape(slide, "roundRect", frame.innerLeft + frame.innerWidth * 0.58 + 16, frame.innerTop + 214, 88, 28, COLORS.successSoft, COLORS.transparent, 0);
  addShape(slide, "roundRect", frame.innerLeft + frame.innerWidth * 0.58 + 116, frame.innerTop + 214, 88, 28, COLORS.dangerSoft, COLORS.transparent, 0);
  addText(slide, "审批通过", frame.innerLeft + frame.innerWidth * 0.58 + 16, frame.innerTop + 221, 88, 14, {
    size: 10,
    color: COLORS.success,
    bold: true,
    align: "center",
  });
  addText(slide, "审批驳回", frame.innerLeft + frame.innerWidth * 0.58 + 116, frame.innerTop + 221, 88, 14, {
    size: 10,
    color: COLORS.danger,
    bold: true,
    align: "center",
  });
}

function drawAdminMock(slide, left, top, width, height) {
  const frame = drawBrowserFrame(slide, left, top, width, height, "用户与角色管理");
  addShape(slide, "roundRect", frame.innerLeft, frame.innerTop, frame.innerWidth * 0.32, frame.innerHeight, COLORS.panel, COLORS.line, 1);
  addText(slide, "部门结构", frame.innerLeft + 14, frame.innerTop + 14, 80, 16, {
    size: 12,
    color: COLORS.ink,
    bold: true,
  });
  ["学校", "科研处", "二级学院", "财务处"].forEach((item, index) => {
    addShape(slide, "roundRect", frame.innerLeft + 12 + index * 6, frame.innerTop + 44 + index * 34, frame.innerWidth * 0.22, 24, index === 1 ? COLORS.tealSoft : "#F8FAFC", COLORS.line, 1);
    addText(slide, item, frame.innerLeft + 24 + index * 6, frame.innerTop + 50 + index * 34, frame.innerWidth * 0.22 - 20, 12, {
      size: 9,
      color: index === 1 ? COLORS.teal : COLORS.text,
      bold: index === 1,
    });
  });
  addShape(slide, "roundRect", frame.innerLeft + frame.innerWidth * 0.36, frame.innerTop, frame.innerWidth * 0.64, frame.innerHeight, COLORS.panel, COLORS.line, 1);
  addText(slide, "用户列表", frame.innerLeft + frame.innerWidth * 0.36 + 14, frame.innerTop + 14, 80, 16, {
    size: 12,
    color: COLORS.ink,
    bold: true,
  });
  addShape(slide, "rect", frame.innerLeft + frame.innerWidth * 0.36 + 14, frame.innerTop + 42, frame.innerWidth * 0.64 - 28, 22, "#F1F5F9", COLORS.transparent, 0);
  ["账号", "姓名", "角色", "部门", "状态"].forEach((item, index) => {
    addText(slide, item, frame.innerLeft + frame.innerWidth * 0.36 + 20 + index * 52, frame.innerTop + 48, 40, 10, {
      size: 8,
      color: COLORS.slate,
      bold: true,
    });
  });
  ["管理员", "教师", "财务管理员"].forEach((role, index) => {
    const rowTop = frame.innerTop + 74 + index * 32;
    addShape(slide, "rect", frame.innerLeft + frame.innerWidth * 0.36 + 14, rowTop, frame.innerWidth * 0.64 - 28, 1, COLORS.line, COLORS.transparent, 0);
    addText(slide, `user0${index + 1}`, frame.innerLeft + frame.innerWidth * 0.36 + 20, rowTop + 8, 40, 10, { size: 8, color: COLORS.text });
    addText(slide, `姓名${index + 1}`, frame.innerLeft + frame.innerWidth * 0.36 + 72, rowTop + 8, 40, 10, { size: 8, color: COLORS.text });
    addText(slide, role, frame.innerLeft + frame.innerWidth * 0.36 + 124, rowTop + 8, 62, 10, { size: 8, color: COLORS.text });
    addText(slide, "科研处", frame.innerLeft + frame.innerWidth * 0.36 + 186, rowTop + 8, 50, 10, { size: 8, color: COLORS.text });
    addPill(slide, "正常", frame.innerLeft + frame.innerWidth * 0.36 + 242, rowTop + 3, 50, { fill: COLORS.successSoft, color: COLORS.success });
  });
}

function addImageCard(slide, left, top, width, height, title, imagePath, caption) {
  addShadowPanel(slide, left, top, width, height, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  addText(slide, title, left + 18, top + 16, width - 36, 18, {
    size: 14,
    color: COLORS.ink,
    bold: true,
  });
  addText(slide, caption, left + 18, top + height - 42, width - 36, 28, {
    size: 10,
    color: COLORS.slate,
    autoFit: "shrinkText",
  });
  return addImage(slide, imagePath, left + 16, top + 46, width - 32, height - 98, "contain", title);
}

function addTableCell(slide, left, top, width, height, text, { fill = COLORS.panel, color = COLORS.text, bold = false, align = "center", border = COLORS.line } = {}) {
  addShape(slide, "rect", left, top, width, height, fill, border, 1);
  addText(slide, text, left + 6, top + 6, width - 12, height - 12, {
    size: 10,
    color,
    bold,
    align,
    valign: "middle",
    autoFit: "shrinkText",
  });
}

function slide1(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = COLORS.navy;
  addShape(slide, "ellipse", -40, -40, 260, 180, "#18B6B026", COLORS.transparent, 0);
  addShape(slide, "ellipse", 930, 540, 360, 220, "#F2B35E18", COLORS.transparent, 0);
  addShape(slide, "rect", 0, 0, W, H, "#0C2438D8", COLORS.transparent, 0);
  addImage(slide, IMG.loginBg, 720, 0, 560, 720, "cover", "登录背景图");
  addShape(slide, "rect", 720, 0, 560, 720, "#12364FB6", COLORS.transparent, 0);
  addText(slide, "本科毕业论文答辩", 76, 72, 220, 20, {
    size: 14,
    color: "#A7F3E9",
    bold: true,
    face: FONT.mono,
  });
  addShape(slide, "rect", 76, 102, 120, 4, COLORS.teal, COLORS.transparent, 0);
  addText(slide, "高校科研管理系统的\n设计与实现", 76, 138, 540, 150, {
    size: 33,
    color: COLORS.white,
    bold: true,
  });
  addText(slide, "基于 Vue 3、Spring Boot、MyBatis 与 JWT 的科研业务协同平台", 76, 302, 560, 28, {
    size: 15,
    color: "#D9E2EC",
  });
  addShadowPanel(slide, 76, 366, 372, 168, { fill: "#FFFFFF12", lineFill: "#FFFFFF28", lineWidth: 1, shadow: false });
  ["答辩人：待填写", "学号：待填写", "专业：待填写", "指导教师：待填写"].forEach((item, index) => {
    addText(slide, item, 100, 390 + index * 30, 320, 20, {
      size: 16,
      color: COLORS.white,
    });
  });
  ["项目管理", "流程审批", "报销协同", "成果归档", "AI 助手"].forEach((item, index) => {
    addPill(slide, item, 76 + index * 100, 566, index === 4 ? 94 : 88, {
      fill: "#FFFFFF16",
      color: COLORS.white,
      border: "#FFFFFF20",
    });
  });
  addText(slide, "高校科研管理从“分散记录”走向“流程闭环、权限清晰、状态可追踪”。", 76, 620, 560, 24, {
    size: 13,
    color: "#C8D6E5",
  });
}

function slide2(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 2, "CONTENTS", "答辩提纲", "围绕选题背景、系统设计、关键实现、测试结果与总结展望展开。");
  const items = [
    ["01", "研究背景", "说明高校科研管理场景中的业务痛点与建设意义。", COLORS.tealSoft, COLORS.teal],
    ["02", "需求分析", "从角色、业务链路与非功能需求明确系统目标。", COLORS.goldSoft, COLORS.gold],
    ["03", "系统设计", "展示总体架构、模块划分、权限控制和数据库设计。", COLORS.coralSoft, COLORS.coral],
    ["04", "关键实现", "重点讲解项目流程、审批报销、成果归档与 AI 助手。", COLORS.tealSoft, COLORS.teal],
    ["05", "测试结果", "从功能、权限、接口和异常处理角度验证可用性。", COLORS.goldSoft, COLORS.gold],
    ["06", "总结展望", "概括论文工作成果，并说明后续优化方向。", COLORS.coralSoft, COLORS.coral],
  ];
  items.forEach(([no, title, desc, fill, accent], index) => {
    const x = 72 + (index % 3) * 380;
    const y = 188 + Math.floor(index / 3) * 210;
    addShadowPanel(slide, x, y, 340, 168, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
    addShape(slide, "ellipse", x + 22, y + 20, 58, 58, fill, COLORS.transparent, 0);
    addText(slide, no, x + 22, y + 36, 58, 18, {
      size: 18,
      color: accent,
      bold: true,
      align: "center",
      valign: "middle",
      face: FONT.mono,
    });
    addText(slide, title, x + 96, y + 26, 180, 20, {
      size: 20,
      color: COLORS.ink,
      bold: true,
    });
    addText(slide, desc, x + 96, y + 58, 216, 64, {
      size: 13,
      color: COLORS.muted,
      autoFit: "shrinkText",
    });
    addShape(slide, "rect", x + 96, y + 126, 190, 4, accent, COLORS.transparent, 0);
  });
}

function slide3(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 3, "BACKGROUND", "研究背景与选题意义", "高校科研业务涉及多角色协同、流程审批、经费执行与成果沉淀，传统方式难以支撑全过程管理。");
  addShadowPanel(slide, 72, 182, 470, 382, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  addText(slide, "建设背景", 96, 206, 120, 20, {
    size: 18,
    color: COLORS.ink,
    bold: true,
  });
  addBulletList(slide, [
    "科研项目从申报、审批到执行、结题通常跨越较长周期，人工跟踪成本高。",
    "教师、审批人、财务管理员与系统管理员参与链路不同，权限边界必须明确。",
    "项目经费与报销常分散在不同表格或线下材料中，难以做到实时核对。",
    "结题后的成果记录若不及时归档，会削弱科研数据的沉淀价值。"
  ], 98, 246, 410, {
    lineHeight: 68,
    size: 15,
  });
  [["信息分散", "项目、经费、成果分别记录，数据不统一。", COLORS.tealSoft, COLORS.teal], ["流程冗长", "审批节点多，状态流转容易遗漏。", COLORS.goldSoft, COLORS.gold], ["追踪困难", "教师难以掌握当前阶段和待提交材料。", COLORS.coralSoft, COLORS.coral], ["沉淀不足", "项目完成后成果统计与复用能力偏弱。", COLORS.successSoft, COLORS.success]].forEach(([title, body, fill, accent], index) => {
    const x = 580 + (index % 2) * 300;
    const y = 190 + Math.floor(index / 2) * 150;
    addShadowPanel(slide, x, y, 268, 126, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
    addShape(slide, "rect", x, y, 8, 126, accent, COLORS.transparent, 0);
    addText(slide, title, x + 24, y + 20, 160, 18, {
      size: 18,
      color: COLORS.ink,
      bold: true,
    });
    addText(slide, body, x + 24, y + 50, 220, 52, {
      size: 13,
      color: COLORS.muted,
      autoFit: "shrinkText",
    });
    addPill(slide, "核心痛点", x + 176, y + 18, 72, { fill, color: accent });
  });
  addShadowPanel(slide, 580, 510, 556, 92, { fill: COLORS.deepTeal, lineFill: COLORS.transparent, lineWidth: 0, shadow: false });
  addText(slide, "选题意义", 606, 532, 90, 18, {
    size: 18,
    color: COLORS.white,
    bold: true,
  });
  addText(slide, "以项目为主线，将“权限控制、流程审批、经费报销、成果归档”串联为一个统一的科研业务闭环。", 606, 558, 490, 24, {
    size: 13,
    color: "#D9F7F4",
  });
}

function slide4(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 4, "REQUIREMENTS", "需求分析与建设目标", "围绕核心角色、业务闭环与系统质量要求，明确本科毕设实现边界。");
  const roles = [
    ["系统管理员", "负责用户、角色、部门和全局配置维护。", COLORS.tealSoft, COLORS.teal],
    ["教师用户", "负责项目申报、阶段提交、成果录入等业务。", COLORS.goldSoft, COLORS.gold],
    ["财务管理员", "负责报销审核、经费核验与资金流向把控。", COLORS.coralSoft, COLORS.coral],
    ["多级审批人", "负责申请审批与项目流程节点审核。", COLORS.successSoft, COLORS.success],
  ];
  roles.forEach(([title, body, fill, accent], index) => {
    const x = 72 + index * 290;
    addShadowPanel(slide, x, 186, 252, 128, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
    addShape(slide, "ellipse", x + 22, 206, 40, 40, fill, COLORS.transparent, 0);
    addText(slide, String(index + 1), x + 22, 217, 40, 18, {
      size: 15,
      color: accent,
      bold: true,
      align: "center",
      face: FONT.mono,
    });
    addText(slide, title, x + 76, 206, 150, 18, {
      size: 17,
      color: COLORS.ink,
      bold: true,
    });
    addText(slide, body, x + 76, 234, 150, 52, {
      size: 12,
      color: COLORS.muted,
      autoFit: "shrinkText",
    });
  });
  addShadowPanel(slide, 72, 352, 520, 236, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  addText(slide, "核心业务需求", 96, 376, 140, 20, {
    size: 18,
    color: COLORS.ink,
    bold: true,
  });
  addBulletList(slide, [
    "支持项目新增、查询、详情查看、状态维护与导出。",
    "支持按流程阶段提交材料，并对审批结果进行回写。",
    "支持申请审批、报销审批与成果信息管理。",
    "支持根据角色控制菜单可见性、默认首页与路由访问权限。"
  ], 98, 416, 460, {
    lineHeight: 42,
    size: 14,
  });
  addShadowPanel(slide, 626, 352, 510, 236, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  addText(slide, "建设目标", 650, 376, 100, 20, {
    size: 18,
    color: COLORS.ink,
    bold: true,
  });
  [["权限隔离", "不同角色只能访问对应模块与接口。", COLORS.tealSoft, COLORS.teal], ["流程闭环", "状态推进与节点提交具有先后约束。", COLORS.goldSoft, COLORS.gold], ["经费透明", "预算、报销与审批记录能够统一追踪。", COLORS.coralSoft, COLORS.coral], ["易于扩展", "保留 AI、导出与文档处理等扩展能力。", COLORS.successSoft, COLORS.success]].forEach(([title, body, fill, accent], index) => {
    const x = 650 + (index % 2) * 240;
    const y = 414 + Math.floor(index / 2) * 88;
    addShadowPanel(slide, x, y, 216, 72, { fill, lineFill: COLORS.transparent, lineWidth: 0, shadow: false });
    addText(slide, title, x + 16, y + 12, 100, 18, {
      size: 15,
      color: accent,
      bold: true,
    });
    addText(slide, body, x + 16, y + 34, 178, 26, {
      size: 11,
      color: COLORS.text,
      autoFit: "shrinkText",
    });
  });
}

function slide5(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 5, "ARCHITECTURE", "系统总体架构与技术路线", "采用前后端分离架构，以 Vue 3 构建管理端，以 Spring Boot 提供业务服务与安全控制。");
  const layers = [
    ["表示层", "Vue 3 / Vite / Element Plus / Pinia / Vue Router / ECharts", COLORS.tealSoft, COLORS.teal],
    ["业务层", "Controller - Service - Mapper 分层，封装项目、审批、报销、成果等业务逻辑", COLORS.goldSoft, COLORS.gold],
    ["数据与安全层", "MyBatis + MySQL + Spring Security + JWT，实现持久化与接口鉴权", COLORS.coralSoft, COLORS.coral],
    ["扩展集成层", "Swagger / EasyExcel / Apache POI / iText / Qwen API / SSE 流式响应", COLORS.successSoft, COLORS.success],
  ];
  layers.forEach(([title, body, fill, accent], index) => {
    const y = 182 + index * 108;
    addShadowPanel(slide, 72, y, 772, 88, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
    addShape(slide, "roundRect", 86, y + 14, 134, 60, fill, COLORS.transparent, 0);
    addText(slide, title, 86, y + 33, 134, 16, {
      size: 17,
      color: accent,
      bold: true,
      align: "center",
      valign: "middle",
    });
    addText(slide, body, 240, y + 24, 578, 40, {
      size: 13,
      color: COLORS.text,
      autoFit: "shrinkText",
    });
    if (index < layers.length - 1) {
      addShape(slide, "rightArrow", 420, y + 88, 80, 18, "#C8D6E5", COLORS.transparent, 0);
    }
  });
  addShadowPanel(slide, 888, 184, 328, 186, { fill: COLORS.deepTeal, lineFill: COLORS.transparent, lineWidth: 0, shadow: false });
  addText(slide, "架构特点", 912, 208, 100, 18, {
    size: 18,
    color: COLORS.white,
    bold: true,
  });
  addBulletList(slide, [
    "前后端分离，接口职责边界清晰",
    "路由守卫与 JWT 双重校验访问",
    "保留 AI、导出和文档处理能力"
  ], 912, 246, 270, {
    bulletColor: "#A7F3E9",
    textColor: "#E8F4F8",
    size: 13,
    lineHeight: 38,
  });
  addShadowPanel(slide, 888, 392, 328, 198, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  addText(slide, "关键技术栈", 912, 416, 120, 18, {
    size: 18,
    color: COLORS.ink,
    bold: true,
  });
  [["前端", "Vue 3 + Vite"], ["后端", "Spring Boot + MyBatis"], ["鉴权", "Spring Security + JWT"], ["接口文档", "Swagger / OpenAPI"], ["AI 扩展", "Qwen + SSE"], ["导出能力", "EasyExcel / POI / PDF"]].forEach(([title, body], index) => {
    const x = 912 + (index % 2) * 146;
    const y = 452 + Math.floor(index / 2) * 44;
    addShape(slide, "roundRect", x, y, 132, 32, "#F8FAFC", COLORS.line, 1);
    addText(slide, title, x + 10, y + 8, 48, 14, { size: 10, color: COLORS.teal, bold: true });
    addText(slide, body, x + 58, y + 8, 62, 14, { size: 8, color: COLORS.text, autoFit: "shrinkText" });
  });
}

function slide6(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 6, "MODULES", "功能模块设计", "围绕“项目”为主轴，将权限、审批、经费、成果与 AI 扩展形成协同体系。");
  const cards = [
    ["登录与权限", "登录、退出、用户信息获取、默认首页分发", 72, 196, COLORS.tealSoft, COLORS.teal],
    ["首页工作台", "项目概览、待办汇总、预算对比图表", 424, 196, COLORS.goldSoft, COLORS.gold],
    ["用户/角色", "用户、角色、部门树维护与导出", 776, 196, COLORS.coralSoft, COLORS.coral],
    ["项目管理", "项目列表、详情查看、增删改导出", 72, 362, COLORS.successSoft, COLORS.success],
    ["流程审批", "多级审批、意见回写、状态推进", 776, 362, COLORS.tealSoft, COLORS.teal],
    ["报销管理", "金额审核、附件查看、通过/驳回", 72, 528, COLORS.goldSoft, COLORS.gold],
    ["成果管理", "成果维护、统计分析与导出", 424, 528, COLORS.coralSoft, COLORS.coral],
    ["AI 助手", "调用千问模型，支持普通/流式问答", 776, 528, COLORS.successSoft, COLORS.success],
  ];
  cards.forEach(([title, body, x, y, fill, accent]) => {
    addShadowPanel(slide, x, y, 280, 118, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
    addShape(slide, "rect", x, y, 8, 118, accent, COLORS.transparent, 0);
    addText(slide, title, x + 24, y + 18, 150, 18, {
      size: 18,
      color: COLORS.ink,
      bold: true,
    });
    addText(slide, body, x + 24, y + 48, 230, 48, {
      size: 12,
      color: COLORS.muted,
      autoFit: "shrinkText",
    });
    addPill(slide, "核心模块", x + 182, y + 16, 76, { fill, color: accent });
  });
  addShadowPanel(slide, 426, 356, 278, 124, { fill: COLORS.deepTeal, lineFill: COLORS.transparent, lineWidth: 0, shadow: false });
  addText(slide, "高校科研\n管理系统", 426, 390, 278, 52, {
    size: 28,
    color: COLORS.white,
    bold: true,
    align: "center",
    valign: "middle",
  });
  addText(slide, "以项目生命周期为主线，连接审批、报销与成果归档", 452, 446, 226, 28, {
    size: 12,
    color: "#D9F7F4",
    align: "center",
  });
}

async function slide7(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 7, "PERMISSION", "角色与权限控制设计", "前端通过路由守卫和 moduleKey 过滤菜单，后端通过 Spring Security 与 JWT 鉴别接口访问。");
  addShadowPanel(slide, 72, 184, 360, 180, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  addText(slide, "权限机制", 96, 208, 100, 18, {
    size: 18,
    color: COLORS.ink,
    bold: true,
  });
  addBulletList(slide, [
    "登录成功后获取 token 与当前用户角色信息。",
    "前端根据 roleKey 自动分配默认首页并拦截非法路由。",
    "后端未登录请求返回 401，核心接口需要认证后访问。"
  ], 98, 244, 300, {
    lineHeight: 38,
    size: 13,
  });
  addShadowPanel(slide, 72, 390, 360, 210, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  addText(slide, "权限分发路径", 96, 414, 140, 18, {
    size: 16,
    color: COLORS.ink,
    bold: true,
  });
  const permissionSteps = [
    ["登录成功", 96, 454, 92],
    ["获取用户\n信息", 206, 454, 92],
    ["默认首页\n分配", 316, 454, 92],
  ];
  permissionSteps.forEach(([label, x, y, w]) => {
    addShape(slide, "roundRect", x, y, w, 42, "#F8FAFC", COLORS.line, 1);
    addText(slide, label, x + 6, y + 10, w - 12, 22, {
      size: 10,
      color: COLORS.text,
      bold: true,
      align: "center",
      valign: "middle",
      autoFit: "shrinkText",
    });
  });
  addShape(slide, "rightArrow", 186, 466, 18, 14, "#C8D6E5", COLORS.transparent, 0);
  addShape(slide, "rightArrow", 296, 466, 18, 14, "#C8D6E5", COLORS.transparent, 0);
  addShape(slide, "roundRect", 118, 520, 268, 46, COLORS.tealSoft, COLORS.transparent, 0);
  addText(slide, "菜单与路由鉴权", 118, 534, 268, 18, {
    size: 12,
    color: COLORS.teal,
    bold: true,
    align: "center",
    valign: "middle",
  });
  addText(slide, "关键词：token、roleKey、moduleKey", 96, 574, 290, 16, {
    size: 10,
    color: COLORS.slate,
    face: FONT.mono,
    align: "center",
  });

  addShadowPanel(slide, 470, 184, 742, 416, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  addText(slide, "模块访问矩阵", 494, 208, 120, 18, {
    size: 18,
    color: COLORS.ink,
    bold: true,
  });
  const columns = ["首页", "项目", "审批", "报销", "成果", "用户角色"];
  const rows = [
    ["系统管理员", ["是", "是", "是", "是", "是", "是"]],
    ["教师用户", ["是", "是", "否", "否", "是", "否"]],
    ["财务管理员", ["否", "否", "否", "是", "否", "否"]],
    ["一级审批人", ["否", "否", "是", "否", "否", "否"]],
    ["二级审批人", ["否", "否", "是", "否", "否", "否"]],
    ["三级审批人", ["否", "否", "是", "否", "否", "否"]],
  ];
  const startLeft = 494;
  const startTop = 244;
  const rowH = 44;
  const firstColW = 128;
  const colW = 90;
  addTableCell(slide, startLeft, startTop, firstColW, rowH, "角色/模块", { fill: "#F1F5F9", color: COLORS.slate, bold: true });
  columns.forEach((col, index) => {
    addTableCell(slide, startLeft + firstColW + index * colW, startTop, colW, rowH, col, {
      fill: "#F1F5F9",
      color: COLORS.slate,
      bold: true,
    });
  });
  rows.forEach(([role, access], rowIndex) => {
    const y = startTop + rowH + rowIndex * rowH;
    addTableCell(slide, startLeft, y, firstColW, rowH, role, { fill: COLORS.panelSoft, color: COLORS.text, bold: true, align: "left" });
    access.forEach((value, colIndex) => {
      addTableCell(slide, startLeft + firstColW + colIndex * colW, y, colW, rowH, value, {
        fill: value === "是" ? COLORS.successSoft : COLORS.panel,
        color: value === "是" ? COLORS.success : COLORS.slate,
        bold: value === "是",
      });
    });
  });
  addText(slide, "说明：权限矩阵依据前端 `permission.js` 中的模块映射整理，答辩时可重点说明“管理员全局可控、教师聚焦业务、审批角色专注流程、财务角色独立核销”。", 494, 562, 684, 24, {
    size: 11,
    color: COLORS.muted,
    autoFit: "shrinkText",
  });
}

function slide8(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 8, "DATABASE", "数据库设计与核心实体关系", "系统以项目实体为中心，将流程、申请、报销、成果、预算与用户权限组织为一体。");
  addShadowPanel(slide, 462, 250, 300, 164, { fill: COLORS.deepTeal, lineFill: COLORS.transparent, lineWidth: 0, shadow: false });
  addText(slide, "project", 462, 286, 300, 22, {
    size: 26,
    color: COLORS.white,
    bold: true,
    align: "center",
    face: FONT.mono,
  });
  addText(slide, "projectNo / projectName / leaderId /\nstatus / currentStage / totalFund", 490, 330, 244, 44, {
    size: 12,
    color: "#D9F7F4",
    align: "center",
  });
  const entities = [
    ["user", 92, 198, 210, 92, COLORS.tealSoft, COLORS.teal, "账号、姓名、部门、角色、状态"],
    ["role", 92, 318, 210, 74, COLORS.goldSoft, COLORS.gold, "roleName / roleKey"],
    ["department", 92, 420, 210, 74, COLORS.coralSoft, COLORS.coral, "层级、父子结构"],
    ["application", 866, 180, 270, 82, COLORS.tealSoft, COLORS.teal, "申请内容、当前节点、审批状态"],
    ["project_process", 866, 282, 270, 82, COLORS.goldSoft, COLORS.gold, "阶段、顺序、审批意见、附件"],
    ["reimbursement", 866, 384, 270, 82, COLORS.coralSoft, COLORS.coral, "报销金额、类型、审批时间"],
    ["achievement", 866, 486, 270, 82, COLORS.successSoft, COLORS.success, "成果名称、类型、级别、发布日期"],
    ["budget", 462, 452, 300, 92, "#EEF2FF", "#5B8FF9", "预算明细与执行对比"],
  ];
  entities.forEach(([name, x, y, w, h, fill, accent, desc]) => {
    addShadowPanel(slide, x, y, w, h, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
    addShape(slide, "rect", x, y, 8, h, accent, COLORS.transparent, 0);
    addText(slide, name, x + 22, y + 16, w - 44, 18, {
      size: 17,
      color: COLORS.ink,
      bold: true,
      face: FONT.mono,
    });
    addText(slide, desc, x + 22, y + 42, w - 44, h - 52, {
      size: 11,
      color: COLORS.muted,
      autoFit: "shrinkText",
    });
    addPill(slide, "核心表", x + w - 92, y + 14, 72, { fill, color: accent });
  });
  [["关联", 312, 240, 124, 18], ["关联", 312, 344, 124, 18], ["关联", 312, 446, 124, 18], ["驱动", 778, 212, 72, 18], ["驱动", 778, 314, 72, 18], ["驱动", 778, 416, 72, 18], ["归档", 778, 518, 72, 18], ["预算", 574, 426, 72, 18]].forEach(([label, x, y, w, h]) => {
    addShape(slide, "rightArrow", x, y, w, h, "#C8D6E5", COLORS.transparent, 0);
    addText(slide, label, x + 8, y + 2, w - 16, 12, {
      size: 8,
      color: COLORS.slate,
      align: "center",
      valign: "middle",
    });
  });
}

function slide9(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 9, "FLOW", "项目生命周期与流程控制", "后端以顺序审批逻辑控制阶段推进，并在结题后自动生成成果记录。");
  const steps = [
    ["1", "立项申报", "创建项目与预算，初始化流程节点"],
    ["2", "待开工", "审批通过后进入执行准备阶段"],
    ["3", "项目实施", "按节点提交阶段材料和过程信息"],
    ["4", "中期检查", "根据阶段审核结果更新项目状态"],
    ["5", "结题报告", "完成最终材料提交与验收"],
    ["6", "成果归档", "自动生成成果记录，形成闭环"],
  ];
  steps.forEach(([no, title, desc], index) => {
    const x = 72 + index * 190;
    addShadowPanel(slide, x, 204, 164, 154, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
    addShape(slide, "ellipse", x + 52, 222, 60, 60, index % 3 === 0 ? COLORS.tealSoft : index % 3 === 1 ? COLORS.goldSoft : COLORS.coralSoft, COLORS.transparent, 0);
    addText(slide, no, x + 52, 240, 60, 18, {
      size: 18,
      color: index % 3 === 0 ? COLORS.teal : index % 3 === 1 ? COLORS.gold : COLORS.coral,
      bold: true,
      align: "center",
      face: FONT.mono,
    });
    addText(slide, title, x + 18, 298, 128, 20, {
      size: 16,
      color: COLORS.ink,
      bold: true,
      align: "center",
    });
    addText(slide, desc, x + 18, 324, 128, 38, {
      size: 10,
      color: COLORS.muted,
      align: "center",
      autoFit: "shrinkText",
    });
    if (index < steps.length - 1) {
      addShape(slide, "rightArrow", x + 156, 272, 32, 18, "#C8D6E5", COLORS.transparent, 0);
    }
  });
  addShadowPanel(slide, 72, 420, 548, 168, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  addText(slide, "流程控制逻辑", 96, 446, 120, 18, {
    size: 18,
    color: COLORS.ink,
    bold: true,
  });
  addBulletList(slide, [
    "`submitProcess` 会校验前序节点是否已经通过，避免阶段越级提交。",
    "`approveProcess` 在审批通过后更新项目当前阶段与整体状态。",
    "当最后一个阶段完成时，系统自动创建一条成果记录，减少人工补录。"
  ], 98, 484, 480, {
    lineHeight: 40,
    size: 13,
  });
  addShadowPanel(slide, 662, 420, 474, 168, { fill: COLORS.deepTeal, lineFill: COLORS.transparent, lineWidth: 0, shadow: false });
  addText(slide, "答辩可强调的实现亮点", 686, 446, 180, 18, {
    size: 18,
    color: COLORS.white,
    bold: true,
  });
  addBulletList(slide, [
    "项目状态不是手工写死，而是由流程审批结果驱动。",
    "流程节点具备提交时间、审批意见、审批人和附件信息。",
    "待办中心可根据当前角色自动聚合“待审批”或“待提交”事项。"
  ], 688, 484, 404, {
    bulletColor: "#A7F3E9",
    textColor: "#E8F4F8",
    size: 13,
    lineHeight: 38,
  });
}

async function slide10(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 10, "IMPLEMENTATION", "关键实现一：项目管理与流程详情", "这部分重点展示项目列表、流程详情以及阶段材料提交的业务闭环。");
  await addImageCard(slide, 72, 190, 540, 364, "项目管理任务流", IMG.flowProjectList, "支持条件查询、查看列表、新增/编辑/删除、导出与进入详情，体现项目全生命周期管理。");
  await addImageCard(slide, 666, 190, 540, 364, "项目流程详情任务流", IMG.flowProcessDetail, "支持阶段切换、查看详情、上传附件、提交当前阶段与预览下载，体现过程留痕。");
  addShadowPanel(slide, 72, 574, 1134, 72, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  ["前端通过项目列表与详情页承接主要业务入口。", "流程详情页重点解决“当前到哪一步、需要交什么材料”的问题。", "后端根据 `orderNum` 与状态码控制节点先后顺序。"].forEach((item, index) => {
    addText(slide, item, 96 + index * 360, 596, 300, 18, {
      size: 12,
      color: index === 1 ? COLORS.teal : COLORS.text,
      bold: index === 1,
      align: "center",
      valign: "middle",
    });
  });
}

async function slide11(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 11, "IMPLEMENTATION", "关键实现二：审批、报销与成果管理", "系统不仅管理项目，还覆盖申请审批、报销审核和成果归档等配套业务。");
  const cards = [
    ["申请审批", IMG.flowApplication, "支持按节点筛选待办申请，审批通过或驳回后回写意见与状态。", COLORS.teal],
    ["报销管理", IMG.flowReimbursement, "支持查看报销单、预览附件、审核通过/拒绝，并统计项目支出。", COLORS.gold],
    ["成果管理", IMG.flowAchievement, "项目完成后可维护成果信息，并支持统计分析与数据导出。", COLORS.coral],
  ];
  for (let index = 0; index < cards.length; index += 1) {
    const [title, imagePath, body, accent] = cards[index];
    const x = 72 + index * 392;
    addShadowPanel(slide, x, 196, 352, 386, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
    addShape(slide, "rect", x, 196, 352, 8, accent, COLORS.transparent, 0);
    addText(slide, title, x + 20, 220, 130, 18, {
      size: 18,
      color: COLORS.ink,
      bold: true,
    });
    await addImage(slide, imagePath, x + 18, 254, 316, 214, "contain", title);
    addText(slide, body, x + 20, 486, 312, 60, {
      size: 12,
      color: COLORS.muted,
      autoFit: "shrinkText",
    });
    addPill(slide, "业务闭环", x + 248, 218, 84, { fill: accent === COLORS.teal ? COLORS.tealSoft : accent === COLORS.gold ? COLORS.goldSoft : COLORS.coralSoft, color: accent });
  }
}

function slide12(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 12, "HIGHLIGHTS", "系统特色与创新点", "相较于单纯的增删改查，本课题重点强化流程驱动、权限控制与扩展能力。");
  const highlights = [
    ["多角色 RBAC", "前端基于 `moduleKey` 做菜单与路由过滤，后端基于 JWT 和 Spring Security 做接口鉴权。", COLORS.tealSoft, COLORS.teal],
    ["项目闭环驱动", "项目状态由流程审批结果推进，而不是手动切换；结题后可自动生成成果记录。", COLORS.goldSoft, COLORS.gold],
    ["经费一体化", "在首页展示预算与实际支出对比，在业务页支持报销申请、审核与统计导出。", COLORS.coralSoft, COLORS.coral],
    ["AI 助手接入", "集成通义千问兼容接口，支持普通问答与 SSE 流式响应，为科研服务提供扩展入口。", COLORS.successSoft, COLORS.success],
  ];
  highlights.forEach(([title, body, fill, accent], index) => {
    const x = 72 + (index % 2) * 572;
    const y = 192 + Math.floor(index / 2) * 188;
    addShadowPanel(slide, x, y, 536, 152, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
    addShape(slide, "ellipse", x + 24, y + 24, 52, 52, fill, COLORS.transparent, 0);
    addText(slide, String(index + 1), x + 24, y + 40, 52, 18, {
      size: 16,
      color: accent,
      bold: true,
      align: "center",
      face: FONT.mono,
    });
    addText(slide, title, x + 94, y + 28, 180, 18, {
      size: 20,
      color: COLORS.ink,
      bold: true,
    });
    addText(slide, body, x + 94, y + 58, 400, 64, {
      size: 13,
      color: COLORS.muted,
      autoFit: "shrinkText",
    });
    addPill(slide, "特色设计", x + 412, y + 28, 92, { fill, color: accent });
  });
  ["前后端分离", "流程可追踪", "预算可视化", "文件可导出", "AI 可扩展"].forEach((item, index) => {
    addPill(slide, item, 72 + index * 220, 590, index === 2 ? 98 : 90, {
      fill: index % 2 === 0 ? COLORS.tealSoft : COLORS.goldSoft,
      color: index % 2 === 0 ? COLORS.teal : COLORS.gold,
    });
  });
}

function slide13(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 13, "UI DEMO", "系统界面展示：登录与工作台", "答辩时可以用这两页界面示意快速说明系统的入口设计与日常工作场景。");
  drawLoginMock(slide, 72, 190, 506, 410);
  drawDashboardMock(slide, 642, 190, 564, 410);
  addText(slide, "登录页突出统一入口与权限分发，工作台则承担统计概览、待办聚合和预算对比展示。", 72, 622, 1134, 20, {
    size: 13,
    color: COLORS.muted,
    align: "center",
  });
}

function slide14(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 14, "UI DEMO", "系统界面展示：业务与管理页面", "项目列表、审批报销和用户角色页面共同支撑系统的核心业务协同与后台维护。");
  drawProjectMock(slide, 72, 200, 360, 374);
  drawApprovalMock(slide, 460, 200, 360, 374);
  drawAdminMock(slide, 848, 200, 360, 374);
  ["项目页面", "审批页面", "后台管理"].forEach((label, index) => {
    addText(slide, label, 196 + index * 388, 582, 110, 18, {
      size: 15,
      color: index === 1 ? COLORS.teal : COLORS.ink,
      bold: true,
      align: "center",
    });
  });
}

function slide15(presentation) {
  const slide = presentation.slides.add();
  addSectionHeader(slide, 15, "TESTING", "系统测试与实现效果", "以功能验证为主，结合权限校验、接口联调与异常处理，确认系统具备答辩展示与后续扩展基础。");
  addShadowPanel(slide, 72, 190, 664, 392, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  addText(slide, "测试维度", 96, 214, 90, 18, {
    size: 18,
    color: COLORS.ink,
    bold: true,
  });
  const testRows = [
    ["功能链路", "登录、项目管理、流程提交、审批回写、报销审核、成果管理", "已验证"],
    ["权限控制", "不同角色首页分发、菜单隔离、非法路由拦截、接口认证", "已验证"],
    ["接口联调", "分页查询、文件上传下载、导出接口、AI 聊天接口", "已验证"],
    ["异常处理", "Token 失效、空数据回退、AI Key 缺失提示、审批前置校验", "已验证"],
  ];
  addTableCell(slide, 96, 252, 132, 42, "测试项", { fill: "#F1F5F9", color: COLORS.slate, bold: true });
  addTableCell(slide, 228, 252, 394, 42, "说明", { fill: "#F1F5F9", color: COLORS.slate, bold: true });
  addTableCell(slide, 622, 252, 84, 42, "结论", { fill: "#F1F5F9", color: COLORS.slate, bold: true });
  testRows.forEach(([item, desc, status], index) => {
    const y = 294 + index * 70;
    addTableCell(slide, 96, y, 132, 70, item, { fill: COLORS.panelSoft, color: COLORS.text, bold: true, align: "left" });
    addTableCell(slide, 228, y, 394, 70, desc, { fill: COLORS.panel, color: COLORS.text, align: "left" });
    addTableCell(slide, 622, y, 84, 70, status, { fill: COLORS.successSoft, color: COLORS.success, bold: true });
  });

  addShadowPanel(slide, 778, 190, 428, 180, { fill: COLORS.deepTeal, lineFill: COLORS.transparent, lineWidth: 0, shadow: false });
  addText(slide, "实现效果", 802, 216, 100, 18, {
    size: 18,
    color: COLORS.white,
    bold: true,
  });
  [["业务闭环清晰", "项目、审批、报销、成果形成连续链路。", COLORS.tealSoft, COLORS.teal], ["权限边界明确", "不同角色职责分离，访问路径清晰。", COLORS.goldSoft, COLORS.gold], ["扩展能力良好", "具备 AI、导出和文档处理等扩展基础。", COLORS.coralSoft, COLORS.coral]].forEach(([title, body, fill, accent], index) => {
    const y = 250 + index * 42;
    addShape(slide, "roundRect", 804, y, 378, 32, fill, COLORS.transparent, 0);
    addText(slide, title, 818, y + 8, 120, 14, {
      size: 11,
      color: accent,
      bold: true,
    });
    addText(slide, body, 944, y + 8, 226, 14, {
      size: 10,
      color: COLORS.text,
      autoFit: "shrinkText",
    });
  });
  addShadowPanel(slide, 778, 396, 428, 186, { fill: COLORS.panel, lineFill: COLORS.line, lineWidth: 1, shadow: false });
  addText(slide, "答辩建议", 802, 420, 100, 18, {
    size: 18,
    color: COLORS.ink,
    bold: true,
  });
  addBulletList(slide, [
    "强调系统不是静态页面，而是具备状态回写与权限控制的业务系统。",
    "回答老师提问时，可从“为什么这样分角色”和“为什么这样推进流程”两个角度展开。",
    "如果被追问创新点，可重点讲 AI 接口接入和成果自动归档逻辑。"
  ], 804, 454, 370, {
    lineHeight: 38,
    size: 12,
  });
}

function slide16(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = COLORS.navy;
  addShape(slide, "ellipse", 920, -40, 320, 200, "#18B6B020", COLORS.transparent, 0);
  addShape(slide, "ellipse", -30, 510, 280, 180, "#F2B35E18", COLORS.transparent, 0);
  addText(slide, "总结与展望", 76, 82, 220, 20, {
    size: 14,
    color: "#A7F3E9",
    bold: true,
    face: FONT.mono,
  });
  addText(slide, "感谢聆听", 76, 132, 360, 54, {
    size: 42,
    color: COLORS.white,
    bold: true,
  });
  addText(slide, "Q & A", 76, 194, 180, 28, {
    size: 22,
    color: "#D9E2EC",
    bold: true,
  });
  addText(slide, "本课题围绕高校科研管理业务，完成了从需求分析、系统设计到关键模块实现与答辩展示的整体工作。", 76, 252, 420, 54, {
    size: 15,
    color: "#E8F4F8",
  });
  addPill(slide, "本科论文答辩", 76, 332, 128, { fill: "#FFFFFF14", color: COLORS.white, border: "#FFFFFF1F" });

  addShadowPanel(slide, 560, 98, 600, 232, { fill: "#FFFFFF10", lineFill: "#FFFFFF22", lineWidth: 1, shadow: false });
  addText(slide, "论文工作总结", 588, 126, 140, 18, {
    size: 20,
    color: COLORS.white,
    bold: true,
  });
  addBulletList(slide, [
    "完成高校科研管理系统的总体架构、模块划分与权限设计。",
    "实现项目管理、流程审批、报销协同、成果管理与 AI 助手等核心功能。",
    "形成适合本科答辩展示的系统说明、流程逻辑与界面原型。"
  ], 590, 164, 520, {
    bulletColor: "#A7F3E9",
    textColor: "#E8F4F8",
    size: 14,
    lineHeight: 42,
  });

  addShadowPanel(slide, 560, 372, 600, 232, { fill: "#FFFFFF10", lineFill: "#FFFFFF22", lineWidth: 1, shadow: false });
  addText(slide, "后续优化方向", 588, 400, 140, 18, {
    size: 20,
    color: COLORS.white,
    bold: true,
  });
  addBulletList(slide, [
    "补充自动化测试与更完整的异常场景覆盖，提升系统稳定性。",
    "引入消息提醒、待办推送和更精细的流程配置能力。",
    "围绕科研问答、政策检索与材料辅助生成继续深化 AI 服务。"
  ], 590, 438, 520, {
    bulletColor: "#FFD9A8",
    textColor: "#E8F4F8",
    size: 14,
    lineHeight: 42,
  });
}

async function exportDeck(presentation) {
  await ensureDir(OUT_DIR);
  await ensureDir(PREVIEW_DIR);

  for (let index = 0; index < presentation.slides.items.length; index += 1) {
    const slide = presentation.slides.items[index];
    const preview = await presentation.export({ slide, format: "png", scale: 1 });
    const previewPath = path.join(PREVIEW_DIR, `slide-${String(index + 1).padStart(2, "0")}.png`);
    const previewBytes = new Uint8Array(await preview.arrayBuffer());
    await fs.writeFile(previewPath, previewBytes);
  }

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);
  await fs.copyFile(FINAL_PPTX, NAMED_PPTX);
}

async function build() {
  await ensureDir(OUT_DIR);
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  slide1(presentation);
  slide2(presentation);
  slide3(presentation);
  slide4(presentation);
  slide5(presentation);
  slide6(presentation);
  await slide7(presentation);
  slide8(presentation);
  slide9(presentation);
  await slide10(presentation);
  await slide11(presentation);
  slide12(presentation);
  slide13(presentation);
  slide14(presentation);
  slide15(presentation);
  slide16(presentation);
  await exportDeck(presentation);
  console.log(NAMED_PPTX);
}

await build();
