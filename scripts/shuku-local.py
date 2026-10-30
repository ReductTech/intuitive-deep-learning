"""Manage an isolated local MySQL and Shuku backend; never touch the cloud database."""
import argparse
import getpass
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
import time

import mysql.connector
from sqlalchemy.engine import URL

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / '.private' / 'shuku-local'
CONFIG = PRIVATE / 'config.json'


def launch(arguments, log, env=None):
    with log.open('ab') as output:
        return subprocess.Popen(arguments, cwd=ROOT, env=env, stdin=subprocess.DEVNULL,
                                stdout=output, stderr=subprocess.STDOUT,
                                creationflags=subprocess.CREATE_NO_WINDOW | subprocess.CREATE_NEW_PROCESS_GROUP)


def mysql_connect(config, *, bootstrap=False):
    return mysql.connector.connect(host='127.0.0.1', port=config['port'], user='root' if bootstrap else 'shuku_local',
                                   password='' if bootstrap else config['database_password'], connection_timeout=3)


def mysql_ready(config):
    try:
        connection = mysql_connect(config)
        connection.close()
        return True
    except mysql.connector.Error:
        return False


def start_mysql(config):
    if mysql_ready(config):
        return
    if not config.get('managed',True):
        raise RuntimeError('Start the configured local MySQL service first')
    import socket
    with socket.socket() as probe:
        if probe.connect_ex(('127.0.0.1',config['port']))==0:
            raise RuntimeError('The local MySQL port is occupied by a different service')
    data = PRIVATE / 'mysql-data'
    binary = Path(config['mysqld'])
    if not binary.is_file():
        raise RuntimeError('MySQL 8.0.16+ is required; set SHUKU_MYSQLD to mysqld.exe')
    if not (data/'mysql').exists():
        subprocess.run([str(binary),'--no-defaults','--initialize-insecure',f'--datadir={data}',
                        f'--log-error={PRIVATE / "mysql-init.log"}'], check=True,
                       creationflags=subprocess.CREATE_NO_WINDOW)
    process = launch([str(binary),'--no-defaults',f'--datadir={data}',f'--port={config["port"]}',
                      '--bind-address=127.0.0.1','--mysqlx=OFF','--skip-log-bin',
                      '--innodb-buffer-pool-size=128M',f'--log-error={PRIVATE / "mysql.log"}'],PRIVATE/'mysql-process.log')
    (PRIVATE/'mysql-process.json').write_text(json.dumps({'pid':process.pid}), encoding='utf-8')
    for _ in range(150):
        if process.poll() is not None:
            raise RuntimeError('Local MySQL failed to start; see .private/shuku-local/mysql.log')
        if mysql_ready(config):return
        try:
            connection=mysql_connect(config,bootstrap=True)
            cursor=connection.cursor()
            # The bootstrap account is passwordless only during this first initialization.
            cursor.execute("ALTER USER 'root'@'localhost' IDENTIFIED BY %s",(config['root_password'],))
            cursor.execute("CREATE USER 'shuku_local'@'localhost' IDENTIFIED BY %s",(config['database_password'],))
            cursor.execute('CREATE DATABASE IF NOT EXISTS shuku_local CHARACTER SET utf8mb4 COLLATE utf8mb4_bin')
            cursor.execute('CREATE DATABASE IF NOT EXISTS idl_shuku_test_local CHARACTER SET utf8mb4 COLLATE utf8mb4_bin')
            cursor.execute("GRANT ALL PRIVILEGES ON shuku_local.* TO 'shuku_local'@'localhost'")
            cursor.execute("GRANT ALL PRIVILEGES ON idl_shuku_test_local.* TO 'shuku_local'@'localhost'")
            connection.close()
            return
        except mysql.connector.Error:
            time.sleep(.2)
    raise RuntimeError('Local MySQL did not become ready')


def config_for_init():
    if CONFIG.exists():return json.loads(CONFIG.read_text(encoding='utf-8'))
    PRIVATE.mkdir(parents=True,exist_ok=True)
    binary=os.environ.get('SHUKU_MYSQLD') or shutil.which('mysqld') or r'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe'
    config={'port':3307,'managed':True,'mysqld':binary,'database_password':secrets.token_urlsafe(32),
            'root_password':secrets.token_urlsafe(32),'demo_password':secrets.token_urlsafe(18)}
    CONFIG.write_text(json.dumps(config,indent=2),encoding='utf-8')
    return config


def use_system_mysql(config, port):
    """Provision two local-only schemas with an admin password that is never saved."""
    password=os.environ.get('SHUKU_MYSQL_ADMIN_PASSWORD') or getpass.getpass('Local MySQL root password: ')
    connection=mysql.connector.connect(host='127.0.0.1',port=port,user='root',password=password,connection_timeout=5)
    try:
        cursor=connection.cursor()
        for database in ['shuku_local','idl_shuku_test_local']:
            cursor.execute(f'CREATE DATABASE IF NOT EXISTS `{database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin')
        cursor.execute("CREATE USER IF NOT EXISTS 'shuku_local'@'localhost' IDENTIFIED BY %s",(config['database_password'],))
        for database in ['shuku_local','idl_shuku_test_local']:
            cursor.execute(f"GRANT ALL PRIVILEGES ON `{database}`.* TO 'shuku_local'@'localhost'")
        candidate={**config,'port':port,'managed':False}
        if not mysql_ready(candidate):
            raise RuntimeError('Existing shuku_local account uses different credentials; it was not reset')
        CONFIG.write_text(json.dumps(candidate,indent=2),encoding='utf-8')
        return candidate
    finally:
        connection.close()


def environment(config, database='shuku_local'):
    url=URL.create('mysql+mysqlconnector', username='shuku_local',password=config['database_password'],host='127.0.0.1',port=config['port'],database=database)
    return {**os.environ,'PYTHONPATH':str(ROOT/'backend/src'),'PYTHONUTF8':'1',
            'SHUKU_DATABASE_URL':url.render_as_string(hide_password=False),
            'SHUKU_BUCKET_DIR':str(PRIVATE/'bucket'),'SHUKU_PUBLIC_ORIGIN':'http://localhost:5175',
            'SHUKU_DEMO_PASSWORD':config['demo_password'],'SHUKU_SOURCE_ROOT':str(ROOT),
            'SHUKU_HOST':'127.0.0.1','SHUKU_PORT':'8010'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['init','start','status','stop','test'])
    parser.add_argument('tests', nargs='*')
    parser.add_argument('--system-mysql',action='store_true',help='Use the existing local MySQL service (init only)')
    parser.add_argument('--port',type=int,default=3306)
    args, extra=parser.parse_known_args()
    if extra and args.command!='test':parser.error('Unexpected arguments')
    if args.command!='init' and not CONFIG.exists():
        raise RuntimeError('Run scripts/shuku-local.py init first')
    config=config_for_init()
    if args.system_mysql:
        if args.command!='init':parser.error('--system-mysql is only valid with init')
        config=use_system_mysql(config,args.port)
    if args.command=='status':
        print('Local MySQL: '+('ready' if mysql_ready(config) else 'stopped'))
        print('Private config: '+str(CONFIG))
        return
    if args.command=='stop':
        import psutil
        for name in ['backend-process.json','mysql-process.json']:
            path=PRIVATE/name
            if not path.exists():continue
            try:
                process=psutil.Process(json.loads(path.read_text())['pid'])
                cmd=process.cmdline()
                owned=('shuku_backend' in cmd and str(ROOT)==process.cwd()) if name.startswith('backend') else any(str(PRIVATE/'mysql-data') in value for value in cmd)
                if owned:process.terminate();process.wait(timeout=10)
            except psutil.NoSuchProcess:pass
        return
    start_mysql(config)
    env=environment(config)
    if args.command=='init':
        for command in ['migrate','seed-demo']:
            subprocess.run([sys.executable,'-m','shuku_backend',command],cwd=ROOT,env=env,check=True)
        print('Local MySQL initialized. Account password is in .private/shuku-local/config.json (demo_password).')
    elif args.command=='test':
        env['SHUKU_TEST_DATABASE_URL']=environment(config,'idl_shuku_test_local')['SHUKU_DATABASE_URL']
        raise SystemExit(subprocess.call([sys.executable,'-m','pytest',*(args.tests or ['backend/tests/shuku_backend']),'-q',*extra],cwd=ROOT,env=env))
    else:
        import urllib.request
        try:
            with urllib.request.urlopen('http://127.0.0.1:8010/api/shuku/health',timeout=2) as response:
                if response.status==200:
                    print('Shuku backend already running on 8010');return
        except OSError:pass
        process=launch([sys.executable,'-m','shuku_backend','serve'],PRIVATE/'backend.log',env)
        (PRIVATE/'backend-process.json').write_text(json.dumps({'pid':process.pid}),encoding='utf-8')
        for _ in range(100):
            if process.poll() is not None:raise RuntimeError('Backend failed; see .private/shuku-local/backend.log')
            try:
                with urllib.request.urlopen('http://127.0.0.1:8010/api/shuku/health',timeout=1) as response:
                    if response.status==200:print('Shuku backend ready on 8010');return
            except OSError:time.sleep(.2)
        raise RuntimeError('Backend did not become ready')


if __name__=='__main__':main()
