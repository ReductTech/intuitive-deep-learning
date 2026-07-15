# 深度学习互动模块目录

这个目录存放 `intuitive-deep-learning` 技能可以插入到课程页里的 HTML 互动模块。

## 目录约定

每个正式模块一个独立目录，目录名就是模块 id：

```text
modules/
  MLP_playground/
    info.json
    index.html
    style.css
    script.js
```

`shared/` 放公共静态资源，不算正式模块。

## 必需文件

每个模块至少需要：

```text
info.json
index.html
```

`index.html` 是实际展示入口。其它 CSS、JS、图片等资源按模块需要放在同一目录内。

## info.json

`info.json` 是唯一需要手工维护的模块元数据。它只面向智能体检索，不放运行时配置。

最小格式：

```json
{
  "id": "MODULE_DIRECTORY_NAME",
  "title": "模块标题",
  "use_when": "什么时候应该选择这个模块，写给智能体看。",
  "summary": "这个模块会帮助用户理解什么。",
  "prerequisites": ["前置知识 1", "前置知识 2"]
}
```

要求：

- `id` 必须等于模块目录名。
- `use_when` 写选择条件，帮助智能体判断何时使用。
- `summary` 写模块内容和学习收益。
- `prerequisites` 写用户最好先懂的知识点。

可以从 `info.template.json` 复制模板。

## index.json

`index.json` 是生成文件，不要手工编辑。

生成命令：

```bash
python3 build_module_index.py
```

校验但不写入：

```bash
python3 build_module_index.py --check
```

为缺少 `info.json` 的旧模块生成初始文件：

```bash
python3 build_module_index.py --init-missing
```

生成后的 `index.json` 只保留检索所需字段：

```json
{
  "modules": [
    {
      "id": "MLP_playground",
      "title": "从手绘分类边界到 MLP",
      "use_when": "...",
      "summary": "...",
      "prerequisites": ["..."]
    }
  ]
}
```

如果模块目录没有 `info.json`，它不会进入 `index.json`。

## 新增模块流程

1. 在 `modules/` 下创建新目录，目录名使用稳定英文 id。
2. 放入 `index.html` 和模块资源。
3. 复制 `info.template.json` 为新目录里的 `info.json`。
4. 填好 `id`、`title`、`use_when`、`summary`、`prerequisites`。
5. 在 `modules/` 目录运行：

```bash
python3 build_module_index.py
```

6. 通过唯一入口打开该模块，确认相对资源和交互均可直接加载：

```bash
bash ../scripts/run-lesson-page.sh --open-module --module-id <模块目录名>
```
