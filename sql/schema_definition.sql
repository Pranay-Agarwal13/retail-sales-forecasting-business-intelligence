-- ==============================================================================
-- File: sql/schema_definition.sql
-- Project: Retail Sales Forecasting & Business Intelligence
-- Dialect: PostgreSQL (with MySQL compatibility notes)
-- Description: DDL table schemas, primary keys, foreign keys, indexes,
-- and constraint definitions for enterprise retail transaction modeling.
-- ==============================================================================

-- Drop tables if re-deploying (in dependency order)
DROP TABLE IF EXISTS fact_retail_sales_clean CASCADE;
DROP TABLE IF EXISTS fact_retail_sales_demand CASCADE;
DROP TABLE IF EXISTS dim_product CASCADE;
DROP TABLE IF EXISTS dim_store CASCADE;
DROP TABLE IF EXISTS dim_date CASCADE;

-- ==============================================================================
-- 1. DIMENSION TABLES (STAR SCHEMA)
-- ==============================================================================

-- 1.1 Store Dimension
CREATE TABLE dim_store (
    store_id        VARCHAR(10)     PRIMARY KEY,
    store_name      VARCHAR(100)    NOT NULL,
    region          VARCHAR(20)     NOT NULL CHECK (region IN ('North', 'South', 'East', 'West')),
    traffic_factor  NUMERIC(4, 2)   NOT NULL DEFAULT 1.00,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Product Dimension
CREATE TABLE dim_product (
    product_id      VARCHAR(20)     PRIMARY KEY,
    product_name    VARCHAR(150)    NOT NULL,
    category        VARCHAR(50)     NOT NULL,
    sub_category    VARCHAR(50)     NOT NULL,
    base_unit_price NUMERIC(10, 2)  NOT NULL CHECK (base_unit_price > 0),
    cogs_ratio      NUMERIC(4, 2)   NOT NULL CHECK (cogs_ratio BETWEEN 0.05 AND 0.95),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 Date Dimension
CREATE TABLE dim_date (
    date_key        DATE            PRIMARY KEY,
    year_num        SMALLINT        NOT NULL,
    month_num       SMALLINT        NOT NULL CHECK (month_num BETWEEN 1 AND 12),
    month_name      VARCHAR(15)     NOT NULL,
    quarter_num     SMALLINT        NOT NULL CHECK (quarter_num BETWEEN 1 AND 4),
    week_num        SMALLINT        NOT NULL CHECK (week_num BETWEEN 1 AND 53),
    day_of_week     VARCHAR(15)     NOT NULL,
    day_of_week_num SMALLINT        NOT NULL CHECK (day_of_week_num BETWEEN 0 AND 6),
    is_weekend      SMALLINT        NOT NULL CHECK (is_weekend IN (0, 1)),
    is_holiday      SMALLINT        NOT NULL CHECK (is_holiday IN (0, 1))
);

-- ==============================================================================
-- 2. FACT TABLES
-- ==============================================================================

-- 2.1 Consolidated Fact Table: Clean POS Transactions (SALES + RETURNS)
-- Primary table for financial P&L, net revenue, return rates, and Power BI BI models.
CREATE TABLE fact_retail_sales_clean (
    transaction_id      BIGSERIAL       PRIMARY KEY, -- MySQL: BIGINT AUTO_INCREMENT PRIMARY KEY
    order_id            VARCHAR(30)     NOT NULL,
    original_order_id   VARCHAR(30)     NULL, -- Links RETURN records directly to parent SALE order_id
    order_date          DATE            NOT NULL REFERENCES dim_date(date_key),
    store_id            VARCHAR(10)     NOT NULL REFERENCES dim_store(store_id),
    product_id          VARCHAR(20)     NOT NULL REFERENCES dim_product(product_id),
    transaction_type    VARCHAR(10)     NOT NULL CHECK (transaction_type IN ('SALE', 'RETURN')),
    units_sold          INT             NOT NULL,
    unit_price          NUMERIC(10, 2)  NOT NULL CHECK (unit_price > 0),
    unit_cost           NUMERIC(10, 2)  NOT NULL CHECK (unit_cost > 0),
    discount            NUMERIC(4, 2)   NOT NULL DEFAULT 0.00 CHECK (discount BETWEEN 0.00 AND 1.00),
    revenue             NUMERIC(12, 2)  NOT NULL,
    profit              NUMERIC(12, 2)  NOT NULL,
    profit_margin       NUMERIC(6, 4)   NULL, -- Explicitly NULL for RETURN transactions
    promotion_flag      SMALLINT        NOT NULL DEFAULT 0 CHECK (promotion_flag IN (0, 1)),
    holiday_flag        SMALLINT        NOT NULL DEFAULT 0 CHECK (holiday_flag IN (0, 1)),

    -- Accounting business consistency constraints
    CONSTRAINT chk_sale_units CHECK (
        (transaction_type = 'SALE' AND units_sold > 0 AND revenue > 0 AND profit_margin IS NOT NULL) OR
        (transaction_type = 'RETURN' AND units_sold < 0 AND revenue <= 0 AND discount = 0.00 AND profit_margin IS NULL)
    )
);

-- 2.2 Forward Demand Fact Table (SALES ONLY)
-- Dedicated unpolluted dataset for time series forecasting (SARIMA, Prophet, XGBoost).
CREATE TABLE fact_retail_sales_demand (
    demand_id           BIGSERIAL       PRIMARY KEY, -- MySQL: BIGINT AUTO_INCREMENT PRIMARY KEY
    order_date          DATE            NOT NULL REFERENCES dim_date(date_key),
    store_id            VARCHAR(10)     NOT NULL REFERENCES dim_store(store_id),
    product_id          VARCHAR(20)     NOT NULL REFERENCES dim_product(product_id),
    units_sold          INT             NOT NULL CHECK (units_sold > 0),
    unit_price          NUMERIC(10, 2)  NOT NULL CHECK (unit_price > 0),
    unit_cost           NUMERIC(10, 2)  NOT NULL CHECK (unit_cost > 0),
    discount            NUMERIC(4, 2)   NOT NULL DEFAULT 0.00 CHECK (discount BETWEEN 0.00 AND 1.00),
    revenue             NUMERIC(12, 2)  NOT NULL CHECK (revenue > 0),
    profit              NUMERIC(12, 2)  NOT NULL,
    profit_margin       NUMERIC(6, 4)   NOT NULL,
    promotion_flag      SMALLINT        NOT NULL DEFAULT 0 CHECK (promotion_flag IN (0, 1)),
    holiday_flag        SMALLINT        NOT NULL DEFAULT 0 CHECK (holiday_flag IN (0, 1))
);

-- ==============================================================================
-- 3. PERFORMANCE INDEXES
-- ==============================================================================

-- Temporal query optimization (Monthly trends, YoY lags)
CREATE INDEX idx_clean_date ON fact_retail_sales_clean (order_date);
CREATE INDEX idx_demand_date ON fact_retail_sales_demand (order_date);

-- Dimension slice optimization (Star schema joins & BI aggregations)
CREATE INDEX idx_clean_store ON fact_retail_sales_clean (store_id);
CREATE INDEX idx_clean_product ON fact_retail_sales_clean (product_id);
CREATE INDEX idx_clean_type ON fact_retail_sales_clean (transaction_type);

-- Composite covering index for time-series feature lookups & aggregations
CREATE INDEX idx_clean_composite_analytics
    ON fact_retail_sales_clean (order_date, store_id, product_id, transaction_type);

-- Partial index for high-velocity forward sales queries
CREATE INDEX idx_clean_forward_sales
    ON fact_retail_sales_clean (order_date, product_id, revenue)
    WHERE transaction_type = 'SALE';
