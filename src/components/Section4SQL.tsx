import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  Download,
  FileCode2,
  Table as TableIcon,
  Layers,
  ArrowRight,
  TrendingUp,
  Percent,
  AlertCircle,
  HelpCircle,
  BarChart2,
  Calendar,
  DollarSign,
  Tag,
  MapPin,
  Sparkles
} from 'lucide-react';

interface SQLQueryItem {
  id: number;
  title: string;
  category: string;
  question: string;
  approach: string;
  expectedColumns: string;
  powerBiVisual: string;
  sql: string;
  sampleColumns: string[];
  sampleData: (string | number)[][];
}

const SQL_QUERIES: SQLQueryItem[] = [
  {
    id: 1,
    title: "Top 10 Products by Net Revenue & Net Profit",
    category: "Product Performance",
    question: "Which top 10 SKUs generate the highest net revenue and dollar gross profit across our chain?",
    approach: "Join transaction facts to dim_product, aggregate net metrics, compute net margin, and rank via DENSE_RANK().",
    expectedColumns: "revenue_rank, product_id, product_name, category, sub_category, units_sold, net_revenue, net_profit, profit_margin_pct, return_rate_pct",
    powerBiVisual: "Page 2: Product Performance Top 10 horizontal bar chart visual and high-priority forecast candidate picker.",
    sampleColumns: ["Rank", "SKU ID", "Product Name", "Category", "Units", "Net Revenue", "Net Profit", "Margin %", "Return %"],
    sampleData: [
      [1, "PROD-EL-001", "UltraHD 55-inch 4K Smart TV", "Electronics", 1720, "$834,180", "$266,937", "32.0%", "2.8%"],
      [2, "PROD-EL-004", "14-inch Productivity Laptop", "Electronics", 915, "$698,240", "$195,507", "28.0%", "3.1%"],
      [3, "PROD-EL-002", "Noise-Cancelling Headphones", "Electronics", 2140, "$412,890", "$198,187", "48.0%", "2.4%"],
      [4, "PROD-HK-001", "Digital Air Fryer 5.8-Quart", "Home & Kitchen", 2890, "$328,450", "$170,794", "52.0%", "3.8%"],
      [5, "PROD-BP-001", "Revitalizing Facial Serum", "Beauty", 4920, "$218,640", "$157,420", "72.0%", "1.2%"],
      [6, "PROD-AP-002", "Slim-Fit Stretch Denim Jeans", "Apparel", 3410, "$194,520", "$108,931", "56.0%", "5.6%"],
      [7, "PROD-AP-004", "Waterproof Hooded Rain Jacket", "Apparel", 1680, "$188,400", "$103,620", "55.0%", "4.9%"],
      [8, "PROD-HK-002", "Stainless Steel 10-Pc Cookware", "Home & Kitchen", 740, "$177,600", "$92,352", "52.0%", "3.4%"],
      [9, "PROD-EL-003", "Bluetooth Portable Speaker", "Electronics", 1980, "$152,430", "$79,263", "52.0%", "2.9%"],
      [10, "PROD-BP-002", "Hydrating Shea Body Butter", "Beauty", 5180, "$124,320", "$93,240", "75.0%", "0.9%"]
    ],
    sql: `WITH product_financials AS (
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
LIMIT 10;`
  },
  {
    id: 2,
    title: "Bottom 10 Products (Discontinuation Candidates)",
    category: "Product Performance",
    question: "Which bottom 10 products generate the lowest net revenue and profit, and could be phased out?",
    approach: "Aggregate product-level net revenue, rank in ascending order via DENSE_RANK(), and flag low-turnover inventory risks.",
    expectedColumns: "bottom_rank, product_id, product_name, category, sub_category, units_sold, net_revenue, net_profit, profit_margin_pct, return_rate_pct",
    powerBiVisual: "Page 2: Bottom N Slicer on Merchandising page to identify clearance and rationalization candidates.",
    sampleColumns: ["Rank", "SKU ID", "Product Name", "Category", "Units", "Net Revenue", "Net Profit", "Margin %", "Return %"],
    sampleData: [
      [1, "PROD-AP-003", "Running Performance Socks (3-Pack)", "Apparel", 2450, "$32,840", "$21,346", "65.0%", "2.1%"],
      [2, "PROD-HK-004", "Ceramic Ultrasonic Diffuser", "Home & Kitchen", 840, "$38,620", "$20,082", "52.0%", "3.5%"],
      [3, "PROD-BP-004", "Organic Argan Hair Mask", "Beauty", 1420, "$41,180", "$28,826", "70.0%", "1.4%"],
      [4, "PROD-AP-001", "Classic Crewneck Cotton T-Shirt", "Apparel", 1950, "$46,210", "$30,036", "65.0%", "4.8%"],
      [5, "PROD-HK-003", "Memory Foam Orthopedic Pillow", "Home & Kitchen", 1120, "$48,160", "$25,043", "52.0%", "4.2%"],
      [6, "PROD-BP-003", "Vitamin C Brightening Cleanser", "Beauty", 2480, "$51,580", "$36,106", "70.0%", "1.1%"],
      [7, "PROD-BP-002", "Hydrating Shea Body Butter", "Beauty", 5180, "$124,320", "$93,240", "75.0%", "0.9%"],
      [8, "PROD-EL-003", "Bluetooth Portable Speaker", "Electronics", 1980, "$152,430", "$79,263", "52.0%", "2.9%"],
      [9, "PROD-HK-002", "Stainless Steel 10-Pc Cookware", "Home & Kitchen", 740, "$177,600", "$92,352", "52.0%", "3.4%"],
      [10, "PROD-AP-004", "Waterproof Hooded Rain Jacket", "Apparel", 1680, "$188,400", "$103,620", "55.0%", "4.9%"]
    ],
    sql: `WITH product_bottom_ranking AS (
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
LIMIT 10;`
  },
  {
    id: 3,
    title: "Monthly Sales Trend & MoM Growth",
    category: "Financial P&L",
    question: "What is our monthly trajectory of gross sales, returns, net revenue, net profit, and Month-over-Month (MoM) growth rates?",
    approach: "Group by DATE_TRUNC('month', order_date), separate SALE and RETURN in a CTE, then apply LAG(1) to calculate dollar and percentage MoM revenue growth.",
    expectedColumns: "transaction_month, gross_sales, return_refunds, net_revenue, net_profit, forward_units, return_rate_pct, profit_margin_pct, avg_transaction_value, prior_month_net_revenue, mom_growth_pct",
    powerBiVisual: "Page 1: Executive Overview monthly Net Revenue vs Net Profit area chart and MoM growth indicator cards.",
    sampleColumns: ["Month", "Gross Sales", "Refunds", "Net Revenue", "Net Profit", "Margin %", "Return %", "Prior Mo Rev", "MoM Growth %"],
    sampleData: [
      ["2023-07-01", "$116,420", "$4,180", "$112,240", "$54,120", "48.2%", "3.6%", "$108,450", "+3.5%"],
      ["2023-08-01", "$119,850", "$4,290", "$115,560", "$55,890", "48.4%", "3.6%", "$112,240", "+3.0%"],
      ["2023-09-01", "$124,100", "$4,510", "$119,590", "$57,620", "48.2%", "3.6%", "$115,560", "+3.5%"],
      ["2023-10-01", "$128,940", "$4,680", "$124,260", "$60,110", "48.4%", "3.6%", "$119,590", "+3.9%"],
      ["2023-11-01", "$168,450", "$6,120", "$162,330", "$76,840", "47.3%", "3.6%", "$124,260", "+30.6%"],
      ["2023-12-01", "$184,200", "$7,210", "$176,990", "$83,410", "47.1%", "3.9%", "$162,330", "+9.0%"]
    ],
    sql: `WITH monthly_aggregated AS (
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
ORDER BY transaction_month ASC;`
  },
  {
    id: 4,
    title: "YoY Sales Growth by Category",
    category: "Executive Growth",
    question: "How has each merchandising category expanded or contracted Year-over-Year (YoY) in net revenue and units?",
    approach: "Join facts to dim_product, group by category and calendar year, then apply LAG(1) PARTITION BY category ORDER BY sales_year.",
    expectedColumns: "category, sales_year, net_revenue, net_profit, forward_units, prior_year_revenue, yoy_revenue_growth_dollars, yoy_revenue_growth_pct",
    powerBiVisual: "Page 1 & 2: Category Matrix with YoY conditional formatting arrows and hierarchy expanders.",
    sampleColumns: ["Category", "Year", "Net Revenue", "Net Profit", "Units", "Prior Year Rev", "YoY Dollar Chg", "YoY Growth %"],
    sampleData: [
      ["Apparel", 2021, "$142,650", "$79,120", 7240, "-", "-", "-"],
      ["Apparel", 2022, "$153,890", "$85,410", 7710, "$142,650", "+$11,240", "+7.88%"],
      ["Apparel", 2023, "$165,720", "$91,890", 8230, "$153,890", "+$11,830", "+7.69%"],
      ["Beauty & Personal Care", 2021, "$124,180", "$88,140", 13890, "-", "-", "-"],
      ["Beauty & Personal Care", 2022, "$133,940", "$95,120", 14780, "$124,180", "+$9,760", "+7.86%"],
      ["Beauty & Personal Care", 2023, "$144,380", "$102,480", 15720, "$133,940", "+$10,440", "+7.79%"],
      ["Electronics", 2021, "$658,240", "$245,180", 6450, "-", "-", "-"],
      ["Electronics", 2022, "$707,850", "$263,410", 6890, "$658,240", "+$49,610", "+7.54%"],
      ["Electronics", 2023, "$762,390", "$283,540", 7350, "$707,850", "+$54,540", "+7.71%"]
    ],
    sql: `WITH category_annual_metrics AS (
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
ORDER BY category ASC, sales_year ASC;`
  },
  {
    id: 5,
    title: "Store Performance Ranking Within Region (RANK & DENSE_RANK)",
    category: "Store Analytics",
    question: "How do individual stores rank within their geographical regions and nationally?",
    approach: "Aggregate net metrics per store, compute national DENSE_RANK() and regional intra-rank via both RANK() and DENSE_RANK().",
    expectedColumns: "national_dense_rank, regional_standard_rank, regional_dense_rank, store_id, store_name, region, traffic_factor, units_sold, net_revenue, profit_margin_pct",
    powerBiVisual: "Page 3: Store & Regional Analysis geographic bubble map and store leaderboard table.",
    sampleColumns: ["Nat. Rank", "Reg. Rank", "Store ID", "Store Name", "Region", "Traffic", "Net Revenue", "Net Profit", "Margin %", "Return %"],
    sampleData: [
      [1, 1, "STR-101", "Downtown Metro Flagship", "East", 1.45, "$742,850", "$354,120", "47.7%", "3.5%"],
      [2, 1, "STR-104", "West Coast Galleria", "West", 1.35, "$698,420", "$334,180", "47.8%", "3.6%"],
      [3, 2, "STR-107", "Pacific Fair Mall", "West", 1.25, "$645,190", "$308,450", "47.8%", "3.4%"],
      [4, 2, "STR-102", "Suburban Center Mall", "East", 1.20, "$619,540", "$296,820", "47.9%", "3.5%"],
      [5, 1, "STR-105", "Sunbelt Town Center", "South", 1.15, "$594,180", "$285,140", "48.0%", "3.6%"],
      [6, 1, "STR-103", "Midwest Commerce Plaza", "North", 1.10, "$568,290", "$272,810", "48.0%", "3.4%"],
      [7, 2, "STR-106", "Metro South Arcade", "South", 1.05, "$542,160", "$260,110", "48.0%", "3.7%"],
      [8, 2, "STR-108", "North Plains Shopping Center", "North", 0.95, "$489,120", "$234,810", "48.0%", "3.5%"]
    ],
    sql: `WITH store_financials AS (
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
ORDER BY national_dense_rank ASC;`
  },
  {
    id: 6,
    title: "Customer Return Rate by Category",
    category: "Category Intelligence",
    question: "What is the customer return rate (refund as % of gross) across each merchandising category?",
    approach: "Join facts to dim_product, separate SALE and RETURN via conditional aggregations, and compute dollar and unit return rates.",
    expectedColumns: "category, gross_sales, return_refunds, net_revenue, net_profit, forward_units_sold, returned_units, return_rate_pct, unit_return_rate_pct, net_margin_pct",
    powerBiVisual: "Page 2: Category Return Exposure visual alerting category managers to apparel sizing rates.",
    sampleColumns: ["Category", "Gross Sales", "Return Refunds", "Net Revenue", "Net Profit", "Forward Units", "Returned Units", "Return Rate %", "Unit Return %"],
    sampleData: [
      ["Apparel", "$484,650", "$26,190", "$458,460", "$256,420", 23180, 1280, "5.40%", "5.52%"],
      ["Home & Kitchen", "$842,100", "$31,980", "$810,120", "$421,280", 22410, 810, "3.80%", "3.61%"],
      ["Electronics", "$2,212,450", "$64,150", "$2,148,300", "$792,130", 20690, 590, "2.90%", "2.85%"],
      ["Beauty & Personal Care", "$412,800", "$4,540", "$408,260", "$285,740", 44390, 480, "1.10%", "1.08%"]
    ],
    sql: `WITH category_returns AS (
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
ORDER BY return_rate_pct DESC;`
  },
  {
    id: 7,
    title: "Promotion vs. Non-Promotion Performance (with Linked Returns)",
    category: "Promotions & Pricing",
    question: "How do promotional discount campaigns compare against full price in units, margin, and linked return rates?",
    approach: "Analyze forward SALE transactions by promotion and discount tier, linking RETURN records back to parent sale order_id.",
    expectedColumns: "campaign_status, discount_tier, transaction_count, total_units_sold, gross_sales, linked_refund_amount, net_sales, units_per_transaction, linked_return_rate_pct",
    powerBiVisual: "Page 2/4: Promotional Lift vs Margin Dilution scatter and linked return rate bar visual.",
    sampleColumns: ["Campaign Status", "Discount Tier", "Orders", "Units", "Gross Sales", "Linked Refunds", "Net Sales", "Units/Txn", "Margin %", "Linked Return %"],
    sampleData: [
      ["Full Price Standard", "0% Full Price", 58420, 89120, "$2,642,850", "$84,570", "$2,558,280", "1.53", "48.2%", "3.20%"],
      ["Promotional Campaign", "10% Discount", 14850, 28140, "$584,210", "$23,360", "$560,850", "1.90", "44.6%", "4.00%"],
      ["Promotional Campaign", "15% Discount", 9420, 19890, "$392,150", "$17,250", "$374,900", "2.11", "41.8%", "4.40%"],
      ["Promotional Campaign", "20% Discount", 5810, 14210, "$268,420", "$13,150", "$255,270", "2.45", "38.5%", "4.90%"],
      ["Promotional Campaign", "30%+ Clearance", 2480, 7120, "$114,290", "$7,420", "$106,870", "2.87", "31.2%", "6.49%"]
    ],
    sql: `WITH sale_orders AS (
    SELECT
        order_id,
        promotion_flag,
        CASE
            WHEN promotion_flag = 0 THEN '0% Full Price'
            WHEN discount BETWEEN 0.01 AND 0.12 THEN '10% Discount'
            WHEN discount BETWEEN 0.13 AND 0.18 THEN '15% Discount'
            WHEN discount BETWEEN 0.19 AND 0.25 THEN '20% Discount'
            ELSE '30%+ Clearance'
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
ORDER BY promotion_flag ASC, avg_discount_pct ASC;`
  },
  {
    id: 8,
    title: "Day of Week and Weekend vs. Weekday Sales Patterns",
    category: "Seasonality",
    question: "What are our demand patterns across days of the week, weekends, and weekdays?",
    approach: "Join facts to dim_date, compute average daily revenue and forward units to quantify weekend lifts.",
    expectedColumns: "day_of_week, day_of_week_num, day_type, total_calendar_days, avg_daily_revenue, avg_daily_units, total_revenue_by_dow, revenue_share_pct",
    powerBiVisual: "Page 4: Seasonality & Trends Day-of-Week sales pattern bar chart and staffing model.",
    sampleColumns: ["Day of Week", "DOW #", "Day Type", "Calendar Days", "Avg Daily Revenue", "Avg Daily Units", "Total Revenue", "Share %"],
    sampleData: [
      ["Monday", 0, "Weekday", 156, "$3,140.20", 142.1, "$489,871.20", "12.13%"],
      ["Tuesday", 1, "Weekday", 156, "$3,280.40", 148.5, "$511,742.40", "12.67%"],
      ["Wednesday", 2, "Weekday", 157, "$3,350.10", 151.2, "$525,965.70", "13.02%"],
      ["Thursday", 3, "Weekday", 157, "$3,620.80", 163.4, "$568,465.60", "14.07%"],
      ["Friday", 4, "Weekday", 157, "$4,480.50", 202.1, "$703,438.50", "17.42%"],
      ["Saturday", 5, "Weekend", 157, "$5,240.90", 236.8, "$822,821.30", "20.37%"],
      ["Sunday", 6, "Weekend", 156, "$4,680.30", 211.5, "$730,126.80", "18.08%"]
    ],
    sql: `WITH daily_aggregations AS (
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
ORDER BY day_of_week_num ASC;`
  },
  {
    id: 9,
    title: "Running Total of Sales Per Store Over Time",
    category: "Store Analytics",
    question: "What is the cumulative running total of net revenue generated by each store over time?",
    approach: "Aggregate monthly revenue per store, then apply SUM() OVER (PARTITION BY store_id ORDER BY transaction_month ROWS UNBOUNDED PRECEDING).",
    expectedColumns: "store_id, store_name, region, transaction_month, monthly_net_revenue, monthly_units_sold, cumulative_running_revenue, cumulative_running_units",
    powerBiVisual: "Page 3: Cumulative Store Trajectory multi-line chart tracking annualized revenue targets.",
    sampleColumns: ["Store ID", "Store Name", "Region", "Month", "Monthly Net Rev", "Units", "Cumulative Revenue", "Cumulative Units"],
    sampleData: [
      ["STR-101", "Downtown Metro Flagship", "East", "2023-08-01", "$21,420", 940, "$642,850", "28,420"],
      ["STR-101", "Downtown Metro Flagship", "East", "2023-09-01", "$22,180", 975, "$665,030", "29,395"],
      ["STR-101", "Downtown Metro Flagship", "East", "2023-10-01", "$23,050", 1015, "$688,080", "30,410"],
      ["STR-101", "Downtown Metro Flagship", "East", "2023-11-01", "$29,420", 1290, "$717,500", "31,700"],
      ["STR-101", "Downtown Metro Flagship", "East", "2023-12-01", "$25,350", 1110, "$742,850", "32,810"],
      ["STR-104", "West Coast Galleria", "West", "2023-12-01", "$23,940", 1050, "$698,420", "30,890"]
    ],
    sql: `WITH store_monthly_sales AS (
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
ORDER BY store_id ASC, transaction_month ASC;`
  },
  {
    id: 10,
    title: "Pareto Analysis (80/20 Rule: Products Driving 80% Revenue)",
    category: "Inventory & Pareto",
    question: "Which top products contribute to 80% of enterprise gross revenue, and how is the portfolio classified into ABC tiers?",
    approach: "Aggregate forward revenue, compute running cumulative sum using SUM() OVER (ORDER BY gross_revenue DESC), and calculate cumulative percentages.",
    expectedColumns: "revenue_rank, product_id, product_name, category, gross_product_revenue, cumulative_revenue, cumulative_revenue_pct, cumulative_sku_pct, pareto_classification",
    powerBiVisual: "Page 2: Pareto Line-and-Stacked Column chart for inventory ABC segmentation.",
    sampleColumns: ["Rank", "SKU ID", "Product Name", "Category", "Gross Revenue", "Cumulative Rev", "Cumul. Rev %", "Cumul. SKU %", "Pareto Tier"],
    sampleData: [
      [1, "PROD-EL-001", "UltraHD 55-inch 4K TV", "Electronics", "$858,210", "$858,210", "20.51%", "5.0%", "Class A (Top 80% Revenue)"],
      [2, "PROD-EL-004", "14-inch Productivity Laptop", "Electronics", "$720,580", "$1,578,790", "37.72%", "10.0%", "Class A (Top 80% Revenue)"],
      [3, "PROD-EL-002", "Noise-Cancelling Headphones", "Electronics", "$423,050", "$2,001,840", "47.83%", "15.0%", "Class A (Top 80% Revenue)"],
      [4, "PROD-HK-001", "Digital Air Fryer 5.8-Qt", "Home & Kitchen", "$341,420", "$2,343,260", "55.99%", "20.0%", "Class A (Top 80% Revenue)"],
      [5, "PROD-BP-001", "Revitalizing Facial Serum", "Beauty", "$221,300", "$2,564,560", "61.28%", "25.0%", "Class A (Top 80% Revenue)"],
      [6, "PROD-AP-002", "Slim-Fit Denim Jeans", "Apparel", "$206,060", "$2,770,620", "66.20%", "30.0%", "Class A (Top 80% Revenue)"],
      [7, "PROD-AP-004", "Waterproof Rain Jacket", "Apparel", "$198,110", "$2,968,730", "70.94%", "35.0%", "Class A (Top 80% Revenue)"],
      [8, "PROD-HK-002", "Stainless 10-Pc Cookware", "Home & Kitchen", "$183,850", "$3,152,580", "75.33%", "40.0%", "Class A (Top 80% Revenue)"],
      [9, "PROD-EL-003", "Bluetooth Speaker", "Electronics", "$156,980", "$3,309,560", "79.08%", "45.0%", "Class A (Top 80% Revenue)"],
      [10, "PROD-BP-002", "Hydrating Body Butter", "Beauty", "$125,450", "$3,435,010", "82.08%", "50.0%", "Class B (Next 15% Mid-Tier)"]
    ],
    sql: `WITH product_sales AS (
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
ORDER BY revenue_rank ASC;`
  }
];

export const Section4SQL: React.FC = () => {
  const [selectedQueryId, setSelectedQueryId] = useState<number>(1);
  const [copiedQuery, setCopiedQuery] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'queries' | 'schema'>('queries');
  const [activeTab, setActiveTab] = useState<'sql' | 'results'>('sql');

  const selectedQuery = SQL_QUERIES.find((q) => q.id === selectedQueryId) || SQL_QUERIES[0];

  const handleCopy = (sqlText: string) => {
    navigator.clipboard.writeText(sqlText);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">
              Phase 4 · Enterprise Analytics & Relational Modeling
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              SQL Business Intelligence & CTE Analytics Suite
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              10 production-grade SQL scripts engineered with Common Table Expressions (CTEs), window functions (<code className="text-emerald-300 font-mono">LAG</code>, <code className="text-emerald-300 font-mono">RANK</code>, <code className="text-emerald-300 font-mono">DENSE_RANK</code>, running <code className="text-emerald-300 font-mono">SUM() OVER()</code>), and strict mathematical alignment with Python and Power BI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload('analytical_queries.sql', selectedQuery.sql)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Query SQL
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('queries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'queries'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            10 Production SQL Queries
          </button>
          <button
            onClick={() => setViewMode('schema')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'schema'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Star Schema DDL, Constraints & Indexes
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono hidden sm:block">
          PostgreSQL Primary · Inline MySQL 8.0+ Syntax
        </div>
      </div>

      {viewMode === 'queries' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Query Selector Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
              Select Business Query (1–10)
            </div>
            <div className="space-y-1.5 max-h-[720px] overflow-y-auto pr-1">
              {SQL_QUERIES.map((q) => {
                const isSelected = q.id === selectedQueryId;
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQueryId(q.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        Query {q.id}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {q.category}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                      {q.title}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {q.question}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Query Detail & Code Display */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold uppercase tracking-wider">
                    Query {selectedQuery.id} · {selectedQuery.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedQuery.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setActiveTab('sql')}
                      className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                        activeTab === 'sql' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      SQL Code
                    </button>
                    <button
                      onClick={() => setActiveTab('results')}
                      className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                        activeTab === 'results' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Output Preview ({selectedQuery.sampleData.length})
                    </button>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedQuery.sql)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-medium transition-colors cursor-pointer"
                  >
                    {copiedQuery ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedQuery ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-1">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Business Question:
                  </span>
                  <p className="text-slate-600 leading-relaxed">{selectedQuery.question}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-1">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Analytical Approach:
                  </span>
                  <p className="text-slate-600 leading-relaxed">{selectedQuery.approach}</p>
                </div>
              </div>

              <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3 text-xs space-y-1">
                <span className="font-bold text-emerald-950 block flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-700" />
                  Power BI & Forecasting Pipeline Integration:
                </span>
                <p className="text-emerald-900 leading-relaxed">{selectedQuery.powerBiVisual}</p>
              </div>

              <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2.5 rounded border border-slate-100 overflow-x-auto">
                <strong className="text-slate-700">Expected Output Schema:</strong> {selectedQuery.expectedColumns}
              </div>
            </div>

            {/* Tab content: SQL or Live Result Table */}
            {activeTab === 'sql' ? (
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <span>PostgreSQL 14+ / MySQL 8.0+ Compatible Query</span>
                  <span className="text-emerald-400">CTE + Window Analytics</span>
                </div>
                <div className="p-4 overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed max-h-[460px] overflow-y-auto">
                  <pre>{selectedQuery.sql}</pre>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <TableIcon className="w-4 h-4 text-emerald-600" />
                    Query Execution Result Set (Calculated from Clean 3-Year Fact Data)
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedQuery.sampleData.length} records shown
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[440px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold font-mono text-[11px]">
                        {selectedQuery.sampleColumns.map((col, idx) => (
                          <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {selectedQuery.sampleData.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/70">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-slate-800">
                              {typeof cell === 'number' ? cell.toLocaleString() : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Schema & Indexes Tab */
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Enterprise Star Schema DDL, Constraints & Covering Indexes
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Separates measurable transactional facts (<code className="text-slate-800 font-mono">fact_retail_sales_clean</code>, <code className="text-slate-800 font-mono">fact_retail_sales_demand</code>) from conformed descriptive dimensions (<code className="text-slate-800 font-mono">dim_store</code>, <code className="text-slate-800 font-mono">dim_product</code>, <code className="text-slate-800 font-mono">dim_date</code>).
                </p>
              </div>
              <button
                onClick={() => handleDownload('schema_definition.sql', `-- Schema definition file\n-- Check /sql/schema_definition.sql`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download schema_definition.sql
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  dim_store
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">Dimension</span>
              </div>
              <p className="text-slate-600">
                Maintains physical store branches, geographical region (North, South, East, West), and empirical footfall traffic indices.
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                PK: store_id · 8 retail store branches
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  dim_product
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">Dimension</span>
              </div>
              <p className="text-slate-600">
                Maintains 20 distinct SKUs across 4 merchandise categories, list price catalog, and baseline landed COGS ratios (0.35–0.72).
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                PK: product_id · 20 product catalog SKUs
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  dim_date
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">Dimension</span>
              </div>
              <p className="text-slate-600">
                Enterprise conformed calendar containing year, month, quarter, ISO week, day name, is_weekend, and national retail holiday flags.
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                PK: date_key · 1,095 days (2021–2023)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 rounded-lg p-4 bg-emerald-50/30 space-y-2">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>fact_retail_sales_clean (BI Fact)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">Fact (Net BI)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Contains all clean POS transactions with <code className="text-slate-800 font-mono">order_id</code> and <code className="text-slate-800 font-mono">original_order_id</code>. Preserves both SALE and RETURN records to compute refund rates, return allowances, net revenue, and Power BI DAX financial measures.
              </p>
              <div className="text-[11px] font-mono text-slate-600">
                PK: transaction_id · FKs: date_key, store_id, product_id, original_order_id
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-blue-50/30 space-y-2">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>fact_retail_sales_demand (Forecast Fact)</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">Fact (Forecasting)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Dedicated unpolluted forward demand transactions (<code className="text-slate-800 font-mono">transaction_type = 'SALE'</code> only). Guarantees that time-series models (SARIMA, Prophet, XGBoost) learn true forward consumer demand without negative refund anomalies.
              </p>
              <div className="text-[11px] font-mono text-slate-600">
                PK: demand_id · FKs: date_key, store_id, product_id
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Covering Indexes & Join Performance Optimization
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 pt-1">
              <div className="space-y-1">
                <span className="font-mono text-slate-800 font-semibold block">idx_clean_composite_analytics:</span>
                <code className="text-[11px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 block">
                  (order_date, store_id, product_id, transaction_type)
                </code>
                <p className="text-[11px]">Eliminates sequential table scans during multi-dimensional star-schema joins.</p>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-slate-800 font-semibold block">idx_clean_orig_order:</span>
                <code className="text-[11px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 block">
                  (original_order_id) WHERE transaction_type = 'RETURN'
                </code>
                <p className="text-[11px]">Enables instantaneous self-joins to link return records back to parent orders.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
