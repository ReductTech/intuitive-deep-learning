(function () {
  "use strict";

  const IMAGE_SIZE = { width: 5460, height: 3073 };
  const STORAGE_KEY = "deep-learning-course-map-positions-v1";
  const DB_NAME = "deep-learning-course-map-editor";
  const HANDLE_STORE = "handles";
  const HANDLE_KEY = "course-map-directory";

  const chapters = [
    {
      id: "chapter-1",
      number: "第一章",
      title: "神经网络入门",
      lessonIds: ["Neuron-Guide", "Loss-Guide", "Gradient-Descent-Module"],
    },
    {
      id: "chapter-2",
      number: "第二章",
      title: "多层感知机与分类输出",
      lessonIds: ["Activation-Func-Module", "MLP_playground", "Loss-Guide-2"],
    },
    {
      id: "chapter-3",
      number: "第三章",
      title: "数字图像与人工特征",
      lessonIds: ["Digital-Image-Module", "Manual-Feature-Classification"],
    },
    {
      id: "chapter-4",
      number: "第四章",
      title: "卷积神经网络与人脸识别",
      lessonIds: ["Convolution-Kernel-Intro", "LeNet5-CNN-Lab", "Face-Recog-Lab"],
    },
  ];

  const lessons = [
  { id: "Neuron-Guide", title: "神经元到底是怎么工作的？" },
  { id: "Loss-Guide", title: "为什么神经网络需要损失函数？" },
  { id: "Gradient-Descent-Module", title: "梯度下降如何一步步降低误差？" },
  { id: "Activation-Func-Module", title: "为什么神经网络需要非线性？" },
  { id: "MLP_playground", title: "从手绘分类边界到多层神经网络" },
  { id: "Loss-Guide-2", title: "神经网络最后一层到底应该怎么输出？" },
  { id: "Digital-Image-Module", title: "图片在计算机眼里到底是什么？" },
  { id: "Manual-Feature-Classification", title: "用九宫格识别手写体数字" },
  { id: "Convolution-Kernel-Intro", title: "从五子棋到卷积核" },
  { id: "LeNet5-CNN-Lab", title: "卷积核怎样帮助机器认数字？" },
  { id: "Face-Recog-Lab", title: "亲手搭建卷积神经网络" },
  ];

  const elements = {
    canvas: document.getElementById("canvas"),
    image: document.getElementById("mapImage"),
    chapterLayer: document.getElementById("chapterLayer"),
    pointLayer: document.getElementById("pointLayer"),
    lessonList: document.getElementById("lessonList"),
    selectedIndex: document.getElementById("selectedIndex"),
    selectedTitle: document.getElementById("selectedTitle"),
    coordX: document.getElementById("coordX"),
    coordY: document.getElementById("coordY"),
    saveButton: document.getElementById("saveButton"),
    reloadButton: document.getElementById("reloadButton"),
    downloadButton: document.getElementById("downloadButton"),
    saveStatus: document.getElementById("saveStatus"),
  };

  let config = null;
  let originalConfig = null;
  let selectedId = lessons[0].id;
  let draggingId = null;
  let directoryHandle = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function roundCoordinate(value) {
    return Math.round(value * 1000) / 1000;
  }

  function getImageRect() {
    const canvasRect = elements.canvas.getBoundingClientRect();
    const scale = Math.min(canvasRect.width / IMAGE_SIZE.width, canvasRect.height / IMAGE_SIZE.height);
    const width = IMAGE_SIZE.width * scale;
    const height = IMAGE_SIZE.height * scale;
    return {
      canvasRect,
      left: (canvasRect.width - width) / 2,
      top: (canvasRect.height - height) / 2,
      width,
      height,
    };
  }

  function positionToScreen(position) {
    const imageRect = getImageRect();
    return {
      x: imageRect.left + (position.x / 100) * imageRect.width,
      y: imageRect.top + (position.y / 100) * imageRect.height,
    };
  }

  function eventToPosition(event) {
    const imageRect = getImageRect();
    const localX = event.clientX - imageRect.canvasRect.left - imageRect.left;
    const localY = event.clientY - imageRect.canvasRect.top - imageRect.top;
    return {
      x: roundCoordinate(clamp((localX / imageRect.width) * 100, 0, 100)),
      y: roundCoordinate(clamp((localY / imageRect.height) * 100, 0, 100)),
    };
  }

  function positionElements() {
    if (!config) return;
    document.querySelectorAll("[data-position-id]").forEach((element) => {
      const id = element.dataset.positionId;
      const position = element.dataset.positionType === "chapter" ? config.chapters[id] : config.lessons[id];
      if (!position) return;
      const screen = positionToScreen(position);
      element.style.left = `${screen.x}px`;
      element.style.top = `${screen.y}px`;
    });
  }

  function renderChapters() {
    elements.chapterLayer.innerHTML = chapters
      .map(
        (chapter) => `
          <div
            class="editor-chapter"
            data-position-id="${chapter.id}"
            data-position-type="chapter"
          >${chapter.number} · ${chapter.title}</div>
        `,
      )
      .join("");
  }

  function renderPoints() {
    elements.pointLayer.innerHTML = lessons
      .map(
        (lesson, index) => `
          <button
            class="edit-point${lesson.id === selectedId ? " is-selected" : ""}"
            type="button"
            data-position-id="${lesson.id}"
            data-position-type="lesson"
            aria-label="拖动第 ${index + 1} 课：${lesson.title}"
          >
            <span class="point-tooltip">${String(index + 1).padStart(2, "0")} · ${lesson.title}</span>
          </button>
        `,
      )
      .join("");

    elements.pointLayer.querySelectorAll(".edit-point").forEach((point) => {
      point.addEventListener("pointerdown", startDrag);
      point.addEventListener("click", () => selectLesson(point.dataset.positionId));
    });
  }

  function renderLessonList() {
    let number = 0;
    elements.lessonList.innerHTML = chapters
      .map((chapter) => {
        const rows = chapter.lessonIds
          .map((id) => {
            number += 1;
            const lesson = lessons.find((item) => item.id === id);
            const position = config.lessons[id];
            return `
              <button class="lesson-row${id === selectedId ? " is-selected" : ""}" type="button" data-list-id="${id}">
                <span class="lesson-row-index">${String(number).padStart(2, "0")}</span>
                <span class="lesson-row-title">${lesson.title}</span>
                <span class="lesson-row-coordinate">${position.x.toFixed(1)}, ${position.y.toFixed(1)}</span>
              </button>
            `;
          })
          .join("");

        return `<section class="list-chapter"><h2>${chapter.number} · ${chapter.title}</h2>${rows}</section>`;
      })
      .join("");

    elements.lessonList.querySelectorAll("[data-list-id]").forEach((row) => {
      row.addEventListener("click", () => selectLesson(row.dataset.listId));
    });
  }

  function renderSelection() {
    const index = lessons.findIndex((lesson) => lesson.id === selectedId);
    const lesson = lessons[index];
    const position = config.lessons[selectedId];
    elements.selectedIndex.textContent = String(index + 1).padStart(2, "0");
    elements.selectedTitle.textContent = lesson.title;
    elements.coordX.textContent = position.x.toFixed(3);
    elements.coordY.textContent = position.y.toFixed(3);

    document.querySelectorAll(".edit-point").forEach((point) => {
      point.classList.toggle("is-selected", point.dataset.positionId === selectedId);
    });
    document.querySelectorAll(".lesson-row").forEach((row) => {
      row.classList.toggle("is-selected", row.dataset.listId === selectedId);
    });
  }

  function renderAll() {
    renderChapters();
    renderPoints();
    renderLessonList();
    renderSelection();
    positionElements();
  }

  function selectLesson(id) {
    if (!config.lessons[id]) return;
    selectedId = id;
    renderSelection();
  }

  function updateSelectedPosition(position) {
    config.lessons[selectedId] = position;
    renderSelection();
    positionElements();
    const rowCoordinate = document.querySelector(`[data-list-id="${selectedId}"] .lesson-row-coordinate`);
    if (rowCoordinate) rowCoordinate.textContent = `${position.x.toFixed(1)}, ${position.y.toFixed(1)}`;
    setStatus("位置已修改，记得点击保存。", "");
  }

  function startDrag(event) {
    event.preventDefault();
    draggingId = event.currentTarget.dataset.positionId;
    selectedId = draggingId;
    event.currentTarget.classList.add("is-dragging");
    event.currentTarget.setPointerCapture(event.pointerId);
    renderSelection();
    updateSelectedPosition(eventToPosition(event));
  }

  function moveDrag(event) {
    if (!draggingId) return;
    updateSelectedPosition(eventToPosition(event));
  }

  function endDrag() {
    if (!draggingId) return;
    document.querySelector(`[data-position-id="${draggingId}"]`)?.classList.remove("is-dragging");
    draggingId = null;
  }

  function setStatus(message, type) {
    elements.saveStatus.textContent = message;
    elements.saveStatus.className = type ? `is-${type}` : "";
  }

  function prepareConfigForSave() {
    config.version = 1;
    config.updatedAt = new Date().toISOString();
    config.image = { ...IMAGE_SIZE };
    return JSON.stringify(config, null, 2) + "\n";
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(HANDLE_STORE)) {
          request.result.createObjectStore(HANDLE_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function readStoredDirectoryHandle() {
    try {
      const database = await openDatabase();
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(HANDLE_STORE, "readonly");
        const request = transaction.objectStore(HANDLE_STORE).get(HANDLE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (_error) {
      return null;
    }
  }

  async function storeDirectoryHandle(handle) {
    const database = await openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(HANDLE_STORE, "readwrite");
      transaction.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function clearStoredDirectoryHandle() {
    try {
      const database = await openDatabase();
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(HANDLE_STORE, "readwrite");
        transaction.objectStore(HANDLE_STORE).delete(HANDLE_KEY);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (_error) {
      // 即使浏览器无法清理旧句柄，也不影响重新选择文件夹。
    }
  }

  function updateSaveButton() {
    elements.saveButton.textContent = directoryHandle ? "保存到项目" : "选择文件夹并保存";
  }

  async function validateCourseMapDirectory(handle) {
    try {
      await handle.getFileHandle("editor.html");
      await handle.getFileHandle("index.html");
    } catch (_error) {
      throw new Error("请选择包含 editor.html 和 index.html 的 CourseMap 文件夹。");
    }
  }

  async function writeProjectFile() {
    const text = prepareConfigForSave();

    if (!("showDirectoryPicker" in window)) {
      localStorage.setItem(STORAGE_KEY, text);
      downloadConfig(text);
      setStatus("当前浏览器不支持直接写入项目，已下载坐标文件。请替换 CourseMap/course-positions.json。", "error");
      return;
    }

    try {
      if (!directoryHandle) {
        // 必须把目录选择器作为点击后的第一个异步权限操作，否则浏览器会判定为缺少用户手势。
        const selectedHandle = await window.showDirectoryPicker({ mode: "readwrite" });
        await validateCourseMapDirectory(selectedHandle);
        directoryHandle = selectedHandle;
        await storeDirectoryHandle(selectedHandle);
        updateSaveButton();
      } else {
        const permission = await directoryHandle.queryPermission({ mode: "readwrite" });
        if (permission !== "granted") {
          directoryHandle = null;
          await clearStoredDirectoryHandle();
          updateSaveButton();
          setStatus("文件夹授权已失效。请再次点击“选择文件夹并保存”。", "error");
          return;
        }
      }

      const fileHandle = await directoryHandle.getFileHandle("course-positions.json", { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
      localStorage.setItem(STORAGE_KEY, text);
      originalConfig = clone(config);
      setStatus("保存成功。导航页刷新后会使用最新点位。", "success");
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus("已取消保存，没有修改项目文件。", "");
      } else {
        if (error?.name === "SecurityError") {
          directoryHandle = null;
          await clearStoredDirectoryHandle();
          updateSaveButton();
        }
        setStatus(`保存失败：${error?.message || error}`, "error");
      }
    }
  }

  function downloadConfig(text = prepareConfigForSave()) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "course-positions.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function loadConfig() {
    const response = await fetch(`./course-positions.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`无法读取坐标文件：HTTP ${response.status}`);
    const fileConfig = await response.json();
    let localConfig = null;
    try {
      localConfig = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (_error) {
      localConfig = null;
    }
    config =
      localConfig && (!fileConfig.updatedAt || localConfig.updatedAt >= fileConfig.updatedAt)
        ? localConfig
        : fileConfig;
    originalConfig = clone(config);
  }

  elements.pointLayer.addEventListener("pointermove", moveDrag);
  elements.pointLayer.addEventListener("pointerup", endDrag);
  elements.pointLayer.addEventListener("pointercancel", endDrag);
  elements.saveButton.addEventListener("click", writeProjectFile);
  elements.downloadButton.addEventListener("click", () => downloadConfig());
  elements.reloadButton.addEventListener("click", () => {
    config = clone(originalConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    renderAll();
    setStatus("已恢复到上次载入或保存的点位。", "");
  });
  window.addEventListener("resize", positionElements);
  elements.image.addEventListener("load", positionElements);
  document.addEventListener("keydown", (event) => {
    if (!selectedId || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 0.2 : 0.04;
    const position = { ...config.lessons[selectedId] };
    if (event.key === "ArrowLeft") position.x -= step;
    if (event.key === "ArrowRight") position.x += step;
    if (event.key === "ArrowUp") position.y -= step;
    if (event.key === "ArrowDown") position.y += step;
    position.x = roundCoordinate(clamp(position.x, 0, 100));
    position.y = roundCoordinate(clamp(position.y, 0, 100));
    updateSelectedPosition(position);
  });
  window.addEventListener("beforeunload", (event) => {
    if (!config || JSON.stringify(config) === JSON.stringify(originalConfig)) return;
    event.preventDefault();
    event.returnValue = "";
  });

  async function initialize() {
    try {
      await loadConfig();
      const storedHandle = await readStoredDirectoryHandle();
      if (storedHandle) {
        const permission = await storedHandle.queryPermission({ mode: "readwrite" });
        if (permission === "granted") {
          directoryHandle = storedHandle;
          setStatus("已绑定 CourseMap 文件夹，调整后可直接保存。", "success");
        } else {
          directoryHandle = null;
          await clearStoredDirectoryHandle();
          setStatus("需要重新选择一次 CourseMap 文件夹。", "");
        }
      }
      updateSaveButton();
      renderAll();
    } catch (error) {
      setStatus(error?.message || String(error), "error");
    }
  }

  initialize();
})();
