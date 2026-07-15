(function () {
  const FALLBACK_MODULE_INDEX = {
    modules: [
      {
        id: "Activation-Func-Module",
        title: "激活函数如何带来非线性",
        use_when:
          "用户想理解激活函数、ReLU、Sigmoid、SiLU、非线性表达能力，或需要先分清线性网络与非线性网络时使用。",
        summary:
          "先通过二维/三维判断任务确认线性形状，再用无激活网络展示线性叠加仍是线性；随后给神经元加入 ReLU，观察折点如何让曲线弯折，并用更多折点逼近目标函数，最后认识 ReLU、Sigmoid 与 SiLU。",
        prerequisites: ["线性函数", "线性层", "坐标系", "函数图像的基本概念"],
      },
      {
        id: "Gradient-Descent-Module",
        title: "Loss 如何让模型变好",
        use_when:
          "用户想理解 loss、参数更新、梯度回传、训练闭环，或想从直观反馈调节过渡到神经网络训练过程时使用。",
        summary:
          "用定速巡航类比反馈调节，再拆解一次最小神经网络训练过程，让用户理解 loss 如何产生调节方向，并通过梯度影响参数更新。",
        prerequisites: ["预测值和目标值", "损失函数", "参数", "前向传播"],
      },
      {
        id: "Gradient-Explode-Module",
        title: "RNN 梯度爆炸与梯度裁剪",
        use_when:
          "用户想学习 RNN 训练不稳定、梯度爆炸、长时间步反向传播，或想理解 gradient clipping 为什么能稳定训练时使用。",
        summary:
          "通过改变时间步长度观察 RNN 反向传播链变长后梯度被放大、loss 失控甚至 NaN 的过程，再演示梯度裁剪如何限制过大梯度。",
        prerequisites: ["梯度", "反向传播", "循环神经网络 RNN", "损失函数"],
      },
      {
        id: "Sigmoid-Softmax-Module",
        title: "挂科风险与等级预测：Sigmoid 和 Softmax",
        use_when:
          "用户想理解输出层神经元数量、二分类与多分类区别、Sigmoid 和 Softmax 的选择，或不知道该搭配 BCEWithLogitsLoss 还是 CrossEntropyLoss 时使用。",
        summary:
          "用学业预警场景建立输出层直觉：是否有挂科风险用 Sigmoid 输出一个独立概率，ABCD 等级用 Softmax 输出互斥概率分布，并说明常见输出层和损失函数的正确搭配。",
        prerequisites: ["MLP 基本结构", "二分类和多分类", "logits", "概率", "损失函数"],
      },
      {
        id: "Loss-Guide",
        title: "为什么需要损失函数",
        use_when:
          "用户刚开始学习训练过程、不了解 loss 的意义，或想理解回归损失、分类标签距离、交叉熵之间的关系时使用。",
        summary:
          "从数轴距离引入误差度量，再说明分类标签没有天然距离，最后用概率直觉推导为什么分类任务常用交叉熵损失。",
        prerequisites: ["预测值", "真实标签", "回归任务", "分类任务", "概率的基本概念"],
      },
      {
        id: "MLP_playground",
        title: "从手绘分类边界到 MLP",
        use_when:
          "用户想学习 MLP、多层感知机、隐藏层、非线性分类边界、决策面，或想通过可视化实验理解神经网络为什么能拟合复杂边界时使用。",
        summary:
          "通过手绘散点分类边界挑战建立分类直觉，再进入 MLP 自动训练实验，观察隐藏层和非线性激活如何把简单线性组合扩展成复杂决策边界。",
        prerequisites: ["线性模型", "分类任务", "损失函数", "梯度下降", "激活函数的基本概念"],
      },
      {
        id: "Neuron-Guide",
        title: "为什么需要神经元",
        use_when:
          "用户想从日常判断出发，理解一个决定背后往往包含多个信号，为后续认识神经元、输入特征和加权判断做准备时使用。",
        summary:
          "用快速闪过的日常决策卡片开场，让用户输入自己最近纠结的决定，再展开兴趣、压力、成本、期待、发展和成绩等因素，建立“一个决定背后有很多信号”的直觉。",
        prerequisites: ["日常决策", "多因素判断", "输入信号的直观概念"],
      },
    ],
  };

  const COURSE_CHAPTERS = [
    {
      id: "foundation",
      title: "机器学习基础",
      subtitle: "新手草原",
      theme: "starter-plain",
      modules: ["Neuron-Guide", "Loss-Guide", "Gradient-Descent-Module"],
    },
    {
      id: "mlp",
      title: "多层神经网络",
      subtitle: "层叠丘陵",
      theme: "mlp-hills",
      modules: ["Activation-Func-Module", "MLP_playground", "Sigmoid-Softmax-Module"],
    },
    {
      id: "training",
      title: "神经网络训练",
      subtitle: "参数工坊",
      theme: "training-lab",
      modules: [],
    },
    {
      id: "cnn",
      title: "CNN",
      subtitle: "图像海岸",
      theme: "vision-coast",
      modules: [],
    },
    {
      id: "sequence",
      title: "RNN",
      subtitle: "序列森林",
      theme: "sequence-forest",
      modules: ["Gradient-Explode-Module"],
    },
  ];

  const KNOWN_POSITIONS = {
    "Neuron-Guide": { x: 330, y: 660 },
    "Loss-Guide": { x: 670, y: 555 },
    "Gradient-Descent-Module": { x: 1010, y: 660 },
    "Activation-Func-Module": { x: 1430, y: 450 },
    MLP_playground: { x: 1760, y: 360 },
    "Sigmoid-Softmax-Module": { x: 2100, y: 510 },
    "Gradient-Explode-Module": { x: 3720, y: 600 },
  };

  const EXTRA_CHAPTER = {
    id: "extra",
    title: "补充模块",
    subtitle: "来自 modules/index.json 的新增内容",
    theme: "training-lab",
    modules: [],
  };

  function getKnownOrder() {
    return COURSE_CHAPTERS.flatMap((chapter) => chapter.modules);
  }

  function sortModules(modules) {
    const knownOrder = getKnownOrder();
    const orderMap = new Map(knownOrder.map((id, index) => [id, index]));
    return modules.slice().sort((a, b) => {
      const aOrder = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER;
      const bOrder = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.id.localeCompare(b.id);
    });
  }

  function getChapterForModule(id) {
    return COURSE_CHAPTERS.find((chapter) => chapter.modules.includes(id)) || EXTRA_CHAPTER;
  }

  function getPositionForModule(id, index) {
    if (KNOWN_POSITIONS[id]) return KNOWN_POSITIONS[id];
    const extraIndex = Math.max(0, index - getKnownOrder().length);
    return {
      x: 3060 + extraIndex * 290,
      y: extraIndex % 2 === 0 ? 470 : 650,
    };
  }

  function normalizeModules(rawModules) {
    const modules = Array.isArray(rawModules) ? rawModules.filter((item) => item && item.id) : [];
    const sorted = sortModules(modules);
    const chapters = COURSE_CHAPTERS.map((chapter) => ({ ...chapter, modules: [] }));
    const extra = { ...EXTRA_CHAPTER, modules: [] };

    const nodes = sorted.map((module, index) => {
      const chapter = getChapterForModule(module.id);
      const chapterTarget = chapters.find((item) => item.id === chapter.id) || extra;
      chapterTarget.modules.push(module.id);

      const position = getPositionForModule(module.id, index);
      const previous = sorted[index - 1];
      return {
        id: module.id,
        code: `T${index + 1}`,
        title: module.title || module.id,
        chapterId: chapter.id,
        chapter: chapter.title,
        chapterSubtitle: chapter.subtitle,
        theme: chapter.theme,
        x: position.x,
        y: position.y,
        prereq: previous ? [previous.id] : [],
        entry: `../${module.id}/index.html`,
        description: module.summary || module.use_when || "这个模块还没有填写简介。",
        useWhen: module.use_when || "",
        knowledgePrerequisites: Array.isArray(module.prerequisites) ? module.prerequisites : [],
      };
    });

    if (extra.modules.length) chapters.push(extra);

    return {
      chapters: chapters.filter((chapter) => chapter.modules.length > 0),
      nodes,
      source: "modules/index.json",
      world: {
        width: Math.max(4400, Math.max(...nodes.map((node) => node.x), 0) + 620),
        height: 1200,
      },
    };
  }

  async function loadCourseMapData() {
    try {
      const response = await fetch("../index.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return normalizeModules(data.modules);
    } catch (error) {
      const data = normalizeModules(FALLBACK_MODULE_INDEX.modules);
      data.source = "内置备用数据";
      data.loadError = error instanceof Error ? error.message : String(error);
      return data;
    }
  }

  window.CourseMapData = {
    loadCourseMapData,
    normalizeModules,
  };
})();
