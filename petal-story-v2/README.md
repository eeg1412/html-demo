# 花铃物语 · 第一期

HTML + 原生 JavaScript + PixiJS 8.17.1 的单地图横版打怪升级游戏。主角名为「软棉棉」，使用用户提供的三视图，通过内置 imagegen 生成八动作透明图集，保留白色短发、盘羊角、花冠与粉白裙装。

## 运行

在项目目录运行 `python -m http.server 8000 --directory dist`，然后打开 `http://localhost:8000`。无需构建。渲染引擎和游戏图片均随项目保存，字体有系统字体回退。

## 操作

- A/D 或左右方向键：移动；空格/W/上方向键：跳跃。
- J：落花斩，免费近身群攻。
- K：铃光弹，贯穿远程攻击，消耗 14 魔力。
- L：花雨绽放，范围攻击，消耗 32 魔力。
- C：基础属性；V：技能升级；Esc：暂停。
- 手机：左侧移动按钮、右侧跳跃，下方三个技能按钮。支持按住技能、多指同时输入与横竖屏。

## 养成与战斗

只有一张地图「花语原野」，一种怪物「芽芽史莱姆」，包含多个刷新点和可跳跃平台。人物、力量/体质/灵性等级、三种技能等级上限均为 999。生命、伤害等派生数值不以 999 封顶。

每次升级恢复生命和魔力，获得 5 属性点及 3 技能点。怪物生命、攻击和经验随人物等级变化。死亡播放倒下、花瓣消散及倒计时，3 秒后在本地图花铃石重生，保留养成数据并获得 3 秒无敌。魔力自动恢复，升级和重生恢复生命。

进度存于 localStorage (`petal-story-v1`)，每五秒、升级、击杀、属性分配、页面隐藏时保存；不跨设备同步。暂停或打开养成面板时，战斗、冷却与死亡倒计时停止。

## 文件

- `dist/engine.js`：不依赖 DOM 的战斗、物理、成长、重生模型。
- `dist/game.js`：PixiJS 场景、生成图集裁切、特效、键盘/触控、UI 和存档。
- `dist/style.css`、`dist/index.html`：自适应游戏界面。
- `dist/assets/hero.png`：1536×1024 RGBA 八动作主角图集。
- `dist/assets/forest.png`：1536×1024 森林背景。
- `dist/assets/objects.png`：1254×1254 RGBA 怪物、平台、重生石、岩石图集。
- `tests/engine.test.mjs`：运行 `node --test tests/engine.test.mjs`。

## 生图提示概要

工具：内置 imagegen；主角以用户提供的正面、侧面、背面图为身份参考。

1. 主角：清晰手绘日韩横版 RPG Q 版，白色短发、棕色盘羊角、粉色花冠、粉白层叠裙和铃铛；三分之四朝右；透明背景，4×2 八动作（待机、跑步 A/B、跳跃、挥杖攻击、施法、受伤、倒下）。保留角色身份，避免文字和 UI。透明修正后的素材为最终版本，手动纹理框定义见 game.js。
2. 背景：清新手绘奇幻森林、薄荷色树冠、明亮天空、远山瀑布、粉色花朵与漂浮光点；中央留出横版游戏活动区、底部约 78% 处为草地，无人物、文字或 UI。
3. 物件：透明 2×2 图集，萌芽青绿色史莱姆、横向苔藓草土地块、发光薄荷色重生水晶与石座、苔藓花朵岩石；与主角统一的精致 Q 版手绘风格。

PixiJS API 参考：[Application](https://pixijs.download/v8.17.1/docs/app.Application.html)、[Assets](https://pixijs.com/8.x/guides/components/assets)。


## 第二版：角色动画与缩放

角色显示名改为「软棉棉」，沿用原浏览器存档。

新生成的技能图集包含 6 帧落花斩、4 帧铃光弹、4 帧花雨绽放。行走改为从新生成透明角色素材中裁切双腿、上身和衣摆，用独立双腿骨骼轨迹驱动连续步态，确保左右脚交替，不使用重绘失败的行走图。技能动画由 PixiJS `AnimatedSprite` 播放，每帧独立时长；施法分为前摇、出手、收招，伤害与特效在出手时触发。同类技能再次施放从第一帧重新开始，受击或死亡会中断尚未出手的技能。暂停时动画、前摇与冷却一起冻结。

纹理在首次上传 GPU 前设置 `scaleMode = 'linear'`、`autoGenerateMipmaps = true` 和 `mipmapFilter = 'linear'`。关闭像素取整，保留渲染器抗锯齿，使用 2–3 倍渲染分辨率及 `autoDensity`。头像 Canvas 设置高质量图像平滑。线性采样处理像素间插值，mipmap 降低高分辨率头发、蕾丝纹理缩小时的闪烁和锯齿；不对整个人物施加模糊滤镜。

参考：[PixiJS TextureSource](https://pixijs.download/v8.17.1/docs/rendering.TextureSource.html)、[AnimatedSprite](https://pixijs.download/v8.17.1/docs/scene.AnimatedSprite.html)。

检验：`node --test tests/engine.test.mjs tests/animation.test.mjs`。动画测试直接加载随游戏附带的 PixiJS 8.17.1，检查双腿交替与抬脚、技能逐帧推进、重复攻击重新起播、暂停、状态优先级、纹理过滤参数、出手时机和死亡取消。未执行浏览器或手机实机视觉测试。


第二版新增文件：`dist/assets/hero-slash-v2.png`、`dist/assets/hero-magic-v2.png`（内置 imagegen 生成）；`dist/walk-rig.js`（双腿骨骼和运行时分层裁切）、`dist/hero-animation.js`（动作控制）、`dist/hero-assets.js`（逐帧区域和基准点）。

生图概要：同一白发羊角花冠粉白裙装角色，透明 3×2 挥杖动作图集（准备、蓄力、挥出、命中、跟随、收招），透明 4×2 施法图集（上排收集、举杖、向前释放、后坐；下排蹲伏蓄力、起身、双手高举、收势）。行走图重绘仍有同侧腿重复，未纳入发布素材；采用可控骨骼步态并做离线渲染检查。
