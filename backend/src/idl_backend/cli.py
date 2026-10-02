"""Manual Windows/POSIX service entrypoint, no container or cloud dependencies."""
import argparse
import os


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    serve = sub.add_parser("serve")
    serve.add_argument("--kind", choices=["vision", "assessment"], default="vision")
    serve.add_argument("--host", default="127.0.0.1")
    serve.add_argument("--port", type=int)
    serve.add_argument("--course", help="Registered moduleIdentity.id UUID")
    serve.add_argument("--workers", type=int, default=1)
    serve.add_argument("--device", choices=["auto", "cpu", "cuda", "mps"], default="auto")
    serve.add_argument("--dev", action="store_true", help="Explicit loopback-only development mode without an API token")
    sub.add_parser("courses")
    args = parser.parse_args()
    if args.command == "courses":
        from idl_backend.contracts.courses import load_courses
        for course in load_courses().values():
            print(course.uuid, course.slug)
        return 0
    if args.workers < 1 or args.workers > 16:
        parser.error("--workers must be between 1 and 16")
    os.environ["IDL_DEVICE"] = args.device
    from idl_backend.local.http import create_server
    server = create_server(args.host, args.port or (28431 if args.kind == "vision" else 28432), kind=args.kind, course_uuid=args.course, workers=args.workers, dev=args.dev)
    try:
        if args.kind == "vision":
            try:
                warmed = server.jobs.warmup_inference()
                print(f"Handwriting model ready on {warmed['device']}.", flush=True)
            except RuntimeError as exc:
                print(f"Handwriting model warm-up unavailable: {exc}", flush=True)
        print(f"{args.kind}-service listening on http://{args.host}:{server.server_port}", flush=True)
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        server.jobs.close()
    return 0
