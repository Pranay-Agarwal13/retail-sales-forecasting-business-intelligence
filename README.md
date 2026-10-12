# Retail Sales Forecasting & Business Intelligence






An end-to-end retail analytics and demand-forecasting platform that transforms raw point-of-sale transaction data into clean data assets, business insights, statistical and machine-learning forecasts, and an executive Power BI dashboard.

The project answers practical retail questions: **What will demand look like over the next 30–90 days? Which products, stores, and regions drive revenue? Where do promotions improve volume but damage margin? Which SKUs need inventory attention?**

***

## 📌 Project Overview

Retail businesses must balance two opposing risks:

- **Under-forecasting**, which causes stockouts, lost sales, and poor customer experience during seasonal peaks.
- **Over-forecasting**, which locks up working capital, increases holding costs, and leads to markdowns.

This project builds a complete decision-support workflow:

1. Generate and ingest realistic multi-store retail POS transaction data.
2. Clean, validate, and enrich the data with calendar, profitability, and returns features.
3. Perform exploratory analysis across time, product, category, store, region, promotion, and returns.
4. Run SQL-based business intelligence queries using CTEs and window functions.
5. Benchmark SARIMA, Prophet, and XGBoost forecasting models using rolling-origin cross-validation.
6. Generate 30-, 60-, and 90-day demand forecasts.
7. Design a Power BI star-schema model and executive dashboard.

***

## 🧰 Tech Stack

| Area | Tools / Libraries |
|---|---|
| Programming | Python 3.10+ |
| Data Processing | pandas, NumPy |
| Visualization | Matplotlib, Seaborn |
| Forecasting | statsmodels SARIMAX, Prophet, XGBoost |
| Machine Learning | scikit-learn, XGBoost |
| Database | PostgreSQL / MySQL |
| Business Intelligence | Power BI |
| Version Control | Git, GitHub |

***

## 📂 Repository Structure

```text
retail-sales-forecasting-business-intelligence/
├── data/
│   ├── raw/
│   │   └── retail_sales_raw.csv
│   └── processed/
│       ├── retail_sales_clean.csv
│       ├── retail_sales_demand.csv
│       └── data_quality_report.json
├── notebooks/
│   ├── 01_data_cleaning_and_audit.ipynb
│   ├── 02_exploratory_data_analysis.ipynb
│   └── 03_time_series_forecasting.ipynb
├── src/
│   ├── data_generator.py
│   ├── data_cleaning.py
│   ├── eda_visualizer.py
│   └── forecast_engine.py
├── sql/
│   ├── schema_definition.sql
│   ├── schema_definition_mysql.sql
│   └── analytical_queries.sql
├── power_bi/
│   ├── data_model_architecture.md
│   └── dax_measures.dax
├── reports/
│   ├── figures/
│   ├── eda_executive_summary.csv
│   ├── forecast_backtest_results.csv
│   └── forecast_model_comparison.csv
├── forecasts/
│   └── forecast_results.csv
├── docs/
│   └── data_dictionary.md
├── requirements.txt
└── README.md
```

***

## 🗂️ Data Model

The project uses two data assets with different purposes:

| Dataset | Records Included | Purpose |
|---|---|---|
| `retail_sales_clean.csv` | `SALE` and `RETURN` transactions | Financial reporting, returns analysis, SQL analytics, Power BI |
| `retail_sales_demand.csv` | `SALE` transactions only | Time-series demand forecasting |

### Key Fields

- `order_date`: Transaction date
- `store_id`, `store_name`, `region`: Store and geographic dimensions
- `product_id`, `product_name`, `category`, `sub_category`: Product hierarchy
- `units_sold`: Positive for sales, negative for returns
- `unit_price`, `unit_cost`: Retail price and landed COGS
- `discount`: Promotional discount rate
- `revenue`: `units_sold × unit_price × (1 - discount)`
- `profit`: `revenue - (units_sold × unit_cost)`
- `promotion_flag`, `holiday_flag`: Known exogenous demand drivers
- `transaction_type`: `SALE` or `RETURN`
- `original_order_id`: Links a return to its original sale transaction

Full field definitions are available in [`docs/data_dictionary.md`](docs/data_dictionary.md).

***

## 🧹 Data Engineering

The cleaning pipeline performs:

- Date parsing and removal of corrupted date records
- Duplicate transaction removal
- Separation of `SALE` and `RETURN` records
- Validation of non-negative sales and negative return quantities
- Store and product master-data imputation
- Explicit recalculation of revenue, COGS, profit, and profit margin
- Calendar feature engineering: year, month, quarter, ISO week, day of week, weekend flag
- Data-type optimization
- Automated integrity assertions
- Export of a machine-readable data-quality report

The pipeline produces a clean BI dataset and a separate demand-only dataset for forecasting.

***

## 📊 Exploratory Data Analysis

The EDA examines:

- Revenue, profit, units, return rate, and average transaction value
- Daily, weekly, monthly, quarterly, and yearly demand trends
- Weekend and holiday seasonality
- Category, sub-category, product, store, and regional performance
- Pareto analysis to identify products driving 80% of revenue
- Promotion lift versus margin dilution
- Return rates by category, product, region, and promotion status
- Feature correlations and demand distributions

Example analyses include:

- Identifying high-revenue but low-margin categories
- Detecting products with sustained year-over-year decline
- Measuring whether discounts increase units sold while reducing profit per transaction
- Highlighting stores or regions that need assortment or replenishment changes
- Retaining holiday demand spikes for forecasting because they represent genuine seasonal behavior

All major charts are saved to `reports/figures/`.

***

## 🗃️ SQL Analytics

The SQL layer includes a star schema and ten analytical queries using CTEs, window functions, conditional aggregation, and division-by-zero protection.

Key analyses include:

- Monthly revenue, profit, return rate, and month-over-month growth
- Year-over-year category growth
- Top and bottom product performance
- Store rankings within and across regions
- Category return-rate analysis
- Promotion versus non-promotion performance
- Day-of-week and weekend seasonality
- Cumulative store revenue trajectory
- Product Pareto and ABC classification

Primary SQL dialect: **PostgreSQL**.  
A MySQL 8.0+ compatible schema is provided in `sql/schema_definition_mysql.sql`.

***

## 🔮 Forecasting Approach

The forecasting engine produces daily demand forecasts at multiple levels:

- Enterprise
- Category
- Top 5 products by revenue
- Top 3 stores by revenue

### Models Compared

| Model | Purpose |
|---|---|
| Seasonal Naive | Baseline benchmark using demand from the same day in the prior week |
| SARIMA | Classical statistical model capturing trend and weekly seasonality |
| Prophet | Decomposable model with weekly/yearly seasonality and exogenous regressors |
| XGBoost | Gradient-boosted model using lag, rolling-window, calendar, promotion, and holiday features |

### Validation Strategy

The project uses **rolling-origin time-series cross-validation** with expanding training windows and 30-day test horizons. This preserves temporal order and avoids future-data leakage.

Models are evaluated using:

- MAE
- RMSE
- WAPE
- MAPE
- MASE

**WAPE and MASE** are treated as the primary model-selection metrics because they are more stable for retail demand series with varying volume and occasional zero-demand days.

### Forecast Outputs

The final selected model for each series is retrained on all available history and used to generate:

- 30-day forecast
- 60-day forecast
- 90-day forecast
- Approximate empirical prediction intervals

Outputs are saved to:

```text
forecasts/forecast_results.csv
reports/forecast_backtest_results.csv
reports/forecast_model_comparison.csv
```

***

## 📈 Power BI Dashboard

The Power BI model follows a star-schema design:

```text
DimDate ─────┐
DimStore ────┼──► FactRetailSales ──► Executive Dashboard
DimProduct ──┘
                         │
                         └──► FactForecast
```

### Dashboard Pages

1. **Executive Sales Overview**  
   Revenue, profit, units, return rate, ATV, YoY growth, and monthly trend.

2. **Product & Category Performance**  
   Category contribution, top/bottom products, Pareto analysis, and margin performance.

3. **Store & Regional Analysis**  
   Store leaderboard, regional performance, store-category heatmap, and cumulative trends.

4. **Seasonality & Trends**  
   Day-of-week, monthly, quarterly, holiday, and promotion patterns.

5. **Forecast & Model Performance**  
   Actual versus forecast demand, 30/60/90-day projections, confidence intervals, and model accuracy.

### Core DAX Measures

```dax
Total Revenue = SUM(FactRetailSales[revenue])

Total Profit = SUM(FactRetailSales[profit])

Profit Margin =
DIVIDE([Total Profit], [Total Revenue])

Return Rate =
DIVIDE(
    CALCULATE(SUM(FactRetailSales[revenue]), FactRetailSales[transaction_type] = "RETURN"),
    CALCULATE(SUM(FactRetailSales[revenue]), FactRetailSales[transaction_type] = "SALE")
)

Forecasted Revenue =
SUM(FactForecast[forecast])
```

***

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/retail-sales-forecasting-business-intelligence.git
cd retail-sales-forecasting-business-intelligence
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
source venv/bin/activate      # macOS/Linux
venv\Scripts\activate         # Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Generate Raw Data

```bash
python src/data_generator.py
```

### 5. Clean and Process Data

```bash
python src/data_cleaning.py
```

### 6. Run Exploratory Analysis

```bash
jupyter notebook notebooks/02_exploratory_data_analysis.ipynb
```

### 7. Run Forecasting Pipeline

```bash
python src/forecast_engine.py
```

### 8. Open Power BI

Import:

- `data/processed/retail_sales_clean.csv`
- `data/processed/retail_sales_demand.csv`
- `forecasts/forecast_results.csv`

Then use the model and dashboard specifications in `power_bi/`.

***

## 📌 Key Business Insights

The project is designed to surface insights such as:

- Weekend demand requires earlier replenishment and higher staffing.
- Q4 and holiday periods require advance inventory planning.
- A small group of SKUs often drives the majority of revenue and should receive priority safety stock.
- Moderate promotions can increase volume, while deep discounts may reduce profit per transaction.
- Apparel may require return-rate controls due to sizing-related returns.
- Store and regional performance differences can guide assortment and inventory allocation.
- Holiday spikes should be retained in forecasting data and modeled using calendar features.

***

## 🧠 Skills Demonstrated

- Data cleaning and validation
- Feature engineering
- Exploratory data analysis
- Retail business analytics
- SQL analytical querying
- Time-series forecasting
- Model benchmarking
- Rolling-origin cross-validation
- Leakage-free machine-learning feature design
- Power BI data modeling
- DAX measure development
- Dashboard design
- Technical documentation

***

## 🔭 Future Improvements

- Add customer-level and order-basket analysis
- Incorporate inventory, stockout, and lead-time data
- Build replenishment and safety-stock recommendations
- Deploy forecasts through a scheduled pipeline
- Add MLflow or DVC for experiment and data versioning
- Use LightGBM or temporal fusion transformers for further benchmarking
- Automate Power BI refresh using a cloud data warehouse

***

## 📄 License

This project is licensed under the MIT License.

***

## 👤 Author

**Pranay Agarwal**  
Software Engineer | Data Science & AI Enthusiast  
Lucknow, Uttar Pradesh, India

Feel free to connect or explore my other projects.
