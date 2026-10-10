# FlyWise Analytics

## 1. Overview

This folder contains the data analytics notebook
used for exploratory analysis of the FlyWise dataset.

The analysis includes:
- Dataset inspection
- Missing value analysis
- Duplicate record checks
- Descriptive statistics
- Numerical feature distributions
- Feature correlation analysis

## 2. Folder Structure

analytics/
- analysis.ipynb
- requirements.txt
- README.md

## 3. Requirements

Python 3.10 or later is recommended.

Install the required libraries:

pip install -r requirements.txt

## 4. How to Reproduce Results

1. Open analysis.ipynb in Google Colab.
2. Run the first cell to install the dependencies.
3. Run the dataset upload cell.
4. Upload the CSV dataset used for analysis.
5. Run all remaining cells in order.
6. Review the generated tables and graphs.
7. Retrieve the exported CSV files from outputs/.

## 5. Expected Outputs

The notebook generates:
- Dataset summary statistics
- Missing value counts
- Numerical feature distributions
- Correlation matrix, where applicable

CSV results are saved in the outputs/ folder.

## 6. Notes

The notebook performs exploratory data analysis.
It does not train or evaluate the ML model.

To reproduce the same results, use the same
dataset and compatible dependency versions.
