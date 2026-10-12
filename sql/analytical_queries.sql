-- ==============================================================================
-- File: sql/analytical_queries.sql
-- Project: Retail Sales Forecasting & Business Intelligence
-- Primary Dialect: PostgreSQL 14+ (with inline MySQL 8.0+ syntax annotations)
-- Business Definitions & Measures Enforced:
--   - Gross Sales    = SUM(revenue) WHERE transaction_type = 'SALE'
--   - Return Refunds = ABS(SUM(revenue)) WHERE transaction_type = 'RETURN'
--   - Net Revenue    = Gross Sales - Return Refunds = SUM(revenue)
--   - Net Profit     = SUM(profit)
--   - Return Rate %  = (Return Refunds / NULLIF(Gross Sales, 0)) * 100
--   - Blended Margin = (Net Profit / NULLIF(Net Revenue, 0)) * 100
--   - ATV (Avg Txn)  = Net Revenue / NULLIF(COUNT(CASE WHEN transaction_type = 'SALE' THEN 1 END), 0)
-- ==============================================================================


-- ==============================================================================
-- QUERY 1: TOP 10 PRODUCTS BY NET REVENUE & NET PROFIT
-- ==============================================================================
-- 1. Business Question:
--    Which top 10 SKUs generate the highest net revenue and dollar gross profit across our store chain?
--
-- 2. Analytical Approach:
--    Join transaction facts with dim_product. Group by product attributes, aggregate net revenue
--    and net profit, calculate net margin percentage, and rank products using DENSE_RANK().
--
-- 3. SQL Query:
WITH product_financials AS (
    SELECT
        p.product_id,
        p.product_name,
        p.category,
        p.sub_category,
        SUM(CASE WHEN f.transaction_type = 'SALE' THEN f.units_sold ELSE 0 END) AS units_sold,
        SUM(f.revenue)                                              AS net_revenue,
        SUM(f.profit)                                               AS net_profit,
        ABS(SUM(CASE WHEN f.transaction_type = 'RETURN' THEN f.revenue ELSE 0 END)) AS return_amount
    FROM fact_retail_sales_clean f
    JOIN dim_product p ON f.product_id = p.product_id
    GROUP BY p.product_id, p.product_name, p.category, p.sub_category
)
SELECT
    DENSE_RANK() OVER (ORDER BY net_revenue DESC)                   AS revenue_rank,
    product_id,
    product_name,
    category,
    sub_category,
    units_sold,
    ROUND(net_revenue, 2)                                           AS net_revenue,
    ROUND(net_profit, 2)                                            AS net_profit,
    ROUND((net_profit / NULLIF(net_revenue, 0) * 100), 2)           AS profit_margin_pct,
    ROUND((return_amount / NULLIF(net_revenue + return_amount, 0) * 100), 2) AS return_rate_pct
FROM product_financials
ORDER BY revenue_rank ASC
LIMIT 10;

-- 4. Expected Output Columns:
--    revenue_rank | product_id | product_name | category | sub_category | units_sold |
--    net_revenue | net_profit | profit_margin_pct | return_rate_pct
--
-- 5. Power BI & Forecasting Mapping:
--    Populates Page 2 (Product & Category Performance) Top N bar visual and identifies the
--    top 5 individual SKUs prioritized for item-level time series forecasting.


-- ==============================================================================
-- QUERY 2: BOTTOM 10 PRODUCTS (CANDIDATES FOR DISCONTINUATION)
-- ==============================================================================
-- 1. Business Question:
--    Which bottom 10 products generate the lowest net revenue and profit, and could be phased out?
--
-- 2. Analytical Approach:
--    Aggregate product-level net revenue, rank in ascending order of net revenue via DENSE_RANK(),
--    and identify low-velocity SKUs tying up retail working capital.
--
-- 3. SQL Query:
WITH product_bottom_ranking AS (
    SELECT
        p.product_id,
        p.product_name,
        p.category,
        p.sub_category,
        SUM(CASE WHEN f.transaction_type = 'SALE' THEN f.units_sold ELSE 0 END) AS units_sold,
        SUM(f.revenue)                                              AS net_revenue,
        SUM(f.profit)                                               AS net_profit,
        ABS(SUM(CASE WHEN f.transaction_type = 'RETURN' THEN f.revenue ELSE 0 END)) AS return_amount
    FROM fact_retail_sales_clean f
    JOIN dim_product p ON f.product_id = p.product_id
    GROUP BY p.product_id, p.product_name, p.category, p.sub_category
)
SELECT
    DENSE_RANK() OVER (ORDER BY net_revenue ASC)                    AS bottom_rank,
    product_id,
    product_name,
    category,
    sub_category,
    units_sold,
    ROUND(net_revenue, 2)                                           AS net_revenue,
    ROUND(net_profit, 2)                                            AS net_profit,
    ROUND((net_profit / NULLIF(net_revenue, 0) * 100), 2)           AS profit_margin_pct,
    ROUND((return_amount / NULLIF(net_revenue + return_amount, 0) * 100), 2) AS return_rate_pct
FROM product_bottom_ranking
ORDER BY bottom_rank ASC
LIMIT 10;

-- 4. Expected Output Columns:
--    bottom_rank | product_id | product_name | category | sub_category | units_sold |
--    net_revenue | net_profit | profit_margin_pct | return_rate_pct
--
-- 5. Power BI & Forecasting Mapping:
--    Feeds the Bottom N Slicer on the Merchandising page, highlighting candidates for
--    inventory de-stocking and safety stock elimination.


-- ==============================================================================
-- QUERY 3: MONTHLY SALES TREND & MONTH-OVER-MONTH (MoM) GROWTH
-- ==============================================================================
-- 1. Business Question:
--    What is our monthly trajectory of gross sales, returns, net revenue, net profit,
--    and Month-over-Month (MoM) growth rates over the 3-year timeline?
--
-- 2. Analytical Approach:
--    Group transactions by calendar month using DATE_TRUNC (PostgreSQL) or DATE_FORMAT (MySQL).
--    Separate SALE and RETURN via conditional aggregations in a CTE, then apply LAG() over
--    transaction_month to calculate dollar and percentage MoM revenue growth.
--
-- 3. SQL Query:
WITH monthly_aggregated AS (
    SELECT
        DATE_TRUNC('month', order_date)::DATE                       AS transaction_month, -- MySQL: DATE_FORMAT(order_date, '%Y-%m-01')
        SUM(CASE WHEN transaction_type = 'SALE' THEN revenue ELSE 0 END)     AS gross_sales,
        ABS(SUM(CASE WHEN transaction_type = 'RETURN' THEN revenue ELSE 0 END)) AS return_refunds,
        SUM(revenue)                                                AS net_revenue,
        SUM(profit)                                                 AS net_profit,
        SUM(CASE WHEN transaction_type = 'SALE' THEN units_sold ELSE 0 END) AS forward_units,
        COUNT(CASE WHEN transaction_type = 'SALE' THEN 1 END)       AS sale_transaction_count
    FROM fact_retail_sales_clean
    GROUP BY DATE_TRUNC('month', order_date) -- MySQL: GROUP BY DATE_FORMAT(order_date, '%Y-%m-01')
),
monthly_with_lags AS (
    SELECT
        transaction_month,
        gross_sales,
        return_refunds,
        net_revenue,
        net_profit,
        forward_units,
        sale_transaction_count,
        LAG(net_revenue, 1) OVER (ORDER BY transaction_month)       AS prior_month_net_revenue,
        LAG(net_profit, 1)  OVER (ORDER BY transaction_month)       AS prior_month_net_profit
    FROM monthly_aggregated
)
SELECT
    transaction_month,
    ROUND(gross_sales, 2)                                           AS gross_sales,
    ROUND(return_refunds, 2)                                        AS return_refunds,
    ROUND(net_revenue, 2)                                           AS net_revenue,
    ROUND(net_profit, 2)                                            AS net_profit,
    forward_units,
    ROUND((return_refunds / NULLIF(gross_sales, 0) * 100), 2)       AS return_rate_pct,
    ROUND((net_profit / NULLIF(net_revenue, 0) * 100), 2)           AS profit_margin_pct,
    ROUND((net_revenue / NULLIF(sale_transaction_count, 0)), 2)     AS avg_transaction_value,
    ROUND(prior_month_net_revenue, 2)                               AS prior_month_net_revenue,
    ROUND(net_revenue - prior_month_net_revenue, 2)                 AS mom_revenue_change_dollars,
    ROUND(((net_revenue - prior_month_net_revenue) / NULLIF(prior_month_net_revenue, 0) * 100), 2) AS mom_growth_pct
FROM monthly_with_lags
ORDER BY transaction_month ASC;

-- 4. Expected Output Columns:
--    transaction_month | gross_sales | return_refunds | net_revenue | net_profit |
--    forward_units | return_rate_pct | profit_margin_pct | avg_transaction_value |
--    prior_month_net_revenue | mom_revenue_change_dollars | mom_growth_pct
--
-- 5. Power BI & Forecasting Mapping:
--    Directly populates Power BI Page 1 (Executive Overview) monthly trend area visual,
--    MTD/MoM time-intelligence DAX measures, and benchmarks for 30/60/90-day forecasts.


-- ==============================================================================
-- QUERY 4: YEAR-OVER-YEAR (YoY) SALES GROWTH BY CATEGORY
-- ==============================================================================
-- 1. Business Question:
--    How has each merchandising category expanded or contracted Year-over-Year (YoY)
--    in net revenue, profit dollars, and unit volume across 2021, 2022, and 2023?
--
-- 2. Analytical Approach:
--    Join transaction facts to dim_product. Group by category and calendar year.
--    Use the LAG() analytic window function PARTITION BY category ORDER BY sales_year
--    to calculate absolute and percentage YoY growth metrics.
--
-- 3. SQL Query:
WITH category_annual_metrics AS (
    SELECT
        p.category,
        EXTRACT(YEAR FROM f.order_date)::INT                        AS sales_year, -- MySQL: YEAR(f.order_date)
        SUM(f.revenue)                                              AS net_revenue,
        SUM(f.profit)                                               AS net_profit,
        SUM(CASE WHEN f.transaction_type = 'SALE' THEN f.units_sold ELSE 0 END) AS forward_units
    FROM fact_retail_sales_clean f
    JOIN dim_product p ON f.product_id = p.product_id
    GROUP BY p.category, EXTRACT(YEAR FROM f.order_date)
),
category_annual_lags AS (
    SELECT
        category,
        sales_year,
        net_revenue,
        net_profit,
        forward_units,
        LAG(net_revenue, 1) OVER (PARTITION BY category ORDER BY sales_year)   AS prior_year_revenue,
        LAG(net_profit, 1)  OVER (PARTITION BY category ORDER BY sales_year)   AS prior_year_profit,
        LAG(forward_units, 1) OVER (PARTITION BY category ORDER BY sales_year) AS prior_year_units
    FROM category_annual_metrics
)
SELECT
    category,
    sales_year,
    ROUND(net_revenue, 2)                                           AS net_revenue,
    ROUND(net_profit, 2)                                            AS net_profit,
    forward_units,
    ROUND(prior_year_revenue, 2)                                    AS prior_year_revenue,
    ROUND(net_revenue - prior_year_revenue, 2)                      AS yoy_revenue_growth_dollars,
    ROUND(((net_revenue - prior_year_revenue) / NULLIF(prior_year_revenue, 0) * 100), 2) AS yoy_revenue_growth_pct,
    ROUND(((net_profit - prior_year_profit) / NULLIF(prior_year_profit, 0) * 100), 2)    AS yoy_profit_growth_pct,
    ROUND(((forward_units - prior_year_units)::NUMERIC / NULLIF(prior_year_units, 0) * 100), 2) AS yoy_unit_growth_pct
FROM category_annual_lags
ORDER BY category ASC, sales_year ASC;

-- 4. Expected Output Columns:
--    category | sales_year | net_revenue | net_profit | forward_units | prior_year_revenue |
--    yoy_revenue_growth_dollars | yoy_revenue_growth_pct | yoy_profit_growth_pct | yoy_unit_growth_pct
--
-- 5. Power BI & Forecasting Mapping:
--    Feeds the Category Matrix visual with YoY conditional formatting and validates
--    hierarchical forecasting reconciliation by category.


-- ==============================================================================
-- QUERY 5: STORE PERFORMANCE RANKING WITHIN REGION (RANK & DENSE_RANK)
-- ==============================================================================
-- 1. Business Question:
--    How do individual stores rank within their geographical regions and nationally,
--    and what are their relative sales volumes and ATV benchmarks?
--
-- 2. Analytical Approach:
--    Join transaction facts to dim_store. Aggregate net revenue, net profit, and forward units.
--    Demonstrate both RANK() and DENSE_RANK() partitioned by region, as well as national rank.
--
-- 3. SQL Query:
WITH store_financials AS (
    SELECT
        s.store_id,
        s.store_name,
        s.region,
        s.traffic_factor,
        SUM(CASE WHEN f.transaction_type = 'SALE' THEN f.units_sold ELSE 0 END) AS units_sold,
        SUM(f.revenue)                                              AS net_revenue,
        SUM(f.profit)                                               AS net_profit,
        ABS(SUM(CASE WHEN f.transaction_type = 'RETURN' THEN f.revenue ELSE 0 END)) AS return_amount,
        COUNT(CASE WHEN f.transaction_type = 'SALE' THEN 1 END)    AS sale_tx_count
    FROM fact_retail_sales_clean f
    JOIN dim_store s ON f.store_id = s.store_id
    GROUP BY s.store_id, s.store_name, s.region, s.traffic_factor
)
SELECT
    DENSE_RANK() OVER (ORDER BY net_revenue DESC)                   AS national_dense_rank,
    RANK() OVER (PARTITION BY region ORDER BY net_revenue DESC)     AS regional_standard_rank,
    DENSE_RANK() OVER (PARTITION BY region ORDER BY net_revenue DESC) AS regional_dense_rank,
    store_id,
    store_name,
    region,
    traffic_factor,
    units_sold,
    ROUND(net_revenue, 2)                                           AS net_revenue,
    ROUND(net_profit, 2)                                            AS net_profit,
    ROUND((net_profit / NULLIF(net_revenue, 0) * 100), 2)           AS profit_margin_pct,
    ROUND((return_amount / NULLIF(net_revenue + return_amount, 0) * 100), 2) AS return_rate_pct,
    ROUND((net_revenue / NULLIF(sale_tx_count, 0)), 2)              AS avg_transaction_value
FROM store_financials
ORDER BY national_dense_rank ASC;

-- 4. Expected Output Columns:
--    national_dense_rank | regional_standard_rank | regional_dense_rank | store_id |
--    store_name | region | traffic_factor | units_sold | net_revenue | net_profit |
--    profit_margin_pct | return_rate_pct | avg_transaction_value
--
-- 5. Power BI & Forecasting Mapping:
--    Feeds Page 3 (Store & Regional Analysis) map visualization, store leaderboard tables,
--    and regional slicer filters.


-- ==============================================================================
-- QUERY 6: CUSTOMER RETURN RATE BY CATEGORY
-- ==============================================================================
-- 1. Business Question:
--    What is the customer return rate (refund amount as % of gross sales) across each merchandising
--    category, and how many units and profit dollars are eroded by returns?
--
-- 2. Analytical Approach:
--    Join transaction facts to dim_product. Separate SALE and RETURN transactions in conditional
--    aggregations within a CTE. Calculate gross sales, refund revenue, return rate %, and net profit.
--
-- 3. SQL Query:
WITH category_returns AS (
    SELECT
        p.category,
        SUM(CASE WHEN f.transaction_type = 'SALE' THEN f.revenue ELSE 0 END)    AS gross_sales,
        ABS(SUM(CASE WHEN f.transaction_type = 'RETURN' THEN f.revenue ELSE 0 END)) AS return_refunds,
        SUM(f.revenue)                                                          AS net_revenue,
        SUM(f.profit)                                                           AS net_profit,
        SUM(CASE WHEN f.transaction_type = 'SALE' THEN f.units_sold ELSE 0 END) AS forward_units_sold,
        ABS(SUM(CASE WHEN f.transaction_type = 'RETURN' THEN f.units_sold ELSE 0 END)) AS returned_units
    FROM fact_retail_sales_clean f
    JOIN dim_product p ON f.product_id = p.product_id
    GROUP BY p.category
)
SELECT
    category,
    ROUND(gross_sales, 2)                                           AS gross_sales,
    ROUND(return_refunds, 2)                                        AS return_refunds,
    ROUND(net_revenue, 2)                                           AS net_revenue,
    ROUND(net_profit, 2)                                            AS net_profit,
    forward_units_sold,
    returned_units,
    ROUND((return_refunds / NULLIF(gross_sales, 0) * 100), 2)       AS return_rate_pct,
    ROUND((returned_units::NUMERIC / NULLIF(forward_units_sold, 0) * 100), 2) AS unit_return_rate_pct,
    ROUND((net_profit / NULLIF(net_revenue, 0) * 100), 2)           AS net_margin_pct
FROM category_returns
ORDER BY return_rate_pct DESC;

-- 4. Expected Output Columns:
--    category | gross_sales | return_refunds | net_revenue | net_profit |
--    forward_units_sold | returned_units | return_rate_pct | unit_return_rate_pct | net_margin_pct
--
-- 5. Power BI & Forecasting Mapping:
--    Feeds the Category Quality & Return Loss bar visual in Power BI, alerting merchandising
--    teams to sizing defects (Apparel) vs electronics warranty policies.


-- ==============================================================================
-- QUERY 7: PROMOTION VS. NON-PROMOTION PERFORMANCE COMPARISON
-- ==============================================================================
-- 1. Business Question:
--    How do promotional discount campaigns compare against full-price sales in terms of
--    unit velocity, average transaction value (ATV), margin retention, and linked customer return rates?
--
-- 2. Analytical Approach:
--    Analyzes forward SALE records by promotion_flag and discrete discount tier.
--    Crucially, links RETURN records back to parent sale transactions via original_order_id
--    to accurately measure true promotion-driven return rates without ledger attribution distortion.
--
-- 3. SQL Query:
WITH sale_orders AS (
    SELECT
        order_id,
        promotion_flag,
        CASE
            WHEN promotion_flag = 0 THEN '0% Full Price'
            WHEN discount BETWEEN 0.01 AND 0.12 THEN '1-12% Discount'
            WHEN discount BETWEEN 0.13 AND 0.18 THEN '13-18% Discount'
            WHEN discount BETWEEN 0.19 AND 0.25 THEN '19-25% Discount'
            ELSE '26%+ Clearance'
        END                                                         AS discount_tier,
        units_sold,
        revenue,
        profit,
        discount
    FROM fact_retail_sales_clean
    WHERE transaction_type = 'SALE'
),
linked_returns AS (
    SELECT
        original_order_id,
        SUM(ABS(revenue))                                           AS refund_amount,
        SUM(ABS(units_sold))                                        AS refund_units,
        COUNT(*)                                                    AS return_count
    FROM fact_retail_sales_clean
    WHERE transaction_type = 'RETURN' AND original_order_id IS NOT NULL
    GROUP BY original_order_id
),
orders_with_returns AS (
    SELECT
        s.order_id,
        s.promotion_flag,
        s.discount_tier,
        s.units_sold,
        s.revenue                                                   AS gross_sales,
        s.profit                                                    AS gross_profit,
        s.discount,
        COALESCE(r.refund_amount, 0)                                AS refund_amount,
        COALESCE(r.refund_units, 0)                                 AS refund_units,
        (s.revenue - COALESCE(r.refund_amount, 0))                  AS net_sales
    FROM sale_orders s
    LEFT JOIN linked_returns r ON s.order_id = r.original_order_id
)
SELECT
    CASE WHEN promotion_flag = 1 THEN 'Promotional Campaign' ELSE 'Full Price Standard' END AS campaign_status,
    discount_tier,
    COUNT(*)                                                        AS transaction_count,
    SUM(units_sold)                                                 AS total_units_sold,
    ROUND(SUM(gross_sales), 2)                                      AS gross_sales,
    ROUND(SUM(refund_amount), 2)                                    AS linked_refund_amount,
    ROUND(SUM(net_sales), 2)                                        AS net_sales,
    ROUND(SUM(gross_profit), 2)                                     AS total_profit,
    ROUND((AVG(discount) * 100), 1)                                 AS avg_discount_pct,
    ROUND((SUM(units_sold)::NUMERIC / COUNT(*)), 2)                 AS units_per_transaction,
    ROUND((SUM(gross_sales) / COUNT(*)), 2)                         AS avg_transaction_value,
    ROUND((SUM(gross_profit) / NULLIF(SUM(gross_sales), 0) * 100), 2) AS gross_profit_margin_pct,
    ROUND((SUM(refund_amount) / NULLIF(SUM(gross_sales), 0) * 100), 2) AS linked_return_rate_pct
FROM orders_with_returns
GROUP BY promotion_flag, discount_tier
ORDER BY promotion_flag ASC, avg_discount_pct ASC;

-- 4. Expected Output Columns:
--    campaign_status | discount_tier | transaction_count | total_units_sold | gross_sales |
--    linked_refund_amount | net_sales | total_profit | avg_discount_pct | units_per_transaction |
--    avg_transaction_value | gross_profit_margin_pct | linked_return_rate_pct
--
-- 5. Power BI & Forecasting Mapping:
--    Supplies coefficients for price elasticity and markdown simulation in Power BI what-if parameters,
--    while resolving the return-promotion attribution critique with mathematically linked parent order IDs.


-- ==============================================================================
-- QUERY 8: DAY OF WEEK AND WEEKEND VS. WEEKDAY SALES PATTERNS
-- ==============================================================================
-- 1. Business Question:
--    What are our demand patterns across days of the week, and how significant is the weekend lift
--    in daily net revenue and physical units sold?
--
-- 2. Analytical Approach:
--    Join transaction facts to dim_date. Group by day of week and weekend binary flag.
--    Compute average daily revenue and units per day to isolate true weekend footfall velocity.
--
-- 3. SQL Query:
WITH daily_aggregations AS (
    SELECT
        d.date_key,
        d.day_of_week,
        d.day_of_week_num,
        d.is_weekend,
        SUM(f.revenue)                                              AS daily_net_revenue,
        SUM(CASE WHEN f.transaction_type = 'SALE' THEN f.units_sold ELSE 0 END) AS daily_units_sold
    FROM fact_retail_sales_clean f
    JOIN dim_date d ON f.order_date = d.date_key
    GROUP BY d.date_key, d.day_of_week, d.day_of_week_num, d.is_weekend
)
SELECT
    day_of_week,
    day_of_week_num,
    CASE WHEN is_weekend = 1 THEN 'Weekend' ELSE 'Weekday' END      AS day_type,
    COUNT(DISTINCT date_key)                                        AS total_calendar_days,
    ROUND(AVG(daily_net_revenue), 2)                                AS avg_daily_revenue,
    ROUND(AVG(daily_units_sold), 1)                                 AS avg_daily_units,
    ROUND(SUM(daily_net_revenue), 2)                                AS total_revenue_by_dow,
    ROUND((SUM(daily_net_revenue) / SUM(SUM(daily_net_revenue)) OVER () * 100), 2) AS revenue_share_pct
FROM daily_aggregations
GROUP BY day_of_week, day_of_week_num, is_weekend
ORDER BY day_of_week_num ASC;

-- 4. Expected Output Columns:
--    day_of_week | day_of_week_num | day_type | total_calendar_days | avg_daily_revenue |
--    avg_daily_units | total_revenue_by_dow | revenue_share_pct
--
-- 5. Power BI & Forecasting Mapping:
--    Directly models the weekly seasonality components ($s=7$) for SARIMA, Prophet, and XGBoost lag features.


-- ==============================================================================
-- QUERY 9: RUNNING TOTAL OF SALES PER STORE OVER TIME
-- ==============================================================================
-- 1. Business Question:
--    What is the cumulative running total of net revenue generated by each store over time,
--    and how does store trajectory diverge across the 3-year timeline?
--
-- 2. Analytical Approach:
--    Aggregate monthly net revenue per store. Apply an analytic window function
--    SUM(monthly_revenue) OVER (PARTITION BY store_id ORDER BY transaction_month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
--    to compute the running cumulative revenue curve.
--
-- 3. SQL Query:
WITH store_monthly_sales AS (
    SELECT
        s.store_id,
        s.store_name,
        s.region,
        DATE_TRUNC('month', f.order_date)::DATE                     AS transaction_month, -- MySQL: DATE_FORMAT(f.order_date, '%Y-%m-01')
        SUM(f.revenue)                                              AS monthly_net_revenue,
        SUM(CASE WHEN f.transaction_type = 'SALE' THEN f.units_sold ELSE 0 END) AS monthly_units_sold
    FROM fact_retail_sales_clean f
    JOIN dim_store s ON f.store_id = s.store_id
    GROUP BY s.store_id, s.store_name, s.region, DATE_TRUNC('month', f.order_date)
)
SELECT
    store_id,
    store_name,
    region,
    transaction_month,
    ROUND(monthly_net_revenue, 2)                                   AS monthly_net_revenue,
    monthly_units_sold,
    ROUND(
        SUM(monthly_net_revenue) OVER (
            PARTITION BY store_id
            ORDER BY transaction_month ASC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ),
        2
    )                                                               AS cumulative_running_revenue,
    ROUND(
        SUM(monthly_units_sold) OVER (
            PARTITION BY store_id
            ORDER BY transaction_month ASC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ),
        0
    )                                                               AS cumulative_running_units
FROM store_monthly_sales
ORDER BY store_id ASC, transaction_month ASC;

-- 4. Expected Output Columns:
--    store_id | store_name | region | transaction_month | monthly_net_revenue |
--    monthly_units_sold | cumulative_running_revenue | cumulative_running_units
--
-- 5. Power BI & Forecasting Mapping:
--    Feeds the Cumulative Store Trajectory multi-line chart in Power BI and enables
--    store managers to track progress toward annualized revenue milestones.


-- ==============================================================================
-- QUERY 10: PARETO ANALYSIS (80/20 RULE: PRODUCTS DRIVING 80% OF REVENUE)
-- ==============================================================================
-- 1. Business Question:
--    Which top products contribute to 80% of enterprise gross revenue, and how is our
--    catalog classified into ABC inventory management buckets?
--
-- 2. Analytical Approach:
--    Aggregate forward sales revenue by product. Calculate total catalog revenue using
--    an unbounded window function SUM() OVER (). Calculate running cumulative revenue using
--    SUM() OVER (ORDER BY gross_revenue DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW),
--    compute cumulative percentage, and assign ABC Pareto classifications.
--
-- 3. SQL Query:
WITH product_sales AS (
    SELECT
        p.product_id,
        p.product_name,
        p.category,
        SUM(f.revenue)                                              AS gross_product_revenue
    FROM fact_retail_sales_clean f
    JOIN dim_product p ON f.product_id = p.product_id
    WHERE f.transaction_type = 'SALE'
    GROUP BY p.product_id, p.product_name, p.category
),
pareto_calculations AS (
    SELECT
        product_id,
        product_name,
        category,
        gross_product_revenue,
        DENSE_RANK() OVER (ORDER BY gross_product_revenue DESC)     AS revenue_rank,
        COUNT(*) OVER ()                                            AS total_catalog_products,
        SUM(gross_product_revenue) OVER ()                          AS total_enterprise_revenue,
        SUM(gross_product_revenue) OVER (
            ORDER BY gross_product_revenue DESC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )                                                           AS cumulative_revenue
    FROM product_sales
)
SELECT
    revenue_rank,
    product_id,
    product_name,
    category,
    ROUND(gross_product_revenue, 2)                                 AS gross_product_revenue,
    ROUND(cumulative_revenue, 2)                                    AS cumulative_revenue,
    ROUND((cumulative_revenue / total_enterprise_revenue * 100), 2) AS cumulative_revenue_pct,
    ROUND((revenue_rank::NUMERIC / total_catalog_products * 100), 1) AS cumulative_sku_pct,
    CASE
        WHEN COALESCE(
            LAG(cumulative_revenue) OVER (ORDER BY revenue_rank),
            0
        ) / total_enterprise_revenue < 0.80
        THEN 'Class A (Products Driving First 80% Revenue)'
        WHEN cumulative_revenue / total_enterprise_revenue <= 0.95
        THEN 'Class B (Next 15% Mid-Tier)'
        ELSE 'Class C (Long-Tail 5%)'
    END                                                             AS pareto_classification
FROM pareto_calculations
ORDER BY revenue_rank ASC;

-- 4. Expected Output Columns:
--    revenue_rank | product_id | product_name | category | gross_product_revenue |
--    cumulative_revenue | cumulative_revenue_pct | cumulative_sku_pct | pareto_classification
--
-- 5. Power BI & Forecasting Mapping:
--    Directly populates the Pareto Line-and-Stacked Column chart in Power BI Page 2,
--    allowing supply chain teams to allocate safety stock and forecasting resources to Class A SKUs.
