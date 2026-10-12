/**
 * Production-ready Python code scripts for Section 2 (Final Refinement).
 */

export const PYTHON_GENERATOR_SCRIPT = `"""
Retail Sales Dataset Generator
==============================
Generates a realistic 3-year daily POS transaction dataset with explicit
product master unit economics (unit_price & unit_cost), forward SALES,
realistic customer RETURNS, seasonal trends, and controlled anomaly injection.
"""

import os
import random
from datetime import datetime
import numpy as np
import pandas as pd

def get_product_master() -> list[dict]:
    """Returns product master catalog with list price, COGS %, unit cost, and baseline return rate."""
    catalog = [
        # Electronics
        {"product_id": "PROD-EL-001", "product_name": "UltraHD 55-inch 4K Smart TV", "category": "Electronics", "sub_category": "Televisions", "unit_price": 499.99, "cogs_pct": 0.68, "return_rate": 0.025},
        {"product_id": "PROD-EL-002", "product_name": "Noise-Cancelling Wireless Headphones", "category": "Electronics", "sub_category": "Audio", "unit_price": 199.99, "cogs_pct": 0.52, "return_rate": 0.030},
        {"product_id": "PROD-EL-003", "product_name": "Bluetooth Portable Speaker", "category": "Electronics", "sub_category": "Audio", "unit_price": 79.99, "cogs_pct": 0.48, "return_rate": 0.020},
        {"product_id": "PROD-EL-004", "product_name": "14-inch Productivity Laptop", "category": "Electronics", "sub_category": "Computers", "unit_price": 799.99, "cogs_pct": 0.72, "return_rate": 0.028},
        {"product_id": "PROD-EL-005", "product_name": "Ergonomic Wireless Mouse", "category": "Electronics", "sub_category": "Accessories", "unit_price": 29.99, "cogs_pct": 0.40, "return_rate": 0.015},

        # Apparel
        {"product_id": "PROD-AP-001", "product_name": "Classic Crewneck Cotton T-Shirt", "category": "Apparel", "sub_category": "Tops", "unit_price": 24.50, "cogs_pct": 0.35, "return_rate": 0.055},
        {"product_id": "PROD-AP-002", "product_name": "Slim-Fit Denim Jeans", "category": "Apparel", "sub_category": "Bottoms", "unit_price": 68.00, "cogs_pct": 0.38, "return_rate": 0.065},
        {"product_id": "PROD-AP-003", "product_name": "Weatherproof Parka Jacket", "category": "Apparel", "sub_category": "Outerwear", "unit_price": 149.00, "cogs_pct": 0.45, "return_rate": 0.045},
        {"product_id": "PROD-AP-004", "product_name": "Performance Athletic Shorts", "category": "Apparel", "sub_category": "Activewear", "unit_price": 36.00, "cogs_pct": 0.32, "return_rate": 0.040},
        {"product_id": "PROD-AP-005", "product_name": "Merino Wool Winter Scarf", "category": "Apparel", "sub_category": "Accessories", "unit_price": 39.50, "cogs_pct": 0.30, "return_rate": 0.025},

        # Home & Kitchen
        {"product_id": "PROD-HK-001", "product_name": "12-Cup Programmable Coffee Maker", "category": "Home & Kitchen", "sub_category": "Appliances", "unit_price": 89.99, "cogs_pct": 0.55, "return_rate": 0.035},
        {"product_id": "PROD-HK-002", "product_name": "Non-Stick Cookware Set (10-Piece)", "category": "Home & Kitchen", "sub_category": "Cookware", "unit_price": 129.99, "cogs_pct": 0.50, "return_rate": 0.025},
        {"product_id": "PROD-HK-003", "product_name": "Memory Foam Queen Bed Pillow", "category": "Home & Kitchen", "sub_category": "Bedding", "unit_price": 45.00, "cogs_pct": 0.40, "return_rate": 0.030},
        {"product_id": "PROD-HK-004", "product_name": "Stainless Steel Kitchen Knife Set", "category": "Home & Kitchen", "sub_category": "Cutlery", "unit_price": 59.99, "cogs_pct": 0.42, "return_rate": 0.015},
        {"product_id": "PROD-HK-005", "product_name": "Ceramic Essential Oil Diffuser", "category": "Home & Kitchen", "sub_category": "Decor", "unit_price": 34.00, "cogs_pct": 0.36, "return_rate": 0.020},

        # Beauty & Personal Care
        {"product_id": "PROD-BP-001", "product_name": "Hydrating Facial Cleanser (200ml)", "category": "Beauty & Personal Care", "sub_category": "Skincare", "unit_price": 18.50, "cogs_pct": 0.28, "return_rate": 0.010},
        {"product_id": "PROD-BP-002", "product_name": "Botanical Nourishing Shampoo", "category": "Beauty & Personal Care", "sub_category": "Haircare", "unit_price": 22.00, "cogs_pct": 0.30, "return_rate": 0.012},
        {"product_id": "PROD-BP-003", "product_name": "Sonic Electric Toothbrush", "category": "Beauty & Personal Care", "sub_category": "Dental Care", "unit_price": 64.99, "cogs_pct": 0.45, "return_rate": 0.020},
        {"product_id": "PROD-BP-004", "product_name": "Eau de Parfum Spray (50ml)", "category": "Beauty & Personal Care", "sub_category": "Fragrance", "unit_price": 85.00, "cogs_pct": 0.22, "return_rate": 0.015},
        {"product_id": "PROD-BP-005", "product_name": "SPF 50 Mineral Sunscreen (100ml)", "category": "Beauty & Personal Care", "sub_category": "Skincare", "unit_price": 26.00, "cogs_pct": 0.25, "return_rate": 0.008},
    ]
    for p in catalog:
        p["unit_cost"] = round(p["unit_price"] * p["cogs_pct"], 2)
    return catalog

def get_store_network() -> list[dict]:
    """Returns store locations and traffic indices."""
    return [
        {"store_id": "STR-101", "store_name": "Downtown Metro Flagship", "region": "East", "traffic_factor": 1.45},
        {"store_id": "STR-102", "store_name": "Suburban Galleria Mall", "region": "East", "traffic_factor": 1.15},
        {"store_id": "STR-201", "store_name": "Pacific Coast Superstore", "region": "West", "traffic_factor": 1.35},
        {"store_id": "STR-202", "store_name": "Silicon Valley Outlet", "region": "West", "traffic_factor": 1.20},
        {"store_id": "STR-301", "store_name": "Midwest Commerce Plaza", "region": "North", "traffic_factor": 0.95},
        {"store_id": "STR-302", "store_name": "Great Lakes City Center", "region": "North", "traffic_factor": 1.05},
        {"store_id": "STR-401", "store_name": "Sunbelt Retail Commons", "region": "South", "traffic_factor": 1.10},
        {"store_id": "STR-402", "store_name": "Gulf Coast Town Center", "region": "South", "traffic_factor": 0.90},
    ]

def identify_holiday(dt: datetime) -> tuple[int, str]:
    """Flags calendar holiday dates."""
    month, day = dt.month, dt.day
    if month == 1 and day == 1:
        return 1, "New Year's Day"
    if month == 2 and day == 14:
        return 1, "Valentine's Day"
    if month == 5 and dt.weekday() == 0 and day >= 25:
        return 1, "Memorial Day"
    if month == 7 and day == 4:
        return 1, "Independence Day"
    if month == 9 and dt.weekday() == 0 and day <= 7:
        return 1, "Labor Day"
    if month == 10 and day == 31:
        return 1, "Halloween"
    if month == 11 and dt.weekday() == 3 and 22 <= day <= 28:
        return 1, "Thanksgiving"
    if month == 11 and dt.weekday() == 4 and 23 <= day <= 29:
        return 1, "Black Friday"
    if month == 11 and dt.weekday() == 0 and 26 <= day <= 30:
        return 1, "Cyber Monday"
    if month == 12 and day in (24, 25):
        return 1, "Christmas Holiday"
    if month == 12 and day == 31:
        return 1, "New Year's Eve"
    return 0, ""

def generate_synthetic_retail_data(
    start_date: str = "2021-01-01",
    end_date: str = "2023-12-31",
    inject_dirty_records: bool = True,
    seed: int = 42
) -> pd.DataFrame:
    """Generates 3 years of daily transactions with sales, returns, and realistic retail dynamics."""
    np.random.seed(seed)
    random.seed(seed)

    products = get_product_master()
    stores = get_store_network()
    date_range = pd.date_range(start=start_date, end=end_date, freq="D")
    records = []

    print(f"Generating retail transactions from {start_date} to {end_date}...")

    for current_date in date_range:
        dt = current_date.to_pydatetime()
        day_of_year = dt.timetuple().tm_yday
        day_of_week = dt.weekday()
        year = dt.year

        year_multiplier = 1.0 + (year - 2021) * 0.075
        dow_weights = [0.85, 0.90, 0.92, 1.00, 1.25, 1.45, 1.30]
        dow_factor = dow_weights[day_of_week]

        annual_cycle = 1.0 + 0.15 * np.sin(2 * np.pi * (day_of_year - 80) / 365.25)
        if dt.month in (11, 12):
            annual_cycle += 0.35 if dt.month == 11 else 0.45

        is_holiday, holiday_name = identify_holiday(dt)
        holiday_mult = 1.65 if (holiday_name in ["Black Friday", "Cyber Monday"]) else (1.30 if is_holiday else 1.0)

        for store in stores:
            for product in products:
                base_promo_prob = 0.30 if (dt.month in (11, 12) or is_holiday) else (0.18 if day_of_week in (4, 5, 6) else 0.12)
                is_promo = 1 if np.random.rand() < base_promo_prob else 0
                discount = round(np.random.choice([0.10, 0.15, 0.20, 0.30], p=[0.40, 0.30, 0.20, 0.10]), 2) if is_promo else 0.0

                base_lambda = {
                    "Electronics": 2.5,
                    "Apparel": 6.0,
                    "Home & Kitchen": 3.5,
                    "Beauty & Personal Care": 7.0
                }.get(product["category"], 4.0)

                promo_multiplier = 1.0 + (discount * 2.2) if is_promo else 1.0

                expected_units = (
                    base_lambda
                    * store["traffic_factor"]
                    * year_multiplier
                    * dow_factor
                    * annual_cycle
                    * holiday_mult
                    * promo_multiplier
                )

                units_sold = int(np.random.poisson(max(expected_units, 0.5)))
                if units_sold == 0 and np.random.rand() < 0.20:
                    units_sold = 1

                unit_price = product["unit_price"]
                if year == 2022:
                    unit_price = round(unit_price * 1.03, 2)
                elif year == 2023:
                    unit_price = round(unit_price * 1.06, 2)

                unit_cost = round(unit_price * product["cogs_pct"], 2)
                revenue = round(units_sold * unit_price * (1.0 - discount), 2)
                sale_order_id = f"ORD-{year}-{len(records) + 1:07d}"

                # 1. Forward SALE record
                records.append({
                    "order_id": sale_order_id,
                    "original_order_id": None,
                    "order_date": dt.strftime("%Y-%m-%d"),
                    "store_id": store["store_id"],
                    "store_name": store["store_name"],
                    "region": store["region"],
                    "product_id": product["product_id"],
                    "product_name": product["product_name"],
                    "category": product["category"],
                    "sub_category": product["sub_category"],
                    "transaction_type": "SALE",
                    "units_sold": units_sold,
                    "unit_price": unit_price,
                    "unit_cost": unit_cost,
                    "discount": discount,
                    "revenue": revenue,
                    "profit": profit,
                    "promotion_flag": is_promo,
                    "holiday_flag": is_holiday,
                })

                # 2. RETURN record: links back to original sale transaction via original_order_id
                if np.random.rand() < product["return_rate"]:
                    return_units = min(units_sold, np.random.randint(1, 3))
                    refund_rev = -round(return_units * unit_price, 2)
                    cost_rev = -round(return_units * unit_cost, 2)
                    refund_profit = round(refund_rev - cost_rev, 2)
                    ret_order_id = f"RET-{year}-{len(records) + 1:07d}"

                    records.append({
                        "order_id": ret_order_id,
                        "original_order_id": sale_order_id, # Exact link back to parent transaction
                        "order_date": dt.strftime("%Y-%m-%d"),
                        "store_id": store["store_id"],
                        "store_name": store["store_name"],
                        "region": store["region"],
                        "product_id": product["product_id"],
                        "product_name": product["product_name"],
                        "category": product["category"],
                        "sub_category": product["sub_category"],
                        "transaction_type": "RETURN",
                        "units_sold": -return_units,
                        "unit_price": unit_price,
                        "unit_cost": unit_cost,
                        "discount": 0.0,
                        "revenue": refund_rev,
                        "profit": refund_profit,
                        "promotion_flag": is_promo,
                        "holiday_flag": is_holiday,
                    })

    df = pd.DataFrame(records)

    if inject_dirty_records:
        df = inject_synthetic_dirty_data(df)

    return df

def inject_synthetic_dirty_data(df: pd.DataFrame) -> pd.DataFrame:
    """Injects duplicate rows, corrupt dates, and null dimension fields to test pipeline."""
    dirty_df = df.copy()
    n_rows = len(dirty_df)

    # 1. Duplicate rows
    dup_indices = np.random.choice(n_rows, size=int(n_rows * 0.002), replace=False)
    dirty_df = pd.concat([dirty_df, dirty_df.iloc[dup_indices]], ignore_index=True)

    # 2. Corrupt date strings
    bad_dates = np.random.choice(n_rows, size=min(12, n_rows), replace=False)
    dirty_df.loc[bad_dates, "order_date"] = "2022-13-45"

    # 3. Missing non-critical metadata
    null_store = np.random.choice(n_rows, size=int(n_rows * 0.001), replace=False)
    dirty_df.loc[null_store, "store_name"] = None

    return dirty_df

if __name__ == "__main__":
    os.makedirs("data/raw", exist_ok=True)
    raw = generate_synthetic_retail_data()
    raw.to_csv("data/raw/retail_sales_raw.csv", index=False)
    print("Raw dataset generated successfully.")
`;

export const PYTHON_CLEANING_SCRIPT = `"""
Retail Sales Data Cleaning, Feature Engineering & Time-Series Evaluation Pipeline
==================================================================================
Production-quality modular pipeline incorporating:
1. Preservation and modeling of RETURN transactions (transaction_type: SALE vs RETURN).
2. Separate demand-only dataset extraction (SALE only) for unpolluted forecasting.
3. Explicit profit re-computation via revenue - (units_sold * unit_cost).
4. Vectorized pandas .map() lookup for unit_cost from Product Master.
5. Profit margin calculated only for SALE rows with revenue > 0 (set to NaN for RETURN).
6. Strict assertion that discount is bounded in [0, 1] with return discounts forced to 0.0.
7. Rolling-origin cross-validation with fold-isolated MASE calculation.
8. Leakage-free XGBoost lag & rolling feature engineering (.shift(1), min_periods=7).
9. Automated audit export to data/processed/data_quality_report.json.
"""

import os
import sys
import json
import logging
from typing import Generator
import numpy as np
import pandas as pd

# Configure structured production logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("RetailCleaningPipeline")


# ==============================================================================
# 1. PRODUCT & STORE MASTER METADATA
# ==============================================================================
PRODUCT_MASTER = {
    "PROD-EL-001": {"unit_cost_ratio": 0.68, "category": "Electronics", "sub_category": "Televisions"},
    "PROD-EL-002": {"unit_cost_ratio": 0.52, "category": "Electronics", "sub_category": "Audio"},
    "PROD-EL-003": {"unit_cost_ratio": 0.48, "category": "Electronics", "sub_category": "Audio"},
    "PROD-EL-004": {"unit_cost_ratio": 0.72, "category": "Electronics", "sub_category": "Computers"},
    "PROD-EL-005": {"unit_cost_ratio": 0.40, "category": "Electronics", "sub_category": "Accessories"},
    "PROD-AP-001": {"unit_cost_ratio": 0.35, "category": "Apparel", "sub_category": "Tops"},
    "PROD-AP-002": {"unit_cost_ratio": 0.38, "category": "Apparel", "sub_category": "Bottoms"},
    "PROD-AP-003": {"unit_cost_ratio": 0.45, "category": "Apparel", "sub_category": "Outerwear"},
    "PROD-AP-004": {"unit_cost_ratio": 0.32, "category": "Apparel", "sub_category": "Activewear"},
    "PROD-AP-005": {"unit_cost_ratio": 0.30, "category": "Apparel", "sub_category": "Accessories"},
    "PROD-HK-001": {"unit_cost_ratio": 0.55, "category": "Home & Kitchen", "sub_category": "Appliances"},
    "PROD-HK-002": {"unit_cost_ratio": 0.50, "category": "Home & Kitchen", "sub_category": "Cookware"},
    "PROD-HK-003": {"unit_cost_ratio": 0.40, "category": "Home & Kitchen", "sub_category": "Bedding"},
    "PROD-HK-004": {"unit_cost_ratio": 0.42, "category": "Home & Kitchen", "sub_category": "Cutlery"},
    "PROD-HK-005": {"unit_cost_ratio": 0.36, "category": "Home & Kitchen", "sub_category": "Decor"},
    "PROD-BP-001": {"unit_cost_ratio": 0.28, "category": "Beauty & Personal Care", "sub_category": "Skincare"},
    "PROD-BP-002": {"unit_cost_ratio": 0.30, "category": "Beauty & Personal Care", "sub_category": "Haircare"},
    "PROD-BP-003": {"unit_cost_ratio": 0.45, "category": "Beauty & Personal Care", "sub_category": "Dental Care"},
    "PROD-BP-004": {"unit_cost_ratio": 0.22, "category": "Beauty & Personal Care", "sub_category": "Fragrance"},
    "PROD-BP-005": {"unit_cost_ratio": 0.25, "category": "Beauty & Personal Care", "sub_category": "Skincare"},
}

STORE_MASTER = {
    "STR-101": ("Downtown Metro Flagship", "East"),
    "STR-102": ("Suburban Galleria Mall", "East"),
    "STR-201": ("Pacific Coast Superstore", "West"),
    "STR-202": ("Silicon Valley Outlet", "West"),
    "STR-301": ("Midwest Commerce Plaza", "North"),
    "STR-302": ("Great Lakes City Center", "North"),
    "STR-401": ("Sunbelt Retail Commons", "South"),
    "STR-402": ("Gulf Coast Town Center", "South"),
}


# ==============================================================================
# 2. INGESTION, AUDIT & CLEANING PIPELINE
# ==============================================================================
def load_and_audit_raw(filepath: str) -> tuple[pd.DataFrame, dict]:
    """Loads raw transaction CSV and computes diagnostic metrics."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Source file not found at: {filepath}")

    logger.info(f"Ingesting raw transaction feed from: {filepath}")
    df = pd.read_csv(filepath, low_memory=False)

    audit = {
        "raw_rows": len(df),
        "duplicates": int(df.duplicated().sum()),
        "null_units": int(df["units_sold"].isna().sum()) if "units_sold" in df.columns else 0,
        "null_revenue": int(df["revenue"].isna().sum()) if "revenue" in df.columns else 0,
    }
    logger.info(f"Raw shape: {df.shape[0]:,} rows x {df.shape[1]} cols | Ingested duplicates: {audit['duplicates']:,}")
    return df, audit


def clean_retail_data(df_raw: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Cleans raw retail transaction records with returns modeling and vectorization:
    - Parses dates (purging corrupted values).
    - Removes duplicate transactions.
    - Preserves RETURN transactions while enforcing sign rules.
    - Forces discount to 0.0 on RETURN transactions.
    - Vectorized map for unit_cost from Product Master.
    - Recomputes revenue and profit explicitly using unit_cost.
    - Computes profit_margin only for SALE transactions (np.nan for RETURN).
    - Returns cleaned DataFrame and detailed metrics dictionary for quality reporting.
    """
    df = df_raw.copy()
    initial_rows = len(df)

    # 1. Parse dates (drop unparseable format anomalies)
    parsed_dates = pd.to_datetime(df["order_date"], errors="coerce", format="%Y-%m-%d")
    invalid_date_mask = parsed_dates.isna()
    invalid_dates_removed = int(invalid_date_mask.sum())
    if invalid_dates_removed > 0:
        logger.warning(f"Purging {invalid_dates_removed:,} corrupted date rows.")
        df = df[~invalid_date_mask].copy()
        df["order_date"] = parsed_dates[~invalid_date_mask]
    else:
        df["order_date"] = parsed_dates

    # 2. Deduplicate
    pre_dedup_len = len(df)
    df = df.drop_duplicates().copy()
    duplicates_removed = pre_dedup_len - len(df)
    logger.info(f"Deduplication complete: {duplicates_removed:,} redundant rows purged.")

    # 3. Ensure transaction_type column exists
    if "transaction_type" not in df.columns:
        df["transaction_type"] = np.where(df["units_sold"] < 0, "RETURN", "SALE")

    # 4. Filter invalid logical signs and corrupt zero-price rows:
    # unit_price > 0, SALE must have units_sold > 0, RETURN must have units_sold < 0
    pre_sign_len = len(df)
    valid_mask = (
        df["unit_price"].notna() & (df["unit_price"] > 0) &
        (
            ((df["transaction_type"] == "SALE") & (df["units_sold"] > 0)) |
            ((df["transaction_type"] == "RETURN") & (df["units_sold"] < 0))
        )
    )
    df = df[valid_mask].copy()
    invalid_sign_rows_removed = pre_sign_len - len(df)
    if invalid_sign_rows_removed > 0:
        logger.warning(f"Purged {invalid_sign_rows_removed:,} corrupt rows violating transaction rules.")

    # 5. Impute store metadata
    if df["store_name"].isna().any() or df["region"].isna().any():
        for sid, (sname, reg) in STORE_MASTER.items():
            mask = df["store_id"] == sid
            df.loc[mask & df["store_name"].isna(), "store_name"] = sname
            df.loc[mask & df["region"].isna(), "region"] = reg

    # 6. Vectorized map for unit_cost from Product Master (Fast & Scalable)
    cost_ratio_map = {pid: meta["unit_cost_ratio"] for pid, meta in PRODUCT_MASTER.items()}
    if "unit_cost" not in df.columns or df["unit_cost"].isna().any():
        cost_ratios = df["product_id"].map(cost_ratio_map).fillna(0.50).astype(np.float32)
        df["unit_cost"] = (df["unit_price"] * cost_ratios).round(2).astype(np.float32)
    else:
        df["unit_cost"] = df["unit_cost"].round(2).astype(np.float32)

    # 7. Discount handling:
    # Fill nulls with 0.0, ensure bounded between [0, 1]
    df["discount"] = df["discount"].fillna(0.0).astype(np.float32)
    # Retail Refund Rule: For RETURN transactions, discount is set to 0.0
    return_mask = df["transaction_type"] == "RETURN"
    df.loc[return_mask, "discount"] = 0.0

    df["promotion_flag"] = df["promotion_flag"].fillna(0).astype(np.int8)
    df["holiday_flag"] = df["holiday_flag"].fillna(0).astype(np.int8)

    # 8. Explicit recomputation of revenue and profit
    # SALE: revenue = units * price * (1 - discount), cost = units * unit_cost, profit = revenue - cost
    # RETURN: revenue = units * price (negative), cost = units * unit_cost (negative), profit = revenue - cost
    df["revenue"] = (df["units_sold"] * df["unit_price"] * (1.0 - df["discount"])).round(2).astype(np.float32)
    total_cost = (df["units_sold"] * df["unit_cost"]).round(2)
    df["profit"] = (df["revenue"] - total_cost).round(2).astype(np.float32)

    # 9. Profit Margin: Calculate ONLY for SALE transactions with revenue > 0; set to NaN for returns
    df["profit_margin"] = np.where(
        (df["transaction_type"] == "SALE") & (df["revenue"] > 0),
        (df["profit"] / df["revenue"]).round(4),
        np.nan
    ).astype(np.float32)

    # 10. Derived calendar attributes
    dt = df["order_date"].dt
    df["year"] = dt.year.astype(np.int16)
    df["month"] = dt.month.astype(np.int8)
    df["quarter"] = dt.quarter.astype(np.int8)
    df["week"] = dt.isocalendar().week.astype(np.int8)
    df["day_of_week"] = dt.day_name().astype("category")
    df["day_of_week_num"] = dt.dayofweek.astype(np.int8)
    df["is_weekend"] = df["day_of_week_num"].isin([5, 6]).astype(np.int8)

    # Cast high-cardinality category columns
    for col in ["store_id", "region", "product_id", "category", "sub_category", "transaction_type"]:
        df[col] = df[col].astype("category")

    sale_count = int((df["transaction_type"] == "SALE").sum())
    return_count = int((df["transaction_type"] == "RETURN").sum())
    gross_rev = float(df.loc[df["transaction_type"] == "SALE", "revenue"].sum())
    return_rev = float(df.loc[df["transaction_type"] == "RETURN", "revenue"].abs().sum())
    net_rev = float(df["revenue"].sum())
    net_profit = float(df["profit"].sum())

    quality_metrics = {
        "raw_rows": initial_rows,
        "duplicates_removed": duplicates_removed,
        "invalid_dates_removed": invalid_dates_removed,
        "invalid_sign_rows_removed": invalid_sign_rows_removed,
        "total_rows_dropped": initial_rows - len(df),
        "final_rows": len(df),
        "sale_count": sale_count,
        "return_count": return_count,
        "gross_revenue": round(gross_rev, 2),
        "return_revenue": round(return_rev, 2),
        "net_revenue": round(net_rev, 2),
        "net_profit": round(net_profit, 2),
        "return_rate_pct": round((return_rev / gross_rev * 100), 2) if gross_rev > 0 else 0.0,
    }

    logger.info(f"Cleaned dataset ready: {len(df):,} rows (SALE: {sale_count:,} | RETURN: {return_count:,}).")
    return df, quality_metrics


def extract_demand_dataframe(clean_df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts an unpolluted demand-only dataset for time-series forecasting.
    Excludes all customer RETURN rows so negative volumes do not distort demand modeling.
    """
    logger.info("Extracting pure demand-only dataset for time-series forecasting (SALE only)...")
    demand_df = clean_df[clean_df["transaction_type"] == "SALE"].copy()
    assert (demand_df["units_sold"] > 0).all(), "Fatal: Demand dataframe contains non-positive units_sold!"
    assert (demand_df["revenue"] > 0).all(), "Fatal: Demand dataframe contains non-positive revenue!"
    logger.info(f"Demand-only dataset generated: {demand_df.shape[0]:,} records.")
    return demand_df


# ==============================================================================
# 3. FORECAST ACCURACY EVALUATION (MAE, RMSE, MAPE, WAPE, MASE)
# ==============================================================================
def calculate_forecast_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_train_fold: np.ndarray | None = None,
    seasonality: int = 7
) -> dict[str, float]:
    """
    Computes standard retail forecast accuracy metrics.
    MASE is calculated using ONLY the training series of the specific fold to prevent leakage.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    errors = y_true - y_pred
    abs_errors = np.abs(errors)

    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))

    # WAPE = sum(|actual - forecast|) / sum(actual)
    total_actual = np.sum(y_true)
    wape = float(np.sum(abs_errors) / total_actual) if total_actual > 0 else 0.0

    # MAPE (safeguarded against zero-sales days)
    non_zero = y_true > 0
    mape = float(np.mean(abs_errors[non_zero] / y_true[non_zero])) * 100.0 if non_zero.sum() > 0 else 0.0

    # MASE = MAE / in_sample_seasonal_naive_MAE (computed strictly from fold training series)
    if y_train_fold is not None and len(y_train_fold) > seasonality:
        naive_abs_diff = np.abs(y_train_fold[seasonality:] - y_train_fold[:-seasonality])
        naive_mae = np.mean(naive_abs_diff)
        mase = float(mae / naive_mae) if naive_mae > 0 else 1.0
    else:
        mase = 1.0

    return {
        "MAE": round(mae, 2),
        "RMSE": round(rmse, 2),
        "WAPE": round(wape, 4),
        "MAPE": round(mape, 2),
        "MASE": round(mase, 4),
    }


# ==============================================================================
# 4. ROLLING-ORIGIN TIME-SERIES CROSS-VALIDATION
# ==============================================================================
class RollingOriginTimeSeriesCV:
    """
    Expanding-window rolling-origin cross-validation engine.
    Preserves strict temporal causality without future look-ahead leakage.
    """
    def __init__(
        self,
        dates: pd.Series,
        initial_train_days: int = 540,
        test_horizon_days: int = 30,
        step_days: int = 30
    ):
        self.dates = pd.to_datetime(dates).sort_values().drop_duplicates().reset_index(drop=True)
        self.initial_train_days = initial_train_days
        self.test_horizon_days = test_horizon_days
        self.step_days = step_days

    def split(self) -> Generator[tuple[pd.Timestamp, pd.Timestamp, pd.Timestamp], None, None]:
        """Yields (train_start, train_end, test_end) for each rolling fold."""
        total_days = len(self.dates)
        curr_train_end_idx = self.initial_train_days

        while curr_train_end_idx + self.test_horizon_days <= total_days:
            train_start = self.dates.iloc[0]
            train_end = self.dates.iloc[curr_train_end_idx - 1]
            test_end = self.dates.iloc[curr_train_end_idx + self.test_horizon_days - 1]

            yield train_start, train_end, test_end
            curr_train_end_idx += self.step_days


# ==============================================================================
# 5. LEAKAGE-FREE XGBOOST FEATURE ENGINEERING
# ==============================================================================
def build_xgboost_features(daily_df: pd.DataFrame, target_col: str = "units_sold") -> pd.DataFrame:
    """
    Constructs tabular feature matrix strictly free of target leakage:
    - Target lags use shift(k), k >= 1.
    - Rolling window statistics use min_periods=7 and are computed on .shift(1).
    - Unstable burn-in rows with nulls in critical lag/rolling features are dropped.
    """
    logger.info("Constructing leakage-free XGBoost lag and rolling feature matrix...")
    df = daily_df.sort_values("order_date").copy()

    # 1. Target Lags (Strictly past historical demand)
    df["target_lag_1"] = df[target_col].shift(1)
    df["target_lag_2"] = df[target_col].shift(2)
    df["target_lag_7"] = df[target_col].shift(7)
    df["target_lag_14"] = df[target_col].shift(14)
    df["target_lag_28"] = df[target_col].shift(28)
    df["target_lag_364"] = df[target_col].shift(364)

    # 2. Rolling Aggregates (Computed on shifted target with min_periods=7)
    shifted_target = df[target_col].shift(1)
    df["rolling_mean_7"] = shifted_target.rolling(window=7, min_periods=7).mean()
    df["rolling_std_7"] = shifted_target.rolling(window=7, min_periods=7).std()
    df["rolling_mean_30"] = shifted_target.rolling(window=30, min_periods=7).mean()
    df["rolling_std_30"] = shifted_target.rolling(window=30, min_periods=7).std()
    df["rolling_min_7"] = shifted_target.rolling(window=7, min_periods=7).min()
    df["rolling_max_7"] = shifted_target.rolling(window=7, min_periods=7).max()

    # 3. Calendar & Temporal Features (Known for prediction day t)
    dt = pd.to_datetime(df["order_date"]).dt
    df["cal_month"] = dt.month
    df["cal_day_of_week"] = dt.dayofweek
    df["cal_is_weekend"] = df["cal_day_of_week"].isin([5, 6]).astype(int)
    df["cal_quarter"] = dt.quarter
    df["cal_day_of_year"] = dt.dayofyear

    df["sin_day_of_year"] = np.sin(2 * np.pi * df["cal_day_of_year"] / 365.25)
    df["cos_day_of_year"] = np.cos(2 * np.pi * df["cal_day_of_year"] / 365.25)

    # 4. Planned Exogenous Indicators (Planned before order date)
    if "promotion_flag" in df.columns:
        df["planned_promo"] = df["promotion_flag"].astype(int)
    if "holiday_flag" in df.columns:
        df["planned_holiday"] = df["holiday_flag"].astype(int)

    # Drop burn-in rows with nulls in critical lag/rolling features (e.g. first 30 days)
    df = df.dropna(subset=["rolling_mean_30", "target_lag_28"]).reset_index(drop=True)
    logger.info(f"Leakage-free feature matrix built: {df.shape[1]} columns, {len(df):,} valid rows.")
    return df


# ==============================================================================
# 6. PRODUCTION INTEGRITY ASSERTIONS
# ==============================================================================
def assert_data_integrity(clean_df: pd.DataFrame, demand_df: pd.DataFrame) -> None:
    """
    Automated assertions validating data hygiene, returns modeling, and accounting formulas.
    """
    logger.info("Executing automated production data integrity assertions...")

    # A. Cleaned BI dataset integrity
    assert len(clean_df) > 0, "Assertion Error: Cleaned dataset contains 0 records!"
    assert clean_df["order_date"].isna().sum() == 0, "Assertion Error: NaT values in order_date!"
    assert set(clean_df["transaction_type"].unique()).issubset({"SALE", "RETURN"}), "Invalid transaction_type!"
    assert (clean_df["unit_cost"] > 0).all(), "Assertion Error: Non-positive unit_cost detected!"
    assert clean_df["discount"].between(0.0, 1.0).all(), "Assertion Error: Discount outside [0, 1]!"

    # Mathematical consistency: profit == revenue - (units_sold * unit_cost)
    expected_profit = (clean_df["revenue"] - (clean_df["units_sold"] * clean_df["unit_cost"])).round(2)
    max_profit_diff = np.abs(clean_df["profit"] - expected_profit).max()
    assert max_profit_diff <= 0.05, f"Assertion Error: Profit discrepancy of {max_profit_diff} found!"

    # Returns invariants: units_sold < 0, revenue <= 0, discount == 0, profit_margin is NaN
    return_mask = clean_df["transaction_type"] == "RETURN"
    if return_mask.sum() > 0:
        assert (clean_df.loc[return_mask, "units_sold"] < 0).all(), "Return records must have negative units_sold!"
        assert (clean_df.loc[return_mask, "revenue"] <= 0).all(), "Return records must have negative revenue!"
        assert (clean_df.loc[return_mask, "discount"] == 0.0).all(), "Return records must have 0.0 discount!"
        assert clean_df.loc[return_mask, "profit_margin"].isna().all(), "Return records must have NaN profit_margin!"

    # Sales invariants: units_sold > 0, revenue > 0, profit_margin is not NaN
    sale_mask = clean_df["transaction_type"] == "SALE"
    assert clean_df.loc[sale_mask, "profit_margin"].notna().all(), "Sale records must have non-null profit_margin!"

    # B. Demand dataset integrity (Strictly SALE only)
    assert (demand_df["transaction_type"] == "SALE").all(), "Demand dataframe contains RETURN transactions!"
    assert (demand_df["units_sold"] > 0).all(), "Demand dataframe contains non-positive units_sold!"
    assert (demand_df["revenue"] > 0).all(), "Demand dataframe contains non-positive revenue!"

    logger.info(">>> ALL PRODUCTION INTEGRITY ASSERTIONS PASSED (100% VERIFIED) <<<")


# ==============================================================================
# 7. MAIN ORCHESTRATION PIPELINE
# ==============================================================================
def run_cleaning_pipeline(
    raw_csv_path: str = "data/raw/retail_sales_raw.csv",
    clean_csv_path: str = "data/processed/retail_sales_clean.csv",
    demand_csv_path: str = "data/processed/retail_sales_demand.csv",
    report_json_path: str = "data/processed/data_quality_report.json"
) -> tuple[pd.DataFrame, pd.DataFrame, dict]:
    """
    Orchestrates the entire cleaning, enrichment, demand extraction, audit report, and export.
    """
    logger.info("==================================================================")
    logger.info("Starting Retail Sales Data Cleaning Pipeline (Final Refinement)")
    logger.info("==================================================================")

    # 1. Ingest and pre-audit
    df_raw, _ = load_and_audit_raw(raw_csv_path)

    # 2. Clean, deduplicate, recompute profit, and engineer calendar features
    clean_df, quality_metrics = clean_retail_data(df_raw)

    # 3. Extract unpolluted demand dataset for time-series forecasting
    demand_df = extract_demand_dataframe(clean_df)

    # 4. Verify integrity assertions
    assert_data_integrity(clean_df, demand_df)

    # 5. Persist production CSV assets and JSON Quality Report
    os.makedirs(os.path.dirname(clean_csv_path), exist_ok=True)
    clean_df.to_csv(clean_csv_path, index=False)
    demand_df.to_csv(demand_csv_path, index=False)

    with open(report_json_path, "w") as f:
        json.dump(quality_metrics, f, indent=2)

    logger.info(f"Persisted BI dataset (SALES + RETURNS): '{clean_csv_path}' ({len(clean_df):,} rows)")
    logger.info(f"Persisted Demand dataset (SALES ONLY): '{demand_csv_path}' ({len(demand_df):,} rows)")
    logger.info(f"Persisted Data Quality Report: '{report_json_path}'")
    logger.info("==================================================================")

    return clean_df, demand_df, quality_metrics


if __name__ == "__main__":
    run_cleaning_pipeline()
`;
