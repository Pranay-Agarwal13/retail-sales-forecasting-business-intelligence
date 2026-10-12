-- ==============================================================================
-- File: sql/schema_definition_mysql.sql
-- Project: Retail Sales Forecasting & Business Intelligence
-- Target Database: MySQL 8.0+
-- Description: MySQL-native DDL schema, primary keys, foreign keys, and indexes.
-- ==============================================================================

SET foreign_key_checks = 0;
DROP TABLE IF EXISTS fact_retail_sales_clean;
DROP TABLE IF EXISTS fact_retail_sales_demand;
DROP TABLE IF EXISTS dim_product;
DROP TABLE IF EXISTS dim_store;
DROP TABLE IF EXISTS dim_date;
SET foreign_key_checks = 1;

-- 1. Dimension Tables
CREATE TABLE dim_store (
    store_id        VARCHAR(10)     PRIMARY KEY,
    store_name      VARCHAR(100)    NOT NULL,
    region          VARCHAR(20)     NOT NULL,
    traffic_factor  DECIMAL(4, 2)   NOT NULL DEFAULT 1.00,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_store_region CHECK (region IN ('North', 'South', 'East', 'West'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dim_product (
    product_id      VARCHAR(20)     PRIMARY KEY,
    product_name    VARCHAR(150)    NOT NULL,
    category        VARCHAR(50)     NOT NULL,
    sub_category    VARCHAR(50)     NOT NULL,
    base_unit_price DECIMAL(10, 2)  NOT NULL,
    cogs_ratio      DECIMAL(4, 2)   NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_prod_price CHECK (base_unit_price > 0),
    CONSTRAINT chk_prod_cogs CHECK (cogs_ratio BETWEEN 0.05 AND 0.95)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dim_date (
    date_key        DATE            PRIMARY KEY,
    year_num        SMALLINT        NOT NULL,
    month_num       TINYINT         NOT NULL,
    month_name      VARCHAR(15)     NOT NULL,
    quarter_num     TINYINT         NOT NULL,
    week_num        TINYINT         NOT NULL,
    day_of_week     VARCHAR(15)     NOT NULL,
    day_of_week_num TINYINT         NOT NULL,
    is_weekend      TINYINT         NOT NULL,
    is_holiday      TINYINT         NOT NULL,
    CONSTRAINT chk_date_month CHECK (month_num BETWEEN 1 AND 12),
    CONSTRAINT chk_date_quarter CHECK (quarter_num BETWEEN 1 AND 4),
    CONSTRAINT chk_date_weekend CHECK (is_weekend IN (0, 1)),
    CONSTRAINT chk_date_holiday CHECK (is_holiday IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Fact Tables
CREATE TABLE fact_retail_sales_clean (
    transaction_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id            VARCHAR(30)     NOT NULL,
    original_order_id   VARCHAR(30)     NULL,
    order_date          DATE            NOT NULL,
    store_id            VARCHAR(10)     NOT NULL,
    product_id          VARCHAR(20)     NOT NULL,
    transaction_type    VARCHAR(10)     NOT NULL,
    units_sold          INT             NOT NULL,
    unit_price          DECIMAL(10, 2)  NOT NULL,
    unit_cost           DECIMAL(10, 2)  NOT NULL,
    discount            DECIMAL(4, 2)   NOT NULL DEFAULT 0.00,
    revenue             DECIMAL(12, 2)  NOT NULL,
    profit              DECIMAL(12, 2)  NOT NULL,
    profit_margin       DECIMAL(6, 4)   NULL,
    promotion_flag      TINYINT         NOT NULL DEFAULT 0,
    holiday_flag        TINYINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_clean_date FOREIGN KEY (order_date) REFERENCES dim_date(date_key),
    CONSTRAINT fk_clean_store FOREIGN KEY (store_id) REFERENCES dim_store(store_id),
    CONSTRAINT fk_clean_prod FOREIGN KEY (product_id) REFERENCES dim_product(product_id),
    CONSTRAINT chk_sale_rules CHECK (
        (transaction_type = 'SALE' AND units_sold > 0 AND revenue > 0 AND profit_margin IS NOT NULL) OR
        (transaction_type = 'RETURN' AND units_sold < 0 AND revenue <= 0 AND discount = 0.00 AND profit_margin IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fact_retail_sales_demand (
    demand_id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id            VARCHAR(30)     NOT NULL,
    order_date          DATE            NOT NULL,
    store_id            VARCHAR(10)     NOT NULL,
    product_id          VARCHAR(20)     NOT NULL,
    units_sold          INT             NOT NULL,
    unit_price          DECIMAL(10, 2)  NOT NULL,
    unit_cost           DECIMAL(10, 2)  NOT NULL,
    discount            DECIMAL(4, 2)   NOT NULL DEFAULT 0.00,
    revenue             DECIMAL(12, 2)  NOT NULL,
    profit              DECIMAL(12, 2)  NOT NULL,
    profit_margin       DECIMAL(6, 4)   NOT NULL,
    promotion_flag      TINYINT         NOT NULL DEFAULT 0,
    holiday_flag        TINYINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_demand_date FOREIGN KEY (order_date) REFERENCES dim_date(date_key),
    CONSTRAINT fk_demand_store FOREIGN KEY (store_id) REFERENCES dim_store(store_id),
    CONSTRAINT fk_demand_prod FOREIGN KEY (product_id) REFERENCES dim_product(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Composite Covering Indexes (MySQL Compatible)
CREATE INDEX idx_clean_date ON fact_retail_sales_clean (order_date);
CREATE INDEX idx_clean_store ON fact_retail_sales_clean (store_id);
CREATE INDEX idx_clean_product ON fact_retail_sales_clean (product_id);
CREATE INDEX idx_clean_type ON fact_retail_sales_clean (transaction_type);
CREATE INDEX idx_clean_orig_order ON fact_retail_sales_clean (original_order_id);
CREATE INDEX idx_clean_composite_analytics ON fact_retail_sales_clean (order_date, store_id, product_id, transaction_type);
CREATE INDEX idx_demand_composite ON fact_retail_sales_demand (order_date, store_id, product_id);
