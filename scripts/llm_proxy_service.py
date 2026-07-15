"""Compatibility entry point for the local LLM proxy service."""

from langchain_app.proxy.cli import main


if __name__ == "__main__":
    raise SystemExit(main())
