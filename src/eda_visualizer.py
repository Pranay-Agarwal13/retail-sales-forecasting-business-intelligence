"""
File: src/eda_visualizer.py
Project: Retail Sales Forecasting & Business Intelligence
Description: Production-grade, reusable visualization library for exploratory
data analysis (EDA) using matplotlib and seaborn. Generates publication-quality
figures saved to reports/figures/ with clean split-apply-combine aggregations,
grouped horizontal bars, stacked multi-panel figures, and Seaborn deprecation fixes.
"""

import os
from typing import Optional
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np
import pandas as pd
import seaborn as sns

# Set professional theme
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 10,
    "axes.titlesize": 13,
    "axes.titleweight": "bold",
    "axes.labelsize": 11,
    "axes.labelweight": "medium",
    "xtick.labelsize": 9.5,
    "ytick.labelsize": 9.5,
    "legend.fontsize": 9.5,
    "figure.titlesize": 15,
    "figure.titleweight": "bold",
    "figure.dpi": 300,
    "axes.spines.top": False,
    "axes.spines.right": False,
})

# Enterprise color palette
COLORS = {
    "primary": "#1E3A8A",      # Deep Navy
    "secondary": "#0D9488",    # Teal
    "accent": "#F59E0B",       # Amber
    "danger": "#E11D48",       # Crimson / Return Red
    "success": "#10B981",      # Emerald
    "neutral_dark": "#1F2937", # Slate Dark
    "neutral_light": "#F3F4F6",# Gray Light
}


def ensure_output_dir(output_dir: str = "reports/figures") -> str:
    """Ensures target directory exists."""
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


def format_currency_axis(ax, axis: str = "y") -> None:
    """Formats axis tick labels into compact currency ($K, $M)."""
    formatter = ticker.FuncFormatter(
        lambda x, pos: f"${x*1e-3:.0f}K" if abs(x) < 1e6 else f"${x*1e-6:.1f}M"
    )
    if axis == "y":
        ax.yaxis.set_major_formatter(formatter)
    elif axis == "x":
        ax.xaxis.set_major_formatter(formatter)


# ==============================================================================
# 1. TIME TRENDS & MOVING AVERAGES (STACKED PANELS TO AVOID DUAL AXIS TRAP)
# ==============================================================================
def plot_monthly_revenue_and_profit(
    df: pd.DataFrame,
    output_dir: str = "reports/figures",
    filename: str = "01_monthly_revenue_profit_trend.png"
) -> str:
    """
    Plots monthly financial trajectory using two vertically stacked subplots sharing the x-axis:
    - Upper Panel: Grouped bars for Net Revenue and Net Profit.
    - Lower Panel: Customer Return Rate (%) line chart.
    Eliminates deceptive dual-axis scaling while preserving aligned temporal comparison.
    """
    ensure_output_dir(output_dir)
    save_path = os.path.join(output_dir, filename)

    # 1. Separate SALE and RETURN aggregations using robust split-apply-combine
    df_sales = df[df["transaction_type"] == "SALE"].copy()
    df_returns = df[df["transaction_type"] == "RETURN"].copy()

    sales_monthly = (
        df_sales.groupby(df_sales["order_date"].dt.to_period("M"), observed=True)
        .agg(
            gross_revenue=("revenue", "sum"),
            gross_profit=("profit", "sum"),
            units_sold=("units_sold", "sum")
        )
        .reset_index()
        .rename(columns={"order_date": "period"})
    )

    returns_monthly = (
        df_returns.groupby(df_returns["order_date"].dt.to_period("M"), observed=True)
        .agg(
            refund_revenue=("revenue", lambda x: abs(x.sum())),
            refund_profit=("profit", lambda x: abs(x.sum())),
            refund_units=("units_sold", lambda x: abs(x.sum()))
        )
        .reset_index()
        .rename(columns={"order_date": "period"})
    )

    monthly = sales_monthly.merge(returns_monthly, on="period", how="left").fillna(0)
    monthly["net_revenue"] = monthly["gross_revenue"] - monthly["refund_revenue"]
    monthly["net_profit"] = monthly["gross_profit"] - monthly["refund_profit"]
    monthly["return_rate"] = np.where(
        monthly["gross_revenue"] > 0,
        (monthly["refund_revenue"] / monthly["gross_revenue"]) * 100.0,
        0.0
    )
    monthly["period_str"] = monthly["period"].astype(str)

    # 2. Vertically stacked subplots sharing x-axis
    fig, (ax1, ax2) = plt.subplots(
        2, 1, figsize=(14, 8), sharex=True, gridspec_kw={"height_ratios": [2.5, 1]}
    )

    x = np.arange(len(monthly))
    width = 0.38

    # Upper panel: Net Revenue & Net Profit bars
    ax1.bar(x - width/2, monthly["net_revenue"], width, label="Net Revenue", color=COLORS["primary"], alpha=0.9)
    ax1.bar(x + width/2, monthly["net_profit"], width, label="Net Profit", color=COLORS["secondary"], alpha=0.9)
    ax1.set_ylabel("Net Financial Value ($)")
    format_currency_axis(ax1, "y")
    ax1.set_title("3-Year Monthly Net Financial Performance (2021–2023)", pad=12)
    ax1.legend(loc="upper left", frameon=True)

    # Lower panel: Return Rate % line chart
    ax2.plot(x, monthly["return_rate"], color=COLORS["danger"], marker="o", linewidth=2, markersize=5)
    ax2.set_ylabel("Return Rate (%)", color=COLORS["danger"], fontweight="bold")
    ax2.set_xlabel("Transaction Month")
    ax2.set_ylim(0, max(monthly["return_rate"].max() * 1.3, 8.0))
    ax2.grid(True, linestyle="--", alpha=0.5)

    # Clean x-ticks on lower panel
    ax2.set_xticks(x[::2])
    ax2.set_xticklabels(monthly["period_str"].iloc[::2], rotation=35, ha="right")

    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    return save_path


def plot_daily_moving_averages(
    demand_df: pd.DataFrame,
    output_dir: str = "reports/figures",
    filename: str = "02_daily_demand_moving_averages.png"
) -> str:
    """Plots daily units sold with 7-day and 30-day moving averages."""
    ensure_output_dir(output_dir)
    save_path = os.path.join(output_dir, filename)

    daily = demand_df.groupby("order_date")["units_sold"].sum().reset_index()
    daily["ma_7"] = daily["units_sold"].rolling(7, min_periods=7).mean()
    daily["ma_30"] = daily["units_sold"].rolling(30, min_periods=7).mean()

    fig, ax = plt.subplots(figsize=(14, 5.5))

    ax.scatter(daily["order_date"], daily["units_sold"], color="#CBD5E1", alpha=0.45, s=12, label="Actual Daily Units")
    ax.plot(daily["order_date"], daily["ma_7"], color=COLORS["secondary"], linewidth=1.75, label="7-Day Moving Avg (Weekly Cycle)")
    ax.plot(daily["order_date"], daily["ma_30"], color=COLORS["primary"], linewidth=2.5, label="30-Day Moving Avg (Macro Trend)")

    ax.set_title("Daily Demand Trajectory with 7-Day & 30-Day Moving Averages", pad=15)
    ax.set_xlabel("Date")
    ax.set_ylabel("Daily Forward Units Sold")
    ax.legend(loc="upper left", frameon=True)

    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    return save_path


# ==============================================================================
# 2. SEASONALITY PATTERNS (SEABORN DEPRECATION WARNINGS FIXED)
# ==============================================================================
def plot_seasonality_grid(
    df: pd.DataFrame,
    output_dir: str = "reports/figures",
    filename: str = "03_seasonality_patterns_grid.png"
) -> str:
    """4-panel seasonality grid with explicit hue parameter to eliminate Seaborn warnings."""
    ensure_output_dir(output_dir)
    save_path = os.path.join(output_dir, filename)

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # Panel 1: Day of Week with explicit categorical ordering
    dow_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    df_sales = df[df["transaction_type"] == "SALE"].copy()
    dow_agg = df_sales.groupby("day_of_week", observed=True)["revenue"].mean().reindex(dow_order).reset_index()

    sns.barplot(
        x="day_of_week",
        y="revenue",
        data=dow_agg,
        hue="day_of_week",
        legend=False,
        ax=axes[0, 0],
        palette="Blues_d"
    )
    axes[0, 0].set_title("A. Average Sales by Day of Week (Weekend Surge)", fontsize=11)
    axes[0, 0].set_xlabel("")
    axes[0, 0].set_ylabel("Mean Daily Revenue ($)")
    format_currency_axis(axes[0, 0], "y")
    axes[0, 0].tick_params(axis="x", rotation=30)

    # Panel 2: Month of Year
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_agg = df_sales.groupby("month")["revenue"].sum().reset_index()
    monthly_agg["month_name"] = monthly_agg["month"].apply(lambda m: month_names[int(m) - 1])

    sns.barplot(
        x="month_name",
        y="revenue",
        data=monthly_agg,
        hue="month_name",
        legend=False,
        ax=axes[0, 1],
        palette="crest"
    )
    axes[0, 1].set_title("B. Total Sales by Month (Q4 Holiday Lift)", fontsize=11)
    axes[0, 1].set_xlabel("")
    axes[0, 1].set_ylabel("Total Gross Sales ($)")
    format_currency_axis(axes[0, 1], "y")

    # Panel 3: Fiscal Quarter Net Revenue by Year
    quarter_agg = df.groupby(["year", "quarter"])["revenue"].sum().unstack(level=0)
    quarter_agg.plot(kind="bar", ax=axes[1, 0], color=["#93C5FD", "#3B82F6", "#1E3A8A"], width=0.7)
    axes[1, 0].set_title("C. Quarterly Net Revenue by Fiscal Year", fontsize=11)
    axes[1, 0].set_xlabel("Quarter")
    axes[1, 0].set_ylabel("Net Revenue ($)")
    axes[1, 0].set_xticklabels(["Q1", "Q2", "Q3", "Q4"], rotation=0)
    format_currency_axis(axes[1, 0], "y")
    axes[1, 0].legend(title="Year", frameon=True)

    # Panel 4: Daily Volume Holiday Boxplot
    holiday_daily = df_sales.groupby(["order_date", "holiday_flag"])["units_sold"].sum().reset_index()
    holiday_daily["holiday_label"] = np.where(holiday_daily["holiday_flag"] == 1, "Retail Holiday", "Standard Day")

    sns.boxplot(
        x="holiday_label",
        y="units_sold",
        data=holiday_daily,
        hue="holiday_label",
        legend=False,
        ax=axes[1, 1],
        palette=["#94A3B8", "#F59E0B"],
        width=0.45
    )
    axes[1, 1].set_title("D. Daily Forward Units: Standard vs. Holiday Lift", fontsize=11)
    axes[1, 1].set_xlabel("")
    axes[1, 1].set_ylabel("Daily Forward Units Sold")

    plt.suptitle("Multi-Dimensional Retail Seasonality Decomposition", y=0.99)
    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    return save_path


# ==============================================================================
# 3. CATEGORY & PRODUCT PERFORMANCE (ROBUST MERGING & GROUPED HORIZONTAL BARS)
# ==============================================================================
def plot_category_performance_matrix(
    df: pd.DataFrame,
    output_dir: str = "reports/figures",
    filename: str = "04_category_revenue_profit_matrix.png"
) -> str:
    """Robust category performance matrix without fragile lambda indexing."""
    ensure_output_dir(output_dir)
    save_path = os.path.join(output_dir, filename)

    sales = (
        df[df["transaction_type"] == "SALE"]
        .groupby("category", observed=True)
        .agg(gross_revenue=("revenue", "sum"), gross_profit=("profit", "sum"), units_sold=("units_sold", "sum"))
        .reset_index()
    )

    returns = (
        df[df["transaction_type"] == "RETURN"]
        .groupby("category", observed=True)
        .agg(refund_revenue=("revenue", lambda x: abs(x.sum())), refund_profit=("profit", lambda x: abs(x.sum())))
        .reset_index()
    )

    cat_perf = sales.merge(returns, on="category", how="left").fillna(0)
    cat_perf["net_revenue"] = cat_perf["gross_revenue"] - cat_perf["refund_revenue"]
    cat_perf["net_profit"] = cat_perf["gross_profit"] - cat_perf["refund_profit"]
    cat_perf["profit_margin"] = (cat_perf["net_profit"] / cat_perf["net_revenue"]) * 100.0
    cat_perf["return_rate"] = (cat_perf["refund_revenue"] / cat_perf["gross_revenue"]) * 100.0
    cat_perf = cat_perf.sort_values("net_revenue", ascending=False)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))

    # Bar chart of Net Revenue & Net Profit
    x = np.arange(len(cat_perf))
    width = 0.35
    axes[0].bar(x - width/2, cat_perf["net_revenue"], width, label="Net Revenue", color=COLORS["primary"])
    axes[0].bar(x + width/2, cat_perf["net_profit"], width, label="Net Profit", color=COLORS["secondary"])
    axes[0].set_title("Category Net Revenue & Profit Contribution", pad=12)
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(cat_perf["category"], rotation=20, ha="right")
    axes[0].set_ylabel("Dollar Value ($)")
    format_currency_axis(axes[0], "y")
    axes[0].legend(frameon=True)

    # Bubble Map: Return Rate vs. Profit Margin
    for _, row in cat_perf.iterrows():
        axes[1].scatter(
            row["return_rate"],
            row["profit_margin"],
            s=row["net_revenue"] / 250,
            color=COLORS["primary"],
            alpha=0.75,
            edgecolor="black"
        )
        axes[1].annotate(
            row["category"],
            (row["return_rate"] + 0.12, row["profit_margin"] - 0.5),
            fontsize=9.5,
            fontweight="bold"
        )

    axes[1].set_title("Category Profit Margin (%) vs. Return Rate (%) Bubble Map", pad=12)
    axes[1].set_xlabel("Return Rate (%) [Left is Better]")
    axes[1].set_ylabel("Profit Margin (%) [Higher is Better]")
    axes[1].grid(True, linestyle="--", alpha=0.5)

    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    return save_path


def plot_pareto_revenue_analysis(
    df: pd.DataFrame,
    output_dir: str = "reports/figures",
    filename: str = "05_product_pareto_80_20.png"
) -> str:
    """Generates 80/20 Pareto cumulative revenue curve across all products."""
    ensure_output_dir(output_dir)
    save_path = os.path.join(output_dir, filename)

    prod_rev = (
        df[df["transaction_type"] == "SALE"]
        .groupby(["product_id", "product_name"])["revenue"]
        .sum()
        .sort_values(ascending=False)
        .reset_index()
    )

    prod_rev["cum_revenue"] = prod_rev["revenue"].cumsum()
    prod_rev["cum_pct"] = (prod_rev["cum_revenue"] / prod_rev["revenue"].sum()) * 100.0
    prod_rev["rank"] = np.arange(1, len(prod_rev) + 1)

    fig, ax1 = plt.subplots(figsize=(13, 6))

    ax1.bar(
        prod_rev.index,
        prod_rev["revenue"],
        color="#3B82F6",
        alpha=0.75,
        label="Product Revenue ($)"
    )
    ax1.set_xlabel("Products Ranked by Revenue")
    ax1.set_ylabel("Gross Product Revenue ($)", color=COLORS["primary"])
    format_currency_axis(ax1, "y")
    ax1.set_xticks(prod_rev.index)
    ax1.set_xticklabels(prod_rev["product_name"].str.slice(0, 16) + "..", rotation=45, ha="right", fontsize=8.5)

    ax2 = ax1.twinx()
    ax2.plot(prod_rev.index, prod_rev["cum_pct"], color=COLORS["danger"], marker="D", linewidth=2.2, label="Cumulative Revenue (%)")
    ax2.axhline(80, color=COLORS["danger"], linestyle="--", linewidth=1.5, alpha=0.8)
    ax2.set_ylabel("Cumulative Percentage (%)", color=COLORS["danger"])
    ax2.set_ylim(0, 105)
    ax2.grid(False)

    cutoff_idx = int((prod_rev["cum_pct"] <= 80).sum())
    ax2.axvline(cutoff_idx, color="black", linestyle=":", linewidth=1.5)
    ax2.annotate(
        f"Top {cutoff_idx} SKUs (~{cutoff_idx/len(prod_rev)*100:.0f}%)\nDrive 80% Revenue",
        xy=(cutoff_idx, 80),
        xytext=(cutoff_idx + 1.2, 58),
        arrowprops=dict(facecolor="black", arrowstyle="->", lw=1.2),
        fontweight="bold",
        fontsize=9.5,
        bbox=dict(boxstyle="round,pad=0.4", fc="yellow", alpha=0.25)
    )

    ax1.set_title("Product Portfolio Pareto Analysis (80/20 Distribution)", pad=15)
    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    return save_path


def plot_top_bottom_products(
    df: pd.DataFrame,
    output_dir: str = "reports/figures",
    filename: str = "06_top_bottom_10_products.png"
) -> str:
    """
    Plots Top 10 and Bottom 10 products using grouped, non-overlapping horizontal bars.
    Eliminates deceptive visual overlay between net revenue and net profit.
    """
    ensure_output_dir(output_dir)
    save_path = os.path.join(output_dir, filename)

    sales = (
        df[df["transaction_type"] == "SALE"]
        .groupby("product_name")
        .agg(gross_revenue=("revenue", "sum"), gross_profit=("profit", "sum"))
    )
    returns = (
        df[df["transaction_type"] == "RETURN"]
        .groupby("product_name")
        .agg(refund_revenue=("revenue", lambda x: abs(x.sum())), refund_profit=("profit", lambda x: abs(x.sum())))
    )

    prod_summary = sales.join(returns, how="left").fillna(0)
    prod_summary["net_revenue"] = prod_summary["gross_revenue"] - prod_summary["refund_revenue"]
    prod_summary["net_profit"] = prod_summary["gross_profit"] - prod_summary["refund_profit"]
    prod_summary = prod_summary.sort_values("net_revenue", ascending=False)

    top_10 = prod_summary.head(10).iloc[::-1]
    bottom_10 = prod_summary.tail(10).iloc[::-1]

    fig, axes = plt.subplots(1, 2, figsize=(15, 6))

    # Top 10 Grouped Horizontal Bars (Offset by height)
    y_top = np.arange(len(top_10))
    bar_height = 0.38
    axes[0].barh(y_top - bar_height/2, top_10["net_revenue"], height=bar_height, label="Net Revenue", color=COLORS["primary"])
    axes[0].barh(y_top + bar_height/2, top_10["net_profit"], height=bar_height, label="Net Profit", color=COLORS["secondary"])
    axes[0].set_yticks(y_top)
    axes[0].set_yticklabels(top_10.index, fontsize=8.5)
    axes[0].set_title("Top 10 Products by Net Revenue & Profit", pad=12)
    format_currency_axis(axes[0], "x")
    axes[0].legend(loc="lower right")

    # Bottom 10 Grouped Horizontal Bars
    y_bot = np.arange(len(bottom_10))
    axes[1].barh(y_bot - bar_height/2, bottom_10["net_revenue"], height=bar_height, label="Net Revenue", color="#94A3B8")
    axes[1].barh(y_bot + bar_height/2, bottom_10["net_profit"], height=bar_height, label="Net Profit", color=COLORS["accent"])
    axes[1].set_yticks(y_bot)
    axes[1].set_yticklabels(bottom_10.index, fontsize=8.5)
    axes[1].set_title("Bottom 10 Products by Net Revenue", pad=12)
    format_currency_axis(axes[1], "x")
    axes[1].legend(loc="lower right")

    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    return save_path


# ==============================================================================
# 4. STORE & REGIONAL PERFORMANCE
# ==============================================================================
def plot_store_and_regional_performance(
    df: pd.DataFrame,
    output_dir: str = "reports/figures",
    filename: str = "07_store_regional_performance.png"
) -> str:
    """Store rankings, regional distribution, and store-category heatmap."""
    ensure_output_dir(output_dir)
    save_path = os.path.join(output_dir, filename)

    fig = plt.figure(figsize=(15, 11))
    gs = fig.add_gridspec(2, 2)

    # Panel 1: Store Net Revenue Ranking
    ax1 = fig.add_subplot(gs[0, 0])
    store_agg = (
        df.groupby(["store_name", "region"], observed=True)["revenue"]
        .sum()
        .reset_index()
        .sort_values("revenue", ascending=True)
    )
    palette_map = {"East": COLORS["primary"], "West": COLORS["secondary"], "North": COLORS["accent"], "South": "#64748B"}
    bar_colors = [palette_map.get(r, "#64748B") for r in store_agg["region"]]

    ax1.barh(store_agg["store_name"], store_agg["revenue"], color=bar_colors)
    ax1.set_title("A. Store Net Revenue Rankings (by Region)", pad=10)
    format_currency_axis(ax1, "x")

    # Panel 2: Regional Net Revenue & Margin
    ax2 = fig.add_subplot(gs[0, 1])
    reg_agg = df.groupby("region", observed=True).agg(
        revenue=("revenue", "sum"),
        profit=("profit", "sum")
    ).reset_index()
    reg_agg["margin"] = np.where(reg_agg["revenue"] > 0, (reg_agg["profit"] / reg_agg["revenue"]) * 100.0, 0.0)

    sns.barplot(x="region", y="revenue", data=reg_agg, hue="region", legend=False, ax=ax2, palette="Blues_d")
    ax2.set_title("B. Total Net Revenue by Region", pad=10)
    ax2.set_xlabel("Region")
    ax2.set_ylabel("Net Revenue ($)")
    format_currency_axis(ax2, "y")

    for i, row in reg_agg.iterrows():
        ax2.text(i, row["revenue"] * 0.5, f"Margin:\n{row['margin']:.1f}%", ha="center", color="white", fontweight="bold", fontsize=9)

    # Panel 3: Store-Category Heatmap
    ax3 = fig.add_subplot(gs[1, :])
    pivot_store_cat = df.pivot_table(
        index="store_name",
        columns="category",
        values="revenue",
        aggfunc="sum",
        fill_value=0
    )
    sns.heatmap(pivot_store_cat, annot=True, fmt=".0f", cmap="YlGnBu", cbar_kws={"label": "Net Revenue ($)"}, ax=ax3)
    ax3.set_title("C. Store-Category Net Revenue Cross-Tabulation Heatmap", pad=12)
    ax3.set_ylabel("")
    ax3.set_xlabel("Category")

    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    return save_path


# ==============================================================================
# 5. PROMOTION ELASTICITY & DISCOUNT TIERS
# ==============================================================================
def plot_promotion_elasticity_and_lift(
    df: pd.DataFrame,
    output_dir: str = "reports/figures",
    filename: str = "08_promotion_elasticity_margin_tradeoff.png"
) -> str:
    """Analyzes volume lift vs. profit margin erosion across exact generator discount tiers."""
    ensure_output_dir(output_dir)
    save_path = os.path.join(output_dir, filename)

    sales_df = df[df["transaction_type"] == "SALE"].copy()

    # Exact discount tier binning aligned with retail generator values (0%, 10%, 15%, 20%, 30%)
    sales_df["discount_tier"] = pd.cut(
        sales_df["discount"],
        bins=[-0.01, 0.05, 0.12, 0.18, 0.25, 1.0],
        labels=["0% (Full Price)", "10% Discount", "15% Discount", "20% Discount", "30% Clearance"]
    )

    promo_stats = sales_df.groupby("discount_tier", observed=True).agg(
        mean_units=("units_sold", "mean"),
        mean_revenue=("revenue", "mean"),
        mean_profit=("profit", "mean"),
        margin_pct=("profit_margin", lambda x: x.mean() * 100.0),
        transaction_count=("units_sold", "count")
    ).reset_index()

    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))

    # Panel A: Mean Units per Order vs. Margin %
    ax1 = axes[0]
    ax1.plot(promo_stats["discount_tier"], promo_stats["mean_units"], marker="s", color=COLORS["primary"], linewidth=2.5, label="Mean Units Sold")
    ax1.set_ylabel("Mean Units per Transaction", color=COLORS["primary"], fontweight="bold")
    ax1.set_xticks(np.arange(len(promo_stats)))
    ax1.set_xticklabels(promo_stats["discount_tier"], rotation=25, ha="right")

    ax1_twin = ax1.twinx()
    ax1_twin.plot(promo_stats["discount_tier"], promo_stats["margin_pct"], marker="o", color=COLORS["danger"], linewidth=2.5, linestyle="--", label="Profit Margin (%)")
    ax1_twin.set_ylabel("Profit Margin (%)", color=COLORS["danger"], fontweight="bold")
    ax1_twin.grid(False)
    ax1.set_title("A. Promotional Elasticity: Unit Lift vs. Margin Erosion", pad=12)

    # Panel B: Order Dollar Value & Gross Profit per Transaction
    ax2 = axes[1]
    tier_x = np.arange(len(promo_stats))
    w = 0.35
    ax2.bar(tier_x - w/2, promo_stats["mean_revenue"], width=w, label="Mean Revenue ($)", color=COLORS["primary"])
    ax2.bar(tier_x + w/2, promo_stats["mean_profit"], width=w, label="Mean Profit ($)", color=COLORS["secondary"])
    ax2.set_xticks(tier_x)
    ax2.set_xticklabels(promo_stats["discount_tier"], rotation=25, ha="right")
    ax2.set_ylabel("Mean Value per Transaction ($)")
    ax2.set_title("B. Order Dollar Value & Profit Contribution by Discount Tier", pad=12)
    ax2.legend(frameon=True)

    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    return save_path


# ==============================================================================
# 6. RETURNS ANALYSIS & REFUND DRIVERS
# ==============================================================================
def plot_returns_deep_dive(
    df: pd.DataFrame,
    output_dir: str = "reports/figures",
    filename: str = "09_returns_deep_dive_analysis.png"
) -> str:
    """Analyzes customer return rates by category and promotion status."""
    ensure_output_dir(output_dir)
    save_path = os.path.join(output_dir, filename)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))

    # Robust merge for category return rates
    sales_cat = df[df["transaction_type"] == "SALE"].groupby("category", observed=True)["revenue"].sum().reset_index(name="gross_rev")
    ret_cat = df[df["transaction_type"] == "RETURN"].groupby("category", observed=True)["revenue"].sum().abs().reset_index(name="refund_rev")
    cat_returns = sales_cat.merge(ret_cat, on="category", how="left").fillna(0)
    cat_returns["return_rate"] = (cat_returns["refund_rev"] / cat_returns["gross_rev"]) * 100.0
    cat_returns = cat_returns.sort_values("return_rate", ascending=True)

    sns.barplot(x="return_rate", y="category", data=cat_returns, hue="category", legend=False, ax=axes[0], palette="Reds_d")
    axes[0].set_title("A. Return Rate (%) by Merchandising Category", pad=12)
    axes[0].set_xlabel("Return Rate (%)")
    axes[0].set_ylabel("")

    for i, v in enumerate(cat_returns["return_rate"]):
        axes[0].text(v + 0.1, i, f"{v:.1f}%", va="center", fontweight="bold", fontsize=9.5)

    # Robust Return Attribution via parent sale transaction:
    # Joins return records back to parent sale transaction via original_order_id
    if "original_order_id" in df.columns and "order_id" in df.columns:
        sales_lookup = (
            df[df["transaction_type"] == "SALE"][["order_id", "promotion_flag"]]
            .rename(columns={"promotion_flag": "orig_promotion_flag"})
        )
        returns_df = df[df["transaction_type"] == "RETURN"].copy()
        linked_returns = returns_df.merge(
            sales_lookup, left_on="original_order_id", right_on="order_id", how="left"
        )
        linked_returns["orig_promotion_flag"] = linked_returns["orig_promotion_flag"].fillna(0).astype(int)

        ret_promo = (
            linked_returns.groupby("orig_promotion_flag", observed=True)["revenue"]
            .sum()
            .abs()
            .reset_index(name="refund_rev")
            .rename(columns={"orig_promotion_flag": "promotion_flag"})
        )
        panel_b_title = "B. Return Rate by Original Sale Promotional Status (Joined via order_id)"
    else:
        ret_promo = (
            df[df["transaction_type"] == "RETURN"]
            .groupby("promotion_flag", observed=True)["revenue"]
            .sum()
            .abs()
            .reset_index(name="refund_rev")
        )
        panel_b_title = "B. Return Rate by Promotion Flag (Unlinked Ledger Proxy)"

    sales_promo = (
        df[df["transaction_type"] == "SALE"]
        .groupby("promotion_flag", observed=True)["revenue"]
        .sum()
        .reset_index(name="gross_rev")
    )
    promo_returns = sales_promo.merge(ret_promo, on="promotion_flag", how="left").fillna(0)
    promo_returns["return_rate"] = (promo_returns["refund_rev"] / promo_returns["gross_rev"]) * 100.0
    promo_returns["label"] = np.where(promo_returns["promotion_flag"] == 1, "Promoted Sales", "Full-Price Sales")

    bars = axes[1].bar(promo_returns["label"], promo_returns["return_rate"], color=["#64748B", COLORS["danger"]], width=0.45)
    axes[1].set_title(panel_b_title, pad=12)
    axes[1].set_ylabel("Return Rate (%)")
    axes[1].set_ylim(0, max(promo_returns["return_rate"].max() * 1.35, 6.0))

    for bar in bars:
        h = bar.get_height()
        axes[1].text(bar.get_x() + bar.get_width()/2, h + 0.15, f"{h:.2f}%", ha="center", fontweight="bold")

    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    return save_path


# ==============================================================================
# 7. CORRELATION (BEHAVIORAL FEATURES ONLY) & DISTRIBUTIONS
# ==============================================================================
def plot_correlation_and_distributions(
    demand_df: pd.DataFrame,
    output_dir: str = "reports/figures",
    filename: str = "10_correlation_and_distributions.png"
) -> str:
    """
    Plots correlation heatmap of behavioral features (excluding accounting identity collinearities)
    and distribution of forward order transaction revenues.
    """
    ensure_output_dir(output_dir)
    save_path = os.path.join(output_dir, filename)

    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    # Exclude revenue and profit from correlation matrix because revenue = units * price * (1 - disc)
    # is a mathematical identity that produces trivial r ~ 0.8 collinearity.
    behavioral_cols = ["units_sold", "unit_price", "discount", "promotion_flag", "holiday_flag", "is_weekend"]
    corr = demand_df[behavioral_cols].corr()

    sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", center=0, vmin=-1, vmax=1, square=True, ax=axes[0])
    axes[0].set_title("A. Behavioral Correlation Matrix (Non-Trivial Features)", pad=12)

    # Transaction revenue distribution
    sns.histplot(demand_df["revenue"], kde=True, color=COLORS["primary"], bins=35, ax=axes[1])
    axes[1].set_title("B. Transaction Revenue Distribution (Right-Skewed)", pad=12)
    axes[1].set_xlabel("Order Revenue ($)")
    axes[1].set_ylabel("Transaction Count")
    format_currency_axis(axes[1], "x")

    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    return save_path


# ==============================================================================
# 8. EXECUTIVE SUMMARY CSV EXPORT & ORCHESTRATION
# ==============================================================================
def generate_all_eda_reports(
    clean_csv_path: str = "data/processed/retail_sales_clean.csv",
    demand_csv_path: str = "data/processed/retail_sales_demand.csv",
    output_dir: str = "reports/figures",
    summary_csv_path: str = "reports/eda_executive_summary.csv"
) -> list[str]:
    """Generates all 10 figures and exports dynamic executive summary CSV."""
    logger_msg = f"Generating publication EDA figures into '{output_dir}'..."
    print(logger_msg)
    ensure_output_dir(output_dir)
    os.makedirs(os.path.dirname(summary_csv_path), exist_ok=True)

    df_clean = pd.read_csv(clean_csv_path, parse_dates=["order_date"])
    df_demand = pd.read_csv(demand_csv_path, parse_dates=["order_date"])

    # Compute dynamic summary table from actual CSV data
    gross_sales = float(df_clean.loc[df_clean["transaction_type"] == "SALE", "revenue"].sum())
    returns_val = float(df_clean.loc[df_clean["transaction_type"] == "RETURN", "revenue"].abs().sum())
    net_rev = float(df_clean["revenue"].sum())
    gross_profit = float(df_clean.loc[df_clean["transaction_type"] == "SALE", "profit"].sum())
    net_profit = float(df_clean["profit"].sum())
    forward_units = int(df_clean.loc[df_clean["transaction_type"] == "SALE", "units_sold"].sum())
    sale_tx_count = int((df_clean["transaction_type"] == "SALE").sum())
    atv = net_rev / sale_tx_count if sale_tx_count > 0 else 0.0

    summary_df = pd.DataFrame({
        "Metric": [
            "Gross Sales Revenue ($)",
            "Customer Return Refunds ($)",
            "Net Revenue ($)",
            "Gross Profit ($)",
            "Net Profit ($)",
            "Total Forward Units Sold",
            "Return Rate (% of Gross)",
            "Blended Net Profit Margin (%)",
            "Average Transaction Value (ATV) ($)",
            "Total Sale Transaction Rows"
        ],
        "Computed_Value": [
            round(gross_sales, 2),
            round(returns_val, 2),
            round(net_rev, 2),
            round(gross_profit, 2),
            round(net_profit, 2),
            forward_units,
            round((returns_val / gross_sales * 100), 2) if gross_sales > 0 else 0.0,
            round((net_profit / net_rev * 100), 2) if net_rev > 0 else 0.0,
            round(atv, 2),
            sale_tx_count
        ]
    })
    summary_df.to_csv(summary_csv_path, index=False)
    print(f"Saved dynamic executive summary to: {summary_csv_path}")

    return [
        plot_monthly_revenue_and_profit(df_clean, output_dir),
        plot_daily_moving_averages(df_demand, output_dir),
        plot_seasonality_grid(df_clean, output_dir),
        plot_category_performance_matrix(df_clean, output_dir),
        plot_pareto_revenue_analysis(df_clean, output_dir),
        plot_top_bottom_products(df_clean, output_dir),
        plot_store_and_regional_performance(df_clean, output_dir),
        plot_promotion_elasticity_and_lift(df_clean, output_dir),
        plot_returns_deep_dive(df_clean, output_dir),
        plot_correlation_and_distributions(df_demand, output_dir),
    ]


if __name__ == "__main__":
    generate_all_eda_reports()
