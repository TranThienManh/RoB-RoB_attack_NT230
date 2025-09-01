#!/bin/bash

# 1. Run Hooking (hướng dẫn chọn thư mục qua UI)
node hooking.js http://localhost:3000

# 2. Extract features
python3 preprocessor.py "/home/thienmanh/Documents/Doan-NT230/rob-localhost/rob_victimv1" -o test.csv

# 3. Run classifier
python3 classifer.py -t test.csv -tl 1 -s scaler.pkl -d dataset_new/df_benign.xlsx dataset_new/df_encrypted.xlsx -l 0 1

# 4. Notify user
node notifier.js prediction_results.csv
