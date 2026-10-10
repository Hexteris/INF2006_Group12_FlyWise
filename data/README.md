# FlyWise Flight Dataset

## Overview

FlyWise uses historical U.S. flight operations data based on the 2025 U.S.
Department of Transportation Bureau of Transportation Statistics (BTS) On-Time
Performance dataset. It provides the historical context for flight-delay
analytics and the data-backed functions in the application.

The deployed FlyWise application uses an Amazon RDS MariaDB database named `group_project`. At the time of documentation, the database contains 7,001,619 flight records, 14 airlines, 352 airports and 6,938 routes. These figures describe the current database contents and may change when the data is refreshed.

## Dataset availability

The complete CSV is not included in this repository because of its large file size (approximately 895 MB). Obtain the approved project dataset separately before reproducing the analysis or repopulating the database.

The deployment manifest references an S3 dataset named flight_data_final.csv. Confirm that the dataset you obtain matches the intended project version before using it.

The data/ directory contains supporting application data and documentation rather than the full flight CSV. The deployed application's historical queries run against the populated MariaDB group_project database.

## How FlyWise uses the data

- Exploratory data analysis: The notebook in analytics/ examines the CSV dataset through data inspection, missing-value analysis, duplicate checks, descriptive statistics and feature analysis.

- Historical analytics: Flight records stored in MariaDB support application search and historical delay analytics.

- Summary tables: SQL scripts in src/SQL Queries/ support the summary tables used for monthly, hourly and delay-cause analytics. These tables must be created and populated as required after the database is loaded or refreshed.

- Delay prediction: The application includes a prediction model associated with the 2025 U.S. BTS On-Time Performance data. Refer to the project's model documentation for the exact training data, features and evaluation results.

## Schema reference

See [DATA_DICTIONARY.md] for the MariaDB tables, relationships, and column definitions.