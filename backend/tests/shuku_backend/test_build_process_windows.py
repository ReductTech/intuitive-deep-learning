"""The local Windows authoring backend must not fail after a successful build."""
import os
import sys
import pytest
from shuku_backend.build_process import run_build
from shuku_backend.errors import BusinessError

pytestmark=pytest.mark.skipif(os.name!='nt',reason='Windows local authoring process cleanup')

def test_windows_build_output_and_timeout():
    code,out,err=run_build([sys.executable,'-c',"print('done')"],os.environ.copy(),lambda:None,timeout=5,interval=.05)
    assert (code,out.strip(),err)==(0,b'done',b'')
    with pytest.raises(BusinessError) as error:
        run_build([sys.executable,'-c','import time;time.sleep(30)'],os.environ.copy(),lambda:None,timeout=.5,interval=.05)
    assert error.value.code=='BUILD_TIMEOUT'
