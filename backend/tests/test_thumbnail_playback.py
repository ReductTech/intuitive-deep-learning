import json
from types import SimpleNamespace

import pytest

from idl_backend.contracts.digit_tsne import COURSE_ID,EPOCHS,SEED,VERSION
from idl_backend.tools.content.generate_scenedeck_thumbnails import configure_digit_playback


def test_backend_playback_adapter_preserves_local_record_route(tmp_path):
    record={"recording":{"epochs":EPOCHS,"seed":SEED,"version":VERSION,"train_count":60000,"val_count":10000,"learning_rate":0.002,"batch_size":128},"frames":[{}]*(EPOCHS+1)}
    path=tmp_path/'record.json';path.write_text(json.dumps(record))
    routes=[]
    context=SimpleNamespace(route=lambda pattern,handler:routes.append((pattern,handler)))
    configure_digit_playback(context,COURSE_ID,path)
    assert routes[0][0]==f'**/api/courses/{COURSE_ID}/records/digit-tsne'
    responses=[]
    route=SimpleNamespace(request=SimpleNamespace(post_data_json={"learning_rate":0.002,"batch_size":128}),fulfill=lambda **response:responses.append(response))
    routes[0][1](route)
    assert responses[-1]['json']['result']==record
    route.request.post_data_json={"learning_rate":9,"batch_size":128}
    routes[0][1](route)
    assert responses[-1]['status']==400


def test_backend_playback_adapter_rejects_wrong_course(tmp_path):
    with pytest.raises(ValueError,match='only applies'):
        configure_digit_playback(SimpleNamespace(), 'another-course',tmp_path/'record.json')
