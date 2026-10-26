import argparse
import signal
import threading
from .settings import Settings
from .storage import Store
from .application import create_application


def main():
    parser=argparse.ArgumentParser(description="Independent Shuku business backend")
    parser.add_argument("command",choices=["migrate","seed-demo","bootstrap-library","serve"])
    parser.add_argument("--manager",default="admin",help="Existing administrator username for official library courses")
    args=parser.parse_args()
    settings=Settings.from_env()
    if args.command=="migrate":
        Store(settings.database_url).migrate()
        print("Shuku schema ready")
        return
    if args.command=="seed-demo":
        Store(settings.database_url).seed_demo()
        print("Demo accounts initialized explicitly")
        return
    app=create_application(settings)
    try:
        if args.command=="bootstrap-library":
            print(app.workflow.library.bootstrap(args.manager))
            return
        server=app.server()
        def stop(*_):threading.Thread(target=server.shutdown,daemon=True).start()
        signal.signal(signal.SIGTERM,stop)
        signal.signal(signal.SIGINT,stop)
        try:
            app.worker.start()
            app.workflow.github.start()
            print("shuku_backend ready",flush=True)
            server.serve_forever(poll_interval=0.25)
        finally:
            server.server_close()
    finally:
        app.close()


if __name__=="__main__":main()
