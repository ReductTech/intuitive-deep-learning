import os

import pytest
from idl_backend.local.cloud import cloud_environment, cloud_repository


def checkout(tmp_path):
    main = tmp_path / 'intuitive-deep-learning'
    cloud = tmp_path / 'cloud-intuitive-deep-learning'
    main.mkdir()
    (cloud / 'backend/cloud_api').mkdir(parents=True)
    (cloud / 'backend/cloud_api/app.py').touch()
    (cloud / 'infra').mkdir()
    return main, cloud


def test_local_api_uses_same_cloud_checkout_and_only_server_credentials(tmp_path, monkeypatch):
    main, cloud = checkout(tmp_path)
    for name in ('IDL_CLOUD_REPOSITORY', 'MYSQL_URL_REMOTE', 'GPU_GATEWAY_BASE_URL', 'LLM_GATEWAY_BASE_URL', 'IDL_TELEMETRY_ENABLED'):
        monkeypatch.delenv(name, raising=False)
    (cloud / 'infra/.env.cloud.production').write_text('MYSQL_URL_REMOTE=mysql+pymysql://example\nGPU_GATEWAY_BASE_URL=http://production-host\nDATABASE_URL=postgresql://production-only\n', encoding='utf-8')
    environment = cloud_environment(main)
    assert cloud_repository(main) == cloud
    assert environment['MYSQL_URL_REMOTE'] == 'mysql+pymysql://example'
    assert environment['GPU_GATEWAY_BASE_URL'] == 'http://127.0.0.1:28431'
    assert environment['LLM_GATEWAY_BASE_URL'] == 'http://127.0.0.1:28432'
    assert environment['IDL_TELEMETRY_ENABLED'] == 'false'
    assert str(main / 'backend/src') in environment['PYTHONPATH'].split(os.pathsep)
    assert str(cloud / 'backend') in environment['PYTHONPATH'].split(os.pathsep)


def test_explicit_environment_overrides_local_file_and_production(tmp_path, monkeypatch):
    main, cloud = checkout(tmp_path)
    monkeypatch.setenv('IDL_CLOUD_REPOSITORY', str(cloud))
    monkeypatch.setenv('MYSQL_URL_REMOTE', 'mysql+pymysql://explicit')
    (cloud / '.env.local').write_text('MYSQL_URL_REMOTE=mysql+pymysql://local\n', encoding='utf-8')
    (cloud / 'infra/.env.cloud.production').write_text('MYSQL_URL_REMOTE=mysql+pymysql://production\n', encoding='utf-8')
    assert cloud_environment(main)['MYSQL_URL_REMOTE'] == 'mysql+pymysql://explicit'


def test_missing_cache_configuration_fails_instead_of_bypassing_cloud(tmp_path, monkeypatch):
    main, cloud = checkout(tmp_path)
    monkeypatch.setenv('IDL_CLOUD_REPOSITORY', str(cloud))
    monkeypatch.delenv('MYSQL_URL_REMOTE', raising=False)
    with pytest.raises(RuntimeError, match='MYSQL_URL_REMOTE'):
        cloud_environment(main)
