# 更新技能

用户要求更新、检查更新或同步最新版时，先明确告知：

> 更新会永久删除除 `history/` 和 `runtime_logs/` 之外的所有本地修改。请先自行备份需要保留的代码。是否继续更新？

没有获得用户明确同意时不得执行更新。用户同意后，将当前 `SKILL.md` 所在目录记为 `skill_root`，只运行：

```bash
bash "$skill_root/scripts/update-skill.sh" --yes
```

脚本以 `https://gitee.com/ssocean/intuitive-deep-learning.git` 为唯一代码来源，强制本地代码与官方版本一致，只保留 `history/` 和 `runtime_logs/`。

命令失败时报告错误，不要声称更新完成，也不要自行改写或拆分脚本命令。成功时报告输出中的 `version` 和 `mode`，然后重新读取新版 `SKILL.md`、本文件和 `modules/index.json`。
