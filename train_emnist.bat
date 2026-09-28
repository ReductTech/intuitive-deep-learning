@echo off
set KMP_DUPLICATE_LIB_OK=TRUE
python scripts\train_emnist_mobilenet_v3.py
pause