#!/usr/bin/env python3
"""Replace this line with the tool's purpose.

Reads: Describe the inputs and read scope.
Writes: Describe output paths and overwrite behavior. This template writes nothing.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "common"))
from _common import emit_result, report_error


def build_parser() -> argparse.ArgumentParser:
    """集中定义工具需要的参数；类型、默认值、范围和路径含义写在这里。"""
    parser = argparse.ArgumentParser(description=__doc__)
    # 按实际需要添加参数；不要为凑模板加入无用参数。
    return parser


def run_task(args: argparse.Namespace) -> dict:
    """实现业务逻辑，返回可序列化的结果，不打印整份命令结果。

    Args:
        args: 已解析的命令行参数；写入前在此校验输入与目标路径。
    Returns:
        工具结果。检查未通过时使用 status="failed"；成功时可省略 status。
    Raises:
        ValueError: 参数组合或输入无效。
        OSError: 文件读写失败。
        RuntimeError: 依赖缺失或执行失败。
    """
    # 替换此函数主体；可选依赖在实际使用时导入，进度写入 sys.stderr。
    raise NotImplementedError(
        "Implement run_task() before registering or using this tool."
    )


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        result = run_task(args)
        emit_result(result)
        if result.get("status") == "error":
            return 2
        return 1 if result.get("status") == "failed" else 0
    except (OSError, ValueError, RuntimeError) as exc:
        return report_error(exc)


if __name__ == "__main__":
    raise SystemExit(main())
