import os
import math
import argparse
import pandas as pd

def entropy(data):
    """Tính Shannon entropy của dữ liệu"""
    if not data:
        return 0
    prob = [float(data.count(c)) / len(data) for c in set(data)]
    return -sum(p * math.log2(p) for p in prob)

def read_file_bytes(filepath):
    """Đọc dữ liệu nhị phân của file"""
    with open(filepath, 'rb') as f:
        return f.read()

def extract_features(directory):
    records = []

    for filename in os.listdir(directory):
        if filename.endswith(".bak"):
            original_path = os.path.join(directory, filename)
            encrypted_path = os.path.join(directory, filename[:-4])  # Remove .bak

            if os.path.exists(encrypted_path):
                original_data = read_file_bytes(original_path)
                encrypted_data = read_file_bytes(encrypted_path)

                entropy_orig = entropy(original_data)
                entropy_enc = entropy(encrypted_data)
                entropy_diff = entropy_enc - entropy_orig

                size_diff = len(encrypted_data) - len(original_data)

                records.append({
                    'filename': filename[:-4],
                    'entropy_difference': entropy_diff,
                    'size_difference': size_diff,
                    'label': 1  # ✅ Gắn nhãn là ransomware
                })

    return pd.DataFrame(records)

def main():
    parser = argparse.ArgumentParser(description="Extract features for RobGuard classification")
    parser.add_argument("dir", help="Path to the directory containing .bak and encrypted files")
    parser.add_argument("-o", "--output", default="test.csv", help="Output CSV file")
    args = parser.parse_args()

    df = extract_features(args.dir)
    df.to_csv(args.output, index=False)
    print(f"✅ Saved features to {args.output}")

if __name__ == "__main__":
    main()
