# Retail Sales Forecasting & Business Intelligence: Data Dictionary

**File Path:** `data/processed/retail_sales_clean.csv`  
**Companion Demand File:** `data/processed/retail_sales_demand.csv` (Filters `transaction_type == 'SALE'`)  
**Granularity:** Daily store-product transaction level  
**Date Range:** 2021-01-01 to 2023-12-31 (3 Full Calendar Years)  
**Primary Keys / Dimension Composite:** `(order_date, store_id, product_id, transaction_type)`

---

## 1. Table Schema & Column Definitions

| Column Name | Storage Type | Pandas / SQL Type | Nullable | Example Value | Business Definition & Calculation Rule |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `order_date` | Date | `datetime64[ns]` / `DATE` | No | `2023-11-24` | ISO-8601 transaction date. Corrupted strings are purged during cleaning. |
| `store_id` | Text | `category` / `VARCHAR(10)` | No | `STR-101` | Unique physical retail store identifier. |
| `store_name` | Text | `string` / `VARCHAR(100)` | No | `Downtown Metro Flagship` | Store location name. Imputed from canonical store master if null in raw feed. |
| `region` | Text | `category` / `VARCHAR(20)` | No | `East` | Commercial geographic operating territory (`North`, `South`, `East`, `West`). |
| `product_id` | Text | `category` / `VARCHAR(20)` | No | `PROD-EL-001` | Stock Keeping Unit (SKU) unique primary identifier. |
| `product_name` | Text | `string` / `VARCHAR(150)` | No | `UltraHD 55-inch 4K Smart TV` | Commercial catalog brand and product description. |
| `category` | Text | `category` / `VARCHAR(50)` | No | `Electronics` | Primary merchandising category (`Electronics`, `Apparel`, `Home & Kitchen`, `Beauty & Personal Care`). |
| `sub_category` | Text | `category` / `VARCHAR(50)` | No | `Televisions` | Specific merchandising department within category. |
| `transaction_type` | Text | `category` / `VARCHAR(10)` | No | `SALE` | **`SALE`** (forward demand) or **`RETURN`** (customer return refund). |
| `units_sold` | Integer | `int32` / `INT` | No | `8` | Units purchased (`> 0` for `SALE`) or units refunded (`< 0` for `RETURN`). |
| `unit_price` | Numeric | `float32` / `DECIMAL(10,2)` | No | `529.99` | Gross unit catalog price in USD before promotional discount. |
| `unit_cost` | Numeric | `float32` / `DECIMAL(10,2)` | No | `360.39` | Landed Cost of Goods Sold (COGS) per unit from Product Master. |
| `discount` | Numeric | `float32` / `DECIMAL(4,2)` | No | `0.20` | Percentage discount factor applied (`0.00` to `0.40`). Explicitly forced to `0.00` for returns. |
| `revenue` | Numeric | `float32` / `DECIMAL(12,2)` | No | `3391.94` | Total dollar revenue. Recalculated: `units_sold * unit_price * (1 - discount)`. Negative for returns. |
| `profit` | Numeric | `float32` / `DECIMAL(12,2)` | No | `508.82` | Gross margin in USD. Recalculated: `revenue - (units_sold * unit_cost)`. |
| `profit_margin` | Numeric | `float32` / `DECIMAL(6,4)` | Yes | `0.1500` | `profit / revenue` for `SALE` records with `revenue > 0`. Set to `NaN` (null) for returns. |
| `promotion_flag` | Binary | `int8` / `TINYINT` | No | `1` | `1` if a scheduled marketing discount campaign was active, else `0`. |
| `holiday_flag` | Binary | `int8` / `TINYINT` | No | `1` | `1` if the date falls on a recognized commercial retail holiday, else `0`. |
| `year` | Integer | `int16` / `SMALLINT` | No | `2023` | **Derived:** Calendar year extracted from `order_date`. |
| `month` | Integer | `int8` / `TINYINT` | No | `11` | **Derived:** Calendar month number (`1` to `12`). |
| `quarter` | Integer | `int8` / `TINYINT` | No | `4` | **Derived:** Fiscal quarter number (`1` to `4`). |
| `week` | Integer | `int8` / `TINYINT` | No | `47` | **Derived:** ISO calendar week number (`1` to `53`). |
| `day_of_week` | Text | `category` / `VARCHAR(15)` | No | `Friday` | **Derived:** Full English day of week name. |
| `day_of_week_num` | Integer | `int8` / `TINYINT` | No | `4` | **Derived:** Zero-indexed day of week (`0` = Monday, `6` = Sunday). |
| `is_weekend` | Binary | `int8` / `TINYINT` | No | `0` | **Derived:** `1` if Saturday or Sunday, else `0`. |

---

## 2. Business Logic, Returns Policy & Accounting Formulas

### 2.1 Forward Sales (`SALE`)
- $\text{units\_sold} \ge 1$
- $\text{revenue} = \text{units\_sold} \times \text{unit\_price} \times (1 - \text{discount})$
- $\text{total\_cogs} = \text{units\_sold} \times \text{unit\_cost}$
- $\text{profit} = \text{revenue} - \text{total\_cogs}$
- $\text{profit\_margin} = \frac{\text{profit}}{\text{revenue}}$

### 2.2 Customer Returns (`RETURN`)
- $\text{units\_sold} \le -1$ (signed quantity representing inventory replenishment/reversal)
- Under enterprise refund accounting, return records do not carry promotional discounts ($\text{discount} = 0.00$):
  - $\text{revenue} = \text{units\_sold} \times \text{unit\_price} \le 0$ (refunded revenue)
  - $\text{total\_cogs} = \text{units\_sold} \times \text{unit\_cost} \le 0$ (inventory recovery value)
  - $\text{profit} = \text{revenue} - \text{total\_cogs} \le 0$ (margin reversal)
- $\text{profit\_margin} = \text{NaN}$ (preventing distorted row-level ratios; aggregated in Power BI via DAX measures)

### 2.3 Executive Net Measures for BI & DAX
$$\text{Gross Sales} = \sum_{\text{type} = \text{SALE}} \text{revenue}$$
$$\text{Returns / Refunds} = \sum_{\text{type} = \text{RETURN}} |\text{revenue}|$$
$$\text{Net Revenue} = \sum \text{revenue} = \text{Gross Sales} - \text{Returns}$$
$$\text{Return Rate} = \frac{\text{Returns}}{\text{Gross Sales}}$$
$$\text{Enterprise Profit Margin} = \frac{\sum \text{profit}}{\sum \text{revenue}}$$

---

## 3. Dataset Split for Analytics vs. Machine Learning

| Asset Path | Records Included | Target Use Case |
| :--- | :--- | :--- |
| `data/processed/retail_sales_clean.csv` | Both `SALE` and `RETURN` | Power BI Star Schema, SQL Business Analytics, Financial P&L Auditing. |
| `data/processed/retail_sales_demand.csv` | Strictly `SALE` only | SARIMA, Prophet, XGBoost Time Series Forecasting. Prevents negative return distortion. |
