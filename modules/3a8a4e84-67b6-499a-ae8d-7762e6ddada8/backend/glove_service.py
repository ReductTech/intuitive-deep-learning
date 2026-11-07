"""GloVe-only local teaching service. No BERT, Torch or Transformers."""
from typing import Optional

from pathlib import Path

from functools import lru_cache

import gzip

import threading

import numpy as np

from fastapi import FastAPI, HTTPException

from pydantic import BaseModel, Field

GLOVE_PATH=Path(__file__).resolve().parent.parent/'models/glove-wiki-gigaword-50/glove-wiki-gigaword-50.gz'

app=FastAPI(title='Local GloVe classroom model')

_glove_lock=threading.Lock()

class Request(BaseModel):

    text: str = Field(min_length=1, max_length=80)

    words: Optional[list[str]] = None



@lru_cache(maxsize=1)

def load_glove_model():

    if not GLOVE_PATH.is_file():

        raise FileNotFoundError(f'GloVe model not found: {GLOVE_PATH}')

    with gzip.open(GLOVE_PATH, 'rt', encoding='utf-8') as stream:

        header = stream.readline().split()

        if len(header) != 2 or not all(part.isdigit() for part in header):

            raise RuntimeError('GloVe model header is invalid.')

        count, dimensions = map(int, header)

        if dimensions != 50:

            raise RuntimeError(f'Expected 50-dimensional GloVe vectors, received {dimensions}.')

        vocabulary = {}

        matrix = np.empty((count, dimensions), dtype=np.float32)

        for row_index, line in enumerate(stream):

            if row_index >= count:

                raise RuntimeError('GloVe model contains more rows than its header declares.')

            fields = line.split()

            if len(fields) != dimensions + 1:

                raise RuntimeError(f'Invalid GloVe vector at row {row_index + 1}.')

            vocabulary[fields[0]] = row_index

            matrix[row_index] = np.fromstring(' '.join(fields[1:]), sep=' ', dtype=np.float32)

        if len(vocabulary) != count:

            raise RuntimeError(f'Expected {count} GloVe words, loaded {len(vocabulary)}.')

    return vocabulary, matrix



@app.post('/api/glove/embedding')

def glove_embedding(request: Request):

    requested = request.words or request.text.split()

    if not requested or any(not word.strip() or any(char.isspace() for char in word) for word in requested):

        raise HTTPException(400, '每个输入框请填一个英文单词。')

    try:

        with _glove_lock:

            vocabulary, matrix = load_glove_model()

    except FileNotFoundError as error:

        raise HTTPException(503, '本地 GloVe Wiki-Gigaword-50 文件未安装。') from error

    except Exception as error:

        raise HTTPException(500, f'本地 GloVe 模型加载失败：{error}') from error



    missing = [word for word in requested if word.lower() not in vocabulary]

    if missing:

        raise HTTPException(404, f'GloVe 50 词表中没有：{", ".join(missing)}。可试试常见英文单词。')

    rows = [

        {'token': word, 'values': matrix[vocabulary[word.lower()]].round(6).tolist()}

        for word in requested

    ]

    return {'hidden_size': 50, 'model_name': 'GloVe Wiki-Gigaword-50', 'rows': rows}



@app.get('/api/status')

def status():

    return {'ready':load_glove_model.cache_info().currsize>0,'local':True,'model':'glove-wiki-gigaword-50','glove_available':GLOVE_PATH.is_file()}



if __name__=='__main__':

    import os,uvicorn

    load_glove_model()

    uvicorn.run(app,host='127.0.0.1',port=int(os.environ.get('COURSE_MODEL_PORT','59437')))

