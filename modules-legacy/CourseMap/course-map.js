(function () {
  "use strict";

  const POSITIONS_STORAGE_KEY = "deep-learning-course-map-positions-v1";
  const IMAGE_SIZE = { width: 5460, height: 3073 };

  const chapters = [
    {
      id: "chapter-1",
      number: "第一章",
      title: "神经网络入门",
      subtitle: "从一次判断到模型学习",
      color: "#75b86a",
      position: { x: 17.5, y: 69.5 },
      lessons: [
        {
          id: "Neuron-Guide",
          title: "为什么需要神经元",
          summary: "从日常多因素判断出发，建立输入信号、权重与神经元输出的直觉。",
          position: { x: 8.6, y: 82.8 },
        },
        {
          id: "Loss-Guide",
          title: "为什么需要损失函数",
          summary: "从预测误差出发，理解回归损失、分类概率与交叉熵。",
          position: { x: 15.6, y: 89.2 },
        },
        {
          id: "Gradient-Descent-Module",
          title: "梯度下降如何让模型变好",
          summary: "观察参数、预测值和 Loss 的关系，理解梯度下降如何更新模型。",
          position: { x: 28.7, y: 76.7 },
        },
      ],
    },
    {
      id: "chapter-2",
      number: "第二章",
      title: "多层感知机与分类输出",
      subtitle: "让神经网络表达复杂边界",
      color: "#dfad55",
      position: { x: 38.5, y: 56.5 },
      lessons: [
        {
          id: "Activation-Func-Module",
          title: "激活函数如何带来非线性",
          summary: "用曲线折点理解 ReLU、Sigmoid 与 SiLU 如何带来非线性表达能力。",
          position: { x: 35.6, y: 69.9 },
        },
        {
          id: "MLP_playground",
          title: "从手绘分类边界到 MLP",
          summary: "通过手绘边界与自动训练，观察隐藏层如何形成复杂决策边界。",
          position: { x: 45.1, y: 66.4 },
        },
        {
          id: "Loss-Guide-2",
          title: "天气预测的两种输出：Sigmoid + BCE 与 Softmax + CE",
          summary: "在天气预测场景中区分独立二分类与互斥多分类的输出层设计。",
          position: { x: 51.6, y: 78.3 },
        },
      ],
    },
    {
      id: "chapter-3",
      number: "第三章",
      title: "数字图像与人工特征",
      subtitle: "把图像变成模型能理解的数字",
      color: "#50aa86",
      position: { x: 57.2, y: 34.8 },
      lessons: [
        {
          id: "Digital-Image-Module",
          title: "数字图像如何变成 RGB 矩阵",
          summary: "拆解像素、RGB 通道和数值矩阵，理解计算机如何表示一张图片。",
          position: { x: 56.1, y: 48.9 },
        },
        {
          id: "Manual-Feature-Classification",
          title: "人工特征的分类",
          summary: "把手写数字变成九宫格统计特征，再交给双层 MLP 完成分类。",
          position: { x: 65.9, y: 43.2 },
        },
      ],
    },
    {
      id: "chapter-4",
      number: "第四章",
      title: "卷积神经网络与人脸识别",
      subtitle: "从局部扫描到端到端训练",
      color: "#4a91d7",
      position: { x: 78.1, y: 12.5 },
      lessons: [
        {
          id: "Convolution-Kernel-Intro",
          title: "卷积核入门：从五子棋棋形开始",
          summary: "从棋盘局部模式出发，理解卷积核如何反复扫描并生成特征图。",
          position: { x: 70.1, y: 24.3 },
        },
        {
          id: "LeNet5-CNN-Lab",
          title: "从人工卷积核到 LeNet-5",
          summary: "比较固定卷积核与可学习卷积核，进入经典 CNN 的训练过程。",
          position: { x: 80.5, y: 34.4 },
        },
        {
          id: "Face-Recog-Lab",
          title: "人脸识别：固定卷积核到参数全训",
          summary: "在人脸数据上比较固定特征提取与端到端 CNN 参数训练。",
          position: { x: 91.4, y: 44.8 },
        },
      ],
    },
  ];

  const lessons = chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson, chapterIndex) => ({
      ...lesson,
      chapter: chapter.number,
      chapterTitle: chapter.title,
      chapterColor: chapter.color,
      chapterIndex,
      href: `../${lesson.id}/index.html`,
    })),
  );

  const elements = {
    stage: document.getElementById("courseMap"),
    image: document.getElementById("mapImage"),
    chapterLayer: document.getElementById("chapterLayer"),
    lessonLayer: document.getElementById("lessonLayer"),
    preview: document.getElementById("lessonPreview"),
    previewChapter: document.getElementById("previewChapter"),
    previewIndex: document.getElementById("previewIndex"),
    previewTitle: document.getElementById("previewTitle"),
    previewSummary: document.getElementById("previewSummary"),
    previewStudyCount: document.getElementById("previewStudyCount"),
    previewTotalTime: document.getElementById("previewTotalTime"),
    previewLastOpened: document.getElementById("previewLastOpened"),
    previewStart: document.getElementById("previewStart"),
    continueButton: document.getElementById("continueButton"),
    catalogButton: document.getElementById("catalogButton"),
    mobileCatalogButton: document.getElementById("mobileCatalogButton"),
    catalogPanel: document.getElementById("catalogPanel"),
    catalogBackdrop: document.getElementById("catalogBackdrop"),
    catalogClose: document.getElementById("catalogClose"),
    catalogList: document.getElementById("catalogList"),
    progressText: document.getElementById("progressText"),
    progressBar: document.getElementById("progressBar"),
  };

  let activeLesson = lessons[0];
  let learningRecords = {};
  let visited = new Set();

  // pageshow also runs when CourseMap is restored from the browser back-forward cache.
  window.addEventListener("pageshow", () => {
    const telemetry = window.__DL_TELEMETRY__;
    if (telemetry && typeof telemetry.reportSkillMemory === "function") {
      void telemetry.reportSkillMemory();
    }
  });

  async function loadLearningRecords() {
    try {
      const response = await fetch("/__telemetry/records", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      learningRecords = data && data.modules && typeof data.modules === "object" ? data.modules : {};
    } catch (_error) {
      learningRecords = {};
    }
    visited = new Set(
      Object.entries(learningRecords)
        .filter(([, record]) => Number(record?.study_count || 0) > 0)
        .map(([moduleId]) => moduleId),
    );
  }

  function getLearningRecord(moduleId) {
    return learningRecords[moduleId] || { study_count: 0, last_opened_at: null, total_view_ms: 0 };
  }

  function formatDuration(durationMs) {
    const totalSeconds = Math.max(0, Math.round(Number(durationMs || 0) / 1000));
    if (totalSeconds < 60) return `${totalSeconds} 秒`;
    const totalMinutes = Math.round(totalSeconds / 60);
    if (totalMinutes < 60) return `${totalMinutes} 分钟`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`;
  }

  function formatOpenedAt(value, compact = false) {
    if (!value) return "暂无";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "暂无";
    const now = new Date();
    const sameDay = date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();
    const time = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
    if (sameDay) return `今天 ${time}`;
    const day = date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
    return compact ? day : `${day} ${time}`;
  }

  function applyPositionConfig(config) {
    if (!config || typeof config !== "object") return;

    chapters.forEach((chapter) => {
      const chapterPosition = config.chapters?.[chapter.id];
      if (Number.isFinite(chapterPosition?.x) && Number.isFinite(chapterPosition?.y)) {
        chapter.position.x = chapterPosition.x;
        chapter.position.y = chapterPosition.y;
      }

      chapter.lessons.forEach((lesson) => {
        const lessonPosition = config.lessons?.[lesson.id];
        if (Number.isFinite(lessonPosition?.x) && Number.isFinite(lessonPosition?.y)) {
          lesson.position.x = lessonPosition.x;
          lesson.position.y = lessonPosition.y;
        }
      });
    });
  }

  async function loadPositionConfig() {
    let fileConfig = null;
    let localConfig = null;

    try {
      const response = await fetch(`./course-positions.json?v=${Date.now()}`, { cache: "no-store" });
      if (response.ok) fileConfig = await response.json();
    } catch (_error) {
      fileConfig = null;
    }

    try {
      localConfig = JSON.parse(localStorage.getItem(POSITIONS_STORAGE_KEY) || "null");
    } catch (_error) {
      localConfig = null;
    }

    applyPositionConfig(fileConfig);
    if (
      localConfig &&
      (!fileConfig?.updatedAt || !localConfig.updatedAt || localConfig.updatedAt >= fileConfig.updatedAt)
    ) {
      applyPositionConfig(localConfig);
    }
  }

  function imagePointToScreen(position) {
    const rect = elements.stage.getBoundingClientRect();
    const scale = Math.max(rect.width / IMAGE_SIZE.width, rect.height / IMAGE_SIZE.height);
    const renderedWidth = IMAGE_SIZE.width * scale;
    const renderedHeight = IMAGE_SIZE.height * scale;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;

    return {
      x: offsetX + (position.x / 100) * renderedWidth,
      y: offsetY + (position.y / 100) * renderedHeight,
    };
  }

  function positionOverlays() {
    document.querySelectorAll("[data-map-x]").forEach((element) => {
      const point = imagePointToScreen({
        x: Number(element.dataset.mapX),
        y: Number(element.dataset.mapY),
      });
      element.style.left = `${point.x}px`;
      element.style.top = `${point.y}px`;
    });
  }

  function renderChapters() {
    elements.chapterLayer.innerHTML = chapters
      .map(
        (chapter) => `
          <div
            class="chapter-marker"
            data-map-x="${chapter.position.x}"
            data-map-y="${chapter.position.y}"
            style="--chapter-color: ${chapter.color}"
          >
            <span class="chapter-number">${chapter.number.replace("第", "").replace("章", "")}</span>
            <span class="chapter-copy">
              <strong>${chapter.title}</strong>
              <small>${chapter.number} · ${chapter.lessons.length} 节课</small>
            </span>
          </div>
        `,
      )
      .join("");
  }

  function renderLessons() {
    elements.lessonLayer.innerHTML = lessons
      .map(
        (lesson, index) => `
          <button
            class="lesson-node${visited.has(lesson.id) ? " is-visited" : ""}"
            type="button"
            data-lesson-id="${lesson.id}"
            data-map-x="${lesson.position.x}"
            data-map-y="${lesson.position.y}"
            aria-label="第 ${index + 1} 课：${lesson.title}"
          >
            <span>${String(index + 1).padStart(2, "0")}</span>
          </button>
        `,
      )
      .join("");

    elements.lessonLayer.querySelectorAll(".lesson-node").forEach((node) => {
      const lesson = lessons.find((item) => item.id === node.dataset.lessonId);
      node.addEventListener("mouseenter", () => selectLesson(lesson));
      node.addEventListener("focus", () => selectLesson(lesson));
      node.addEventListener("click", () => openLesson(lesson));
    });
  }

  function renderCatalog() {
    let lessonNumber = 0;
    elements.catalogList.innerHTML = chapters
      .map((chapter) => {
        const rows = chapter.lessons
          .map((chapterLesson) => {
            lessonNumber += 1;
            const done = visited.has(chapterLesson.id);
            const record = getLearningRecord(chapterLesson.id);
            return `
              <button
                class="catalog-lesson${done ? " is-visited" : ""}"
                type="button"
                data-catalog-lesson="${chapterLesson.id}"
              >
                <span class="catalog-lesson-index">${String(lessonNumber).padStart(2, "0")}</span>
                <span class="catalog-lesson-copy">
                  <span class="catalog-lesson-name">${chapterLesson.title}</span>
                  <span class="catalog-lesson-record">${done ? `${formatOpenedAt(record.last_opened_at, true)} · ${formatDuration(record.total_view_ms)}` : "尚未学习"}</span>
                </span>
                <span class="catalog-lesson-status">${done ? `学习 ${record.study_count} 次` : "进入"}</span>
              </button>
            `;
          })
          .join("");

        return `
          <section class="catalog-chapter" style="--chapter-color: ${chapter.color}">
            <h3 class="catalog-chapter-title"><i></i>${chapter.number} · ${chapter.title}</h3>
            ${rows}
          </section>
        `;
      })
      .join("");

    elements.catalogList.querySelectorAll("[data-catalog-lesson]").forEach((button) => {
      const lesson = lessons.find((item) => item.id === button.dataset.catalogLesson);
      button.addEventListener("click", () => openLesson(lesson));
    });
  }

  function selectLesson(lesson) {
    if (!lesson) return;
    activeLesson = lesson;
    const index = lessons.findIndex((item) => item.id === lesson.id);
    const record = getLearningRecord(lesson.id);

    elements.previewChapter.textContent = `${lesson.chapter} · ${lesson.chapterTitle}`;
    elements.previewIndex.textContent = String(index + 1).padStart(2, "0");
    elements.previewTitle.textContent = lesson.title;
    elements.previewSummary.textContent = lesson.summary;
    elements.previewStudyCount.textContent = `${Number(record.study_count || 0)} 次`;
    elements.previewTotalTime.textContent = formatDuration(record.total_view_ms);
    elements.previewLastOpened.textContent = formatOpenedAt(record.last_opened_at);

    document.querySelectorAll(".lesson-node").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.lessonId === lesson.id);
    });
  }

  function openLesson(lesson) {
    if (!lesson) return;
    window.location.href = lesson.href;
  }

  function updateProgress() {
    const completed = lessons.filter((lesson) => visited.has(lesson.id)).length;
    const nextLesson = lessons.find((lesson) => !visited.has(lesson.id)) || lessons[0];
    elements.progressText.textContent = `${completed} / ${lessons.length}`;
    elements.progressBar.style.width = `${(completed / lessons.length) * 100}%`;
    elements.continueButton.textContent = completed === 0 ? "从第一课开始" : completed === lessons.length ? "重新浏览课程" : "继续学习";
    elements.continueButton.dataset.lessonId = nextLesson.id;
  }

  function openCatalog() {
    renderCatalog();
    elements.catalogBackdrop.hidden = false;
    elements.catalogPanel.classList.add("is-open");
    elements.catalogPanel.setAttribute("aria-hidden", "false");
    elements.catalogClose.focus();
  }

  function closeCatalog() {
    elements.catalogPanel.classList.remove("is-open");
    elements.catalogPanel.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      elements.catalogBackdrop.hidden = true;
    }, 260);
  }

  elements.previewStart.addEventListener("click", () => openLesson(activeLesson));
  elements.continueButton.addEventListener("click", () => {
    const lesson = lessons.find((item) => item.id === elements.continueButton.dataset.lessonId);
    openLesson(lesson);
  });
  elements.catalogButton.addEventListener("click", openCatalog);
  elements.mobileCatalogButton.addEventListener("click", openCatalog);
  elements.catalogClose.addEventListener("click", closeCatalog);
  elements.catalogBackdrop.addEventListener("click", closeCatalog);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.catalogPanel.classList.contains("is-open")) {
      closeCatalog();
    }
  });
  window.addEventListener("resize", positionOverlays);
  elements.image.addEventListener("load", positionOverlays);

  async function initialize() {
    await Promise.all([loadPositionConfig(), loadLearningRecords()]);
    renderChapters();
    renderLessons();
    renderCatalog();
    updateProgress();
    selectLesson(lessons[0]);
    positionOverlays();
  }

  initialize();
})();
