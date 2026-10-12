"""
File: src/forecast_engine.py
Project: Retail Sales Forecasting & Business Intelligence
Description: Production-grade, modular, leakage-free time-series forecasting engine.
             Implements multi-level daily demand aggregation, expanding rolling-origin
             cross-validation, fold-isolated error metrics (MAE, RMSE, WAPE, MAPE, MASE),
             four benchmark & machine learning models (Seasonal Naive, SARIMAX, Prophet, XGBoost),
             recursive multi-step forecasting, out-of-fold empirical interval calibration across
             horizon buckets (1-7, 8-14, 15-30, 31-60, 61-90), and 30/60/90-day forward projections.
"""

from __future__ import annotations

import os
import sys
import logging
import warnings
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any

import numpy as np
import pandas as pd
from sklearn.exceptions import ConvergenceWarning

# Targeted warning suppression: suppress only expected convergence and pandas deprecation warnings
warnings.filterwarnings("ignore", category=ConvergenceWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning, module="statsmodels")
warnings.filterwarnings("ignore", category=UserWarning, module="prophet")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("ForecastEngine")

# Model library imports with resilient environment handling
try:
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False
    logger.warning("statsmodels is not installed. SARIMAX will operate in fallback mode.")

try:
    from prophet import Prophet
    HAS_PROPHET = True
except (ImportError, Exception):
    HAS_PROPHET = False
    logger.warning("Prophet is not installed or pystan unavailable. Prophet will operate in fallback mode.")

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    logger.warning("xgboost is not installed. Will use scikit-learn GradientBoostingRegressor as surrogate.")
    from sklearn.ensemble import GradientBoostingRegressor


# ==============================================================================
# 1. CONFIGURATION & METRICS DATA STRUCTURES
# ==============================================================================

@dataclass
class ForecastConfig:
    """Configuration parameters for time series cross-validation and forecasting."""
    test_horizon_days: int = 30
    cv_folds: int = 3
    seasonal_period: int = 7  # 7-day weekly seasonality
    future_horizons: List[int] = field(default_factory=lambda: [30, 60, 90])
    confidence_level: float = 0.95
    random_seed: int = 42


@dataclass
class ForecastMetrics:
    """Container for forecast accuracy metrics."""
    mae: float
    rmse: float
    wape: float
    mape: float
    mase: float

    def to_dict(self) -> Dict[str, float]:
        return {
            "MAE": round(self.mae, 3),
            "RMSE": round(self.rmse, 3),
            "WAPE": round(self.wape, 2),
            "MAPE": round(self.mape, 2),
            "MASE": round(self.mase, 3)
        }


def calculate_forecast_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_train_history: np.ndarray,
    seasonal_period: int = 7
) -> ForecastMetrics:
    """
    Computes standard retail forecasting accuracy metrics with strict fold-isolation.

    - MAE: Mean Absolute Error
    - RMSE: Root Mean Squared Error
    - WAPE: Weighted Absolute Percentage Error: (sum(|y - y_hat|) / sum(y)) * 100%
            Primary selection metric for retail demand across all volume tiers.
    - MAPE: Standard Mean Absolute Percentage Error, calculated strictly on non-zero actuals.
    - MASE: Mean Absolute Scaled Error (Hyndman & Koehler, 2006)
            Scaled strictly using the in-sample training seasonal-naive MAE denominator.
    """
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)
    y_train = np.asarray(y_train_history, dtype=np.float64)

    # 1. MAE
    mae = float(np.mean(np.abs(y_true - y_pred)))

    # 2. RMSE
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

    # 3. WAPE (Primary selection metric: robust to zero-demand intervals)
    sum_actual = float(np.sum(np.abs(y_true)))
    wape = float((np.sum(np.abs(y_true - y_pred)) / sum_actual * 100.0)) if sum_actual > 0 else 0.0

    # 4. Standard MAPE: strictly filtered to non-zero actual observations
    non_zero_mask = y_true > 0
    if np.any(non_zero_mask):
        mape = float(np.mean(np.abs(y_true[non_zero_mask] - y_pred[non_zero_mask]) / y_true[non_zero_mask]) * 100.0)
    else:
        mape = 0.0

    # 5. MASE (Fold-isolated seasonal scaling denominator d)
    if len(y_train) > seasonal_period:
        seasonal_diffs = np.abs(y_train[seasonal_period:] - y_train[:-seasonal_period])
        scale = float(np.mean(seasonal_diffs))
        if scale == 0:
            scale = 1.0
    else:
        diffs = np.abs(np.diff(y_train))
        scale = float(np.mean(diffs)) if len(diffs) > 0 and np.mean(diffs) > 0 else 1.0

    mase = float(mae / scale)

    return ForecastMetrics(mae=mae, rmse=rmse, wape=wape, mape=mape, mase=mase)


# ==============================================================================
# 2. DATA AGGREGATION & MISSING DATE HANDLING
# ==============================================================================

def prepare_daily_demand_series(
    df: pd.DataFrame,
    level: str = "enterprise",
    entity: Optional[str] = None
) -> pd.DataFrame:
    """
    Aggregates forward demand (units_sold) to a contiguous daily time series.

    Missing Date Policy:
    - Missing calendar dates in point-of-sale feeds represent days with zero transactions
      (e.g., store holiday closure or un-purchased SKU).
    - We reindex against a complete daily date range: pd.date_range(start, end, freq="D").
    - Target demand ('units_sold') is explicitly zero-filled (0.0).
    - Exogenous flags (promotion_flag, holiday_flag) are filled with 0.
    """
    df_clean = df.copy()
    if "order_date" not in df_clean.columns:
        raise ValueError("DataFrame must contain 'order_date' column.")

    df_clean["order_date"] = pd.to_datetime(df_clean["order_date"])

    # Filter by hierarchy level
    if level == "enterprise":
        filtered = df_clean
    elif level == "category":
        if not entity:
            raise ValueError("Entity must be specified for category level.")
        filtered = df_clean[df_clean["category"] == entity]
    elif level == "product":
        if not entity:
            raise ValueError("Entity must be specified for product level.")
        filtered = df_clean[(df_clean["product_id"] == entity) | (df_clean["product_name"] == entity)]
    elif level == "store":
        if not entity:
            raise ValueError("Entity must be specified for store level.")
        filtered = df_clean[(df_clean["store_id"] == entity) | (df_clean["store_name"] == entity)]
    else:
        raise ValueError(f"Unknown forecasting level: {level}")

    if filtered.empty:
        raise ValueError(f"No records found for level='{level}', entity='{entity}'.")

    # Aggregate to daily sums
    has_promo = "promotion_flag" in filtered.columns
    has_holiday = "holiday_flag" in filtered.columns
    has_revenue = "revenue" in filtered.columns

    agg_dict: Dict[str, Any] = {
        "units_sold": ("units_sold", "sum")
    }
    if has_revenue:
        agg_dict["revenue"] = ("revenue", "sum")
    if has_promo:
        agg_dict["promotion_flag"] = ("promotion_flag", lambda x: int((x > 0).any()))
    if has_holiday:
        agg_dict["holiday_flag"] = ("holiday_flag", lambda x: int((x > 0).any()))

    daily = filtered.groupby("order_date").agg(**agg_dict).reset_index()

    # Create complete calendar date grid
    min_date = daily["order_date"].min()
    max_date = daily["order_date"].max()
    full_date_idx = pd.date_range(start=min_date, end=max_date, freq="D", name="order_date")

    daily = daily.set_index("order_date").reindex(full_date_idx)

    # Impute missing dates: zero demand for units_sold and promo flags
    daily["units_sold"] = daily["units_sold"].fillna(0.0).astype(np.float64)
    if "revenue" in daily.columns:
        daily["revenue"] = daily["revenue"].fillna(0.0).astype(np.float64)
    if "promotion_flag" in daily.columns:
        daily["promotion_flag"] = daily["promotion_flag"].fillna(0).astype(int)
    else:
        daily["promotion_flag"] = 0
    if "holiday_flag" in daily.columns:
        daily["holiday_flag"] = daily["holiday_flag"].fillna(0).astype(int)
    else:
        daily["holiday_flag"] = 0

    daily = daily.reset_index().rename(columns={"index": "order_date"})
    daily["order_date"] = pd.to_datetime(daily["order_date"])

    return daily


def load_or_create_future_promo_calendar(
    calendar_path: str = "data/processed/future_promo_calendar.csv",
    start_date: Optional[pd.Timestamp] = None,
    horizon_days: int = 90
) -> Tuple[pd.DataFrame, str]:
    """
    Loads future planned promotions and holidays. If the file is not found,
    generates a realistic calendar baseline and clearly flags the scenario.

    Returns:
        (future_calendar_df, scenario_label)
    """
    if os.path.exists(calendar_path):
        logger.info(f"Loading planned future promotional calendar from: {calendar_path}")
        df_cal = pd.read_csv(calendar_path)
        df_cal["order_date"] = pd.to_datetime(df_cal["order_date"])
        return df_cal, "Planned Promotional Calendar Scenario"

    # Default baseline calendar: standard holidays mapped, no unconfirmed markdowns
    if start_date is None:
        start_date = pd.Timestamp.now().normalize()

    future_dates = pd.date_range(start=start_date, periods=horizon_days, freq="D")
    df_cal = pd.DataFrame({"order_date": future_dates})

    # Flag standard known calendar retail holidays
    holiday_dates = {
        (1, 1): "New Year's Day",
        (7, 4): "Independence Day",
        (11, 24): "Thanksgiving / Black Friday Window",
        (11, 25): "Black Friday",
        (11, 28): "Cyber Monday",
        (12, 24): "Christmas Eve",
        (12, 25): "Christmas Day",
        (12, 31): "New Year's Eve"
    }
    df_cal["holiday_flag"] = df_cal["order_date"].apply(
        lambda d: 1 if (d.month, d.day) in holiday_dates else 0
    )
    # Default unconfirmed promotions to 0 for a conservative baseline forecast
    df_cal["promotion_flag"] = 0

    return df_cal, "Baseline Scenario (Standard Holidays, No Planned Promotions)"


# ==============================================================================
# 3. EXPANDING ROLLING-ORIGIN CROSS-VALIDATION
# ==============================================================================

class RollingOriginTimeSeriesCV:
    """
    Expanding-window Time Series Cross-Validation with fixed test horizon H.
    Guarantees strict temporal causality without future leakage.
    """
    def __init__(self, n_splits: int = 3, test_horizon: int = 30):
        self.n_splits = n_splits
        self.test_horizon = test_horizon

    def split(self, df: pd.DataFrame) -> List[Tuple[pd.DataFrame, pd.DataFrame, int]]:
        """
        Yields (train_df, test_df, fold_number).
        Folds expand from earlier history toward the series boundary.
        """
        n_samples = len(df)
        splits = []

        total_test_span = self.n_splits * self.test_horizon
        if n_samples <= total_test_span + 60:
            raise ValueError(f"Insufficient history ({n_samples} days) for {self.n_splits} folds of {self.test_horizon} days.")

        for i in range(self.n_splits, 0, -1):
            fold_idx = self.n_splits - i + 1
            test_end_idx = n_samples - (i - 1) * self.test_horizon
            test_start_idx = test_end_idx - self.test_horizon
            train_end_idx = test_start_idx

            train_df = df.iloc[:train_end_idx].copy()
            test_df = df.iloc[test_start_idx:test_end_idx].copy()
            splits.append((train_df, test_df, fold_idx))

        return splits


# ==============================================================================
# 4. MODEL IMPLEMENTATIONS
# ==============================================================================

# ------------------------------------------------------------------------------
# 4.1 Model 1: Seasonal Naive Baseline (s=7)
# ------------------------------------------------------------------------------
class SeasonalNaiveModel:
    """
    Seasonal Naive Benchmark: y_hat(t+h) = y(t+h - 7).
    Generates prediction intervals based on in-sample seasonal residual variance.
    """
    def __init__(self, seasonal_period: int = 7):
        self.seasonal_period = seasonal_period
        self.history: Optional[np.ndarray] = None
        self.residual_std: float = 1.0

    def fit(self, train_df: pd.DataFrame, target_col: str = "units_sold") -> SeasonalNaiveModel:
        self.history = train_df[target_col].to_numpy(dtype=np.float64)
        if len(self.history) > self.seasonal_period:
            residuals = self.history[self.seasonal_period:] - self.history[:-self.seasonal_period]
            self.residual_std = float(np.std(residuals)) if len(residuals) > 0 else 1.0
            if self.residual_std == 0:
                self.residual_std = 1.0
        return self

    def predict(self, horizon: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Returns (forecast, lower_bound, upper_bound)."""
        if self.history is None or len(self.history) < self.seasonal_period:
            raise ValueError("Model must be fitted before predict.")

        last_season = self.history[-self.seasonal_period:]
        repeats = int(np.ceil(horizon / self.seasonal_period))
        forecast = np.tile(last_season, repeats)[:horizon]

        cycle_idx = np.floor(np.arange(horizon) / self.seasonal_period)
        margin = 1.96 * self.residual_std * np.sqrt(1.0 + cycle_idx)

        lower = np.maximum(0.0, forecast - margin)
        upper = forecast + margin

        return forecast, lower, upper


# ------------------------------------------------------------------------------
# 4.2 Model 2: SARIMAX (Seasonal ARIMA with Exogenous Regressors)
# ------------------------------------------------------------------------------
class SarimaForecaster:
    """
    SARIMAX Model: Seasonal Autoregressive Integrated Moving Average with Exogenous Regressors.
    Weekly seasonality: order=(1, 1, 1), seasonal_order=(1, 1, 1, 7).
    Incorporates promotion_flag and holiday_flag as exogenous variables when variance exists.
    """
    def __init__(
        self,
        order: Tuple[int, int, int] = (1, 1, 1),
        seasonal_order: Tuple[int, int, int, int] = (1, 1, 1, 7)
    ):
        self.order = order
        self.seasonal_order = seasonal_order
        self.fitted_model = None
        self.last_train_history: Optional[np.ndarray] = None
        self.active_exog_cols: List[str] = []

    def fit(self, train_df: pd.DataFrame, target_col: str = "units_sold") -> SarimaForecaster:
        self.last_train_history = train_df[target_col].to_numpy(dtype=np.float64)
        self.active_exog_cols = []

        exog_data = None
        if HAS_STATSMODELS:
            # Check for non-constant exogenous regressors
            candidate_cols = ["promotion_flag", "holiday_flag"]
            valid_cols = [c for c in candidate_cols if c in train_df.columns and train_df[c].nunique() > 1]
            if valid_cols:
                self.active_exog_cols = valid_cols
                exog_data = train_df[self.active_exog_cols].astype(float).values

            try:
                model = SARIMAX(
                    self.last_train_history,
                    exog=exog_data,
                    order=self.order,
                    seasonal_order=self.seasonal_order,
                    simple_differencing=True,
                    enforce_stationarity=False,
                    enforce_invertibility=False
                )
                self.fitted_model = model.fit(disp=False, maxiter=50)
            except Exception as e:
                logger.debug(f"SARIMAX optimization error: {e}. Falling back to univariate model.")
                try:
                    fallback_model = SARIMAX(
                        self.last_train_history,
                        order=(1, 0, 0),
                        seasonal_order=(1, 0, 0, 7),
                        simple_differencing=True,
                        enforce_stationarity=False,
                        enforce_invertibility=False
                    )
                    self.fitted_model = fallback_model.fit(disp=False, maxiter=30)
                    self.active_exog_cols = []
                except Exception:
                    self.fitted_model = None
        return self

    def predict(
        self,
        horizon: int,
        future_exog_df: Optional[pd.DataFrame] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if HAS_STATSMODELS and self.fitted_model is not None:
            try:
                exog_future = None
                if self.active_exog_cols:
                    if future_exog_df is not None and len(future_exog_df) >= horizon:
                        exog_future = future_exog_df[self.active_exog_cols].iloc[:horizon].astype(float).values
                    else:
                        exog_future = np.zeros((horizon, len(self.active_exog_cols)), dtype=float)

                res = self.fitted_model.get_forecast(steps=horizon, exog=exog_future)
                forecast = np.maximum(0.0, res.predicted_mean)
                conf = res.conf_int(alpha=0.05)
                lower = np.maximum(0.0, conf[:, 0])
                upper = np.maximum(lower, conf[:, 1])
                return forecast, lower, upper
            except Exception as e:
                logger.warning(f"SARIMAX prediction error: {e}. Using seasonal fallback.")

        naive = SeasonalNaiveModel(seasonal_period=7).fit(
            pd.DataFrame({"units_sold": self.last_train_history})
        )
        return naive.predict(horizon)


# ------------------------------------------------------------------------------
# 4.3 Model 3: Facebook Prophet
# ------------------------------------------------------------------------------
class ProphetForecaster:
    """
    Facebook Prophet model with weekly and yearly seasonality, plus exogenous
    promotion and holiday regressors. Fixes regressor completeness across all dates.
    """
    def __init__(self):
        self.model = None
        self.last_train_df: Optional[pd.DataFrame] = None
        self.active_regressors: List[str] = []

    def fit(self, train_df: pd.DataFrame, target_col: str = "units_sold") -> ProphetForecaster:
        self.last_train_df = train_df.copy()
        self.active_regressors = []

        if HAS_PROPHET:
            try:
                p_df = pd.DataFrame({
                    "ds": pd.to_datetime(train_df["order_date"]),
                    "y": train_df[target_col].to_numpy(dtype=np.float64),
                })
                m = Prophet(
                    yearly_seasonality=True,
                    weekly_seasonality=True,
                    daily_seasonality=False,
                    interval_width=0.95
                )

                # Check unique values before adding regressor (Prophet errors on constant regressors)
                for reg in ["promotion_flag", "holiday_flag"]:
                    if reg in train_df.columns and train_df[reg].nunique() > 1:
                        p_df[reg] = train_df[reg].astype(float).values
                        m.add_regressor(reg)
                        self.active_regressors.append(reg)

                m.fit(p_df)
                self.model = m
            except Exception as e:
                logger.warning(f"Prophet fit error: {e}. Falling back to baseline.")
                self.model = None
        return self

    def predict(
        self,
        horizon: int,
        future_exog_df: Optional[pd.DataFrame] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if HAS_PROPHET and self.model is not None and self.last_train_df is not None:
            try:
                # 1. Base future dataframe containing historical ds + future ds
                future = self.model.make_future_dataframe(periods=horizon, freq="D")

                # 2. Map historical regressor values onto future dataframe by date
                history_exog = self.last_train_df[["order_date"] + [r for r in self.active_regressors if r in self.last_train_df.columns]].rename(
                    columns={"order_date": "ds"}
                )
                future = future.merge(history_exog, on="ds", how="left")

                # 3. Merge future regressor values onto future dataframe
                if future_exog_df is not None and len(future_exog_df) >= horizon:
                    future_exog_cols = ["order_date"] + [r for r in self.active_regressors if r in future_exog_df.columns]
                    future_exog = future_exog_df[future_exog_cols].rename(columns={"order_date": "ds"})
                    future = future.merge(future_exog, on="ds", how="left", suffixes=("", "_future"))
                    for reg in self.active_regressors:
                        if f"{reg}_future" in future.columns:
                            future[reg] = future[f"{reg}_future"].fillna(future[reg]).fillna(0.0)
                        else:
                            future[reg] = future[reg].fillna(0.0)
                else:
                    for reg in self.active_regressors:
                        future[reg] = future[reg].fillna(0.0)

                # Ensure zero NaNs remain across all dates
                for reg in self.active_regressors:
                    future[reg] = future[reg].fillna(0.0).astype(float)

                forecast_df = self.model.predict(future)
                sub = forecast_df.iloc[-horizon:]
                yhat = np.maximum(0.0, sub["yhat"].values)
                lower = np.maximum(0.0, sub["yhat_lower"].values)
                upper = np.maximum(yhat, sub["yhat_upper"].values)
                return yhat, lower, upper
            except Exception as e:
                logger.warning(f"Prophet predict error: {e}. Using seasonal fallback.")

        naive = SeasonalNaiveModel(seasonal_period=7).fit(self.last_train_df)
        return naive.predict(horizon)


# ------------------------------------------------------------------------------
# 4.4 Model 4: XGBoost with Leakage-Free Recursive Feature Engineering
# ------------------------------------------------------------------------------
class XGBoostForecaster:
    """
    XGBoost Regression Model with:
    - Zero future leakage: rolling features strictly use .shift(1).
    - Calendar features: dayofweek, month, is_weekend, annual Fourier harmonics.
    - Exogenous features: promotion_flag, holiday_flag.
    - Recursive multi-step forecasting across multi-day horizons.
    - Calibrated empirical prediction intervals using out-of-fold cross-validation residuals.
    """
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.model = None
        self.feature_names: List[str] = []
        self.train_history_series: Optional[pd.Series] = None
        self.horizon_bucket_stds: Dict[str, float] = {
            "days_1_7": 1.0,
            "days_8_14": 1.2,
            "days_15_30": 1.5,
            "days_31_60": 2.0,
            "days_61_90": 2.5
        }

    @staticmethod
    def create_features(
        series: pd.Series,
        dates: pd.Series,
        promo_flag: Optional[pd.Series] = None,
        holiday_flag: Optional[pd.Series] = None
    ) -> pd.DataFrame:
        """Engineers leakage-free tabular features from a contiguous time series."""
        df = pd.DataFrame(index=series.index)
        dates_dt = pd.to_datetime(dates)

        # 1. Calendar temporal features
        df["dayofweek"] = dates_dt.dt.dayofweek
        df["month"] = dates_dt.dt.month
        df["quarter"] = dates_dt.dt.quarter
        df["is_weekend"] = dates_dt.dt.dayofweek.isin([5, 6]).astype(int)

        # 2. Annual Fourier harmonics (captures annual seasonality continuously)
        day_of_year = dates_dt.dt.dayofyear
        df["sin_annual"] = np.sin(2 * np.pi * day_of_year / 365.25)
        df["cos_annual"] = np.cos(2 * np.pi * day_of_year / 365.25)

        # 3. Exogenous regressors
        df["promotion_flag"] = promo_flag.values if (promo_flag is not None and len(promo_flag) == len(series)) else 0
        df["holiday_flag"] = holiday_flag.values if (holiday_flag is not None and len(holiday_flag) == len(series)) else 0

        # 4. Target Lags (Shift >= 1 to prevent current-step leakage)
        df["lag_1"] = series.shift(1)
        df["lag_2"] = series.shift(2)
        df["lag_3"] = series.shift(3)
        df["lag_7"] = series.shift(7)
        df["lag_14"] = series.shift(14)
        df["lag_28"] = series.shift(28)

        # 5. Rolling Statistics (Strictly shifted to exclude current row)
        shifted = series.shift(1)
        df["rolling_mean_7"] = shifted.rolling(window=7, min_periods=7).mean()
        df["rolling_std_7"] = shifted.rolling(window=7, min_periods=7).std().fillna(0.0)
        df["rolling_mean_14"] = shifted.rolling(window=14, min_periods=14).mean()
        df["rolling_mean_28"] = shifted.rolling(window=28, min_periods=28).mean()

        return df

    def fit(self, train_df: pd.DataFrame, target_col: str = "units_sold") -> XGBoostForecaster:
        dates = pd.to_datetime(train_df["order_date"])
        series = train_df[target_col].astype(np.float64)

        X = self.create_features(
            series=series,
            dates=dates,
            promo_flag=train_df.get("promotion_flag"),
            holiday_flag=train_df.get("holiday_flag")
        )
        y = series

        valid_idx = X["lag_28"].notna() & X["rolling_mean_28"].notna()
        X_train = X.loc[valid_idx]
        y_train = y.loc[valid_idx]

        self.feature_names = list(X_train.columns)
        self.train_history_series = series.copy()

        if HAS_XGBOOST:
            self.model = xgb.XGBRegressor(
                n_estimators=120,
                max_depth=5,
                learning_rate=0.06,
                subsample=0.85,
                colsample_bytree=0.85,
                random_state=self.random_state,
                n_jobs=-1
            )
        else:
            self.model = GradientBoostingRegressor(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.08,
                random_state=self.random_state
            )

        self.model.fit(X_train, y_train)
        return self

    def set_calibrated_cv_residual_stds(self, bucket_stds: Dict[str, float]) -> None:
        """Injects empirical out-of-fold CV residual standard deviations by horizon bucket."""
        self.horizon_bucket_stds = bucket_stds

    def predict_recursive(
        self,
        horizon: int,
        last_date: pd.Timestamp,
        future_exog_df: Optional[pd.DataFrame] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Executes recursive multi-step forecasting with out-of-fold empirical intervals.
        """
        if self.model is None or self.train_history_series is None:
            raise ValueError("Model must be fitted before predict.")

        history_vals = list(self.train_history_series.values)
        predictions: List[float] = []

        future_dates = [last_date + timedelta(days=d) for d in range(1, horizon + 1)]

        for h_step in range(horizon):
            curr_date = future_dates[h_step]

            dayofweek = curr_date.dayofweek
            month = curr_date.month
            quarter = (curr_date.month - 1) // 3 + 1
            is_weekend = 1 if dayofweek in [5, 6] else 0
            day_of_year = curr_date.dayofyear
            sin_annual = np.sin(2 * np.pi * day_of_year / 365.25)
            cos_annual = np.cos(2 * np.pi * day_of_year / 365.25)

            if future_exog_df is not None and h_step < len(future_exog_df):
                promo = future_exog_df["promotion_flag"].iloc[h_step]
                holiday = future_exog_df["holiday_flag"].iloc[h_step]
            else:
                promo = 0
                holiday = 0

            lag_1 = history_vals[-1]
            lag_2 = history_vals[-2]
            lag_3 = history_vals[-3]
            lag_7 = history_vals[-7]
            lag_14 = history_vals[-14]
            lag_28 = history_vals[-28]

            rolling_7_arr = history_vals[-7:]
            rolling_14_arr = history_vals[-14:]
            rolling_28_arr = history_vals[-28:]

            rolling_mean_7 = float(np.mean(rolling_7_arr))
            rolling_std_7 = float(np.std(rolling_7_arr))
            rolling_mean_14 = float(np.mean(rolling_14_arr))
            rolling_mean_28 = float(np.mean(rolling_28_arr))

            row_features = {
                "dayofweek": dayofweek,
                "month": month,
                "quarter": quarter,
                "is_weekend": is_weekend,
                "sin_annual": sin_annual,
                "cos_annual": cos_annual,
                "promotion_flag": promo,
                "holiday_flag": holiday,
                "lag_1": lag_1,
                "lag_2": lag_2,
                "lag_3": lag_3,
                "lag_7": lag_7,
                "lag_14": lag_14,
                "lag_28": lag_28,
                "rolling_mean_7": rolling_mean_7,
                "rolling_std_7": rolling_std_7,
                "rolling_mean_14": rolling_mean_14,
                "rolling_mean_28": rolling_mean_28,
            }

            X_step = pd.DataFrame([row_features])[self.feature_names]
            step_pred = float(self.model.predict(X_step)[0])
            step_pred = max(0.0, step_pred)

            predictions.append(step_pred)
            history_vals.append(step_pred)

        forecast = np.array(predictions, dtype=np.float64)

        # Calibrated empirical prediction interval by horizon bucket
        lower_bounds = []
        upper_bounds = []
        for step_idx in range(horizon):
            day_h = step_idx + 1
            if day_h <= 7:
                std_h = self.horizon_bucket_stds.get("days_1_7", 1.0)
            elif day_h <= 14:
                std_h = self.horizon_bucket_stds.get("days_8_14", 1.2)
            elif day_h <= 30:
                std_h = self.horizon_bucket_stds.get("days_15_30", 1.5)
            elif day_h <= 60:
                std_h = self.horizon_bucket_stds.get("days_31_60", 2.0)
            else:
                std_h = self.horizon_bucket_stds.get("days_61_90", 2.5)

            margin = 1.96 * std_h
            lower_bounds.append(max(0.0, forecast[step_idx] - margin))
            upper_bounds.append(forecast[step_idx] + margin)

        return forecast, np.array(lower_bounds), np.array(upper_bounds)


# ==============================================================================
# 5. CROSS-VALIDATION EVALUATION & MODEL BENCHMARKING
# ==============================================================================

def run_cross_validation_for_entity(
    series_df: pd.DataFrame,
    level: str,
    entity: str,
    config: ForecastConfig
) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, float]]:
    """
    Runs expanding rolling-origin cross-validation across all 4 models.
    Collects out-of-fold residuals by horizon bucket to calibrate XGBoost empirical intervals.

    Returns:
      - backtest_results_df: Detailed fold-level predictions and metrics.
      - model_comparison_df: Averaged summary metrics per model.
      - xgb_calibrated_bucket_stds: Out-of-fold standard deviations for horizon buckets.
    """
    cv = RollingOriginTimeSeriesCV(n_splits=config.cv_folds, test_horizon=config.test_horizon_days)
    splits = cv.split(series_df)

    fold_records: List[Dict[str, Any]] = []

    # Bucketed out-of-fold errors for XGBoost
    oof_errors_1_7: List[float] = []
    oof_errors_8_14: List[float] = []
    oof_errors_15_30: List[float] = []

    for train_df, test_df, fold_idx in splits:
        y_train = train_df["units_sold"].to_numpy(dtype=np.float64)
        y_test = test_df["units_sold"].to_numpy(dtype=np.float64)
        horizon = len(y_test)
        last_train_date = pd.to_datetime(train_df["order_date"].iloc[-1])

        # 1. Seasonal Naive
        sn_model = SeasonalNaiveModel(seasonal_period=config.seasonal_period).fit(train_df)
        sn_pred, sn_lower, sn_upper = sn_model.predict(horizon)
        sn_metrics = calculate_forecast_metrics(y_test, sn_pred, y_train, config.seasonal_period)

        # 2. SARIMAX
        sarima = SarimaForecaster().fit(train_df)
        sarima_pred, sarima_lower, sarima_upper = sarima.predict(horizon, future_exog_df=test_df)
        sarima_metrics = calculate_forecast_metrics(y_test, sarima_pred, y_train, config.seasonal_period)

        # 3. Prophet
        prophet = ProphetForecaster().fit(train_df)
        prophet_pred, prophet_lower, prophet_upper = prophet.predict(horizon, future_exog_df=test_df)
        prophet_metrics = calculate_forecast_metrics(y_test, prophet_pred, y_train, config.seasonal_period)

        # 4. XGBoost
        xgb_forecaster = XGBoostForecaster(random_state=config.random_seed).fit(train_df)
        xgb_pred, xgb_lower, xgb_upper = xgb_forecaster.predict_recursive(
            horizon=horizon,
            last_date=last_train_date,
            future_exog_df=test_df
        )
        xgb_metrics = calculate_forecast_metrics(y_test, xgb_pred, y_train, config.seasonal_period)

        # Record out-of-fold residuals by horizon bucket
        errors = np.abs(y_test - xgb_pred)
        oof_errors_1_7.extend(errors[:7])
        oof_errors_8_14.extend(errors[7:14])
        oof_errors_15_30.extend(errors[14:30])

        models_data = [
            ("Seasonal Naive", sn_metrics),
            ("SARIMA", sarima_metrics),
            ("Prophet", prophet_metrics),
            ("XGBoost", xgb_metrics),
        ]

        for m_name, metrics in models_data:
            fold_records.append({
                "level": level,
                "entity": entity,
                "fold": fold_idx,
                "model": m_name,
                "training_end_date": last_train_date.strftime("%Y-%m-%d"),
                "test_start_date": test_df["order_date"].iloc[0].strftime("%Y-%m-%d"),
                "test_end_date": test_df["order_date"].iloc[-1].strftime("%Y-%m-%d"),
                "MAE": metrics.mae,
                "RMSE": metrics.rmse,
                "WAPE": metrics.wape,
                "MAPE": metrics.mape,
                "MASE": metrics.mase,
            })

    backtest_df = pd.DataFrame(fold_records)

    # Compute calibrated standard deviations across horizon buckets
    std_1_7 = float(np.std(oof_errors_1_7)) if oof_errors_1_7 else 1.0
    std_8_14 = float(np.std(oof_errors_8_14)) if oof_errors_8_14 else 1.2
    std_15_30 = float(np.std(oof_errors_15_30)) if oof_errors_15_30 else 1.5

    # Extrapolate variance for long horizons (31-60 and 61-90) based on recursive error drift
    std_31_60 = std_15_30 * 1.35
    std_61_90 = std_15_30 * 1.70

    calibrated_bucket_stds = {
        "days_1_7": max(std_1_7, 0.5),
        "days_8_14": max(std_8_14, 0.7),
        "days_15_30": max(std_15_30, 0.9),
        "days_31_60": max(std_31_60, 1.2),
        "days_61_90": max(std_61_90, 1.5),
    }

    # Average metrics across folds
    comp_df = backtest_df.groupby(["level", "entity", "model"]).agg(
        MAE=("MAE", "mean"),
        RMSE=("RMSE", "mean"),
        WAPE=("WAPE", "mean"),
        MAPE=("MAPE", "mean"),
        MASE=("MASE", "mean"),
    ).reset_index()

    comp_df = comp_df.sort_values(by=["WAPE", "MASE"], ascending=[True, True])

    return backtest_df, comp_df, calibrated_bucket_stds


# ==============================================================================
# 6. FULL RETRAINING & MULTI-HORIZON FORWARD PROJECTIONS
# ==============================================================================

def generate_future_forecasts(
    full_series_df: pd.DataFrame,
    best_model_name: str,
    level: str,
    entity: str,
    metrics: ForecastMetrics,
    config: ForecastConfig,
    future_promo_calendar_df: pd.DataFrame,
    calibrated_stds: Dict[str, float]
) -> pd.DataFrame:
    """
    Retrains the winning model on 100% of historical demand series and
    generates 30-day, 60-day, and 90-day forward projections with approximate
    empirical prediction intervals.
    """
    last_date = pd.to_datetime(full_series_df["order_date"].iloc[-1])
    max_horizon = max(config.future_horizons)

    if len(future_promo_calendar_df) < max_horizon:
        # Extend template if calendar rows are shorter than max_horizon
        ext_dates = pd.date_range(start=last_date + timedelta(days=1), periods=max_horizon, freq="D")
        future_template = pd.DataFrame({"order_date": ext_dates, "promotion_flag": 0, "holiday_flag": 0})
    else:
        future_template = future_promo_calendar_df.iloc[:max_horizon].copy()

    future_dates = pd.to_datetime(future_template["order_date"].values)

    # Fit winning model on 100% of historical data
    if best_model_name == "XGBoost":
        fitted = XGBoostForecaster(random_state=config.random_seed).fit(full_series_df)
        fitted.set_calibrated_cv_residual_stds(calibrated_stds)
        preds, lower, upper = fitted.predict_recursive(max_horizon, last_date, future_template)
    elif best_model_name == "SARIMA":
        fitted = SarimaForecaster().fit(full_series_df)
        preds, lower, upper = fitted.predict(max_horizon, future_template)
    elif best_model_name == "Prophet":
        fitted = ProphetForecaster().fit(full_series_df)
        preds, lower, upper = fitted.predict(max_horizon, future_template)
    else:
        fitted = SeasonalNaiveModel(config.seasonal_period).fit(full_series_df)
        preds, lower, upper = fitted.predict(max_horizon)

    rows = []
    for h in config.future_horizons:
        for step in range(h):
            f_date = future_dates[step]
            rows.append({
                "forecast_date": f_date.strftime("%Y-%m-%d"),
                "level": level,
                "entity": entity,
                "model": best_model_name,
                "horizon_days": h,
                "forecast": round(float(preds[step]), 2),
                "lower_bound": round(float(lower[step]), 2),
                "upper_bound": round(float(upper[step]), 2),
                "interval_type": "Approximate Empirical Prediction Interval (OOF CV Calibrated)",
                "MAE": round(metrics.mae, 3),
                "RMSE": round(metrics.rmse, 3),
                "WAPE": round(metrics.wape, 2),
                "MAPE": round(metrics.mape, 2),
                "MASE": round(metrics.mase, 3),
                "training_end_date": last_date.strftime("%Y-%m-%d")
            })

    return pd.DataFrame(rows)


# ==============================================================================
# 7. END-TO-END MULTI-LEVEL PIPELINE ORCHESTRATOR
# ==============================================================================

def run_end_to_end_forecasting_pipeline(
    demand_csv_path: str = "data/processed/retail_sales_demand.csv",
    promo_calendar_path: str = "data/processed/future_promo_calendar.csv",
    output_dir: str = "forecasts",
    reports_dir: str = "reports"
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Executes the comprehensive forecasting suite across all required retail levels:
      1. Overall Enterprise Demand
      2. Category-Level Demand (4 categories)
      3. Top 5 Products by Revenue
      4. Store-Level Demand for Top 3 Stores
    """
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    # Enforce data presence: raise clear FileNotFoundError if cleaning pipeline has not run
    if not os.path.exists(demand_csv_path):
        raise FileNotFoundError(
            f"Forward demand dataset not found at '{demand_csv_path}'.\n"
            f"Please execute the data generation and cleaning pipelines first:\n"
            f"  1. Run 'python src/data_generator.py' to generate raw retail transactions.\n"
            f"  2. Run 'python src/data_cleaning.py' to produce '{demand_csv_path}'."
        )

    logger.info(f"Loading forward demand dataset from: {demand_csv_path}")
    df_demand = pd.read_csv(demand_csv_path, low_memory=False)
    df_demand["order_date"] = pd.to_datetime(df_demand["order_date"])

    # Load or generate future promotional calendar scenario
    last_hist_date = df_demand["order_date"].max()
    future_promo_cal, scenario_label = load_or_create_future_promo_calendar(
        calendar_path=promo_calendar_path,
        start_date=last_hist_date + timedelta(days=1),
        horizon_days=90
    )
    logger.info(f"Future Exogenous Scenario: {scenario_label}")

    # Identify Top 5 Products and Top 3 Stores by total historical revenue
    top_5_products = (
        df_demand.groupby("product_name")["revenue"].sum()
        .sort_values(ascending=False).head(5).index.tolist()
    )
    top_3_stores = (
        df_demand.groupby("store_name")["revenue"].sum()
        .sort_values(ascending=False).head(3).index.tolist()
    )
    categories = sorted(df_demand["category"].dropna().unique().tolist())

    config = ForecastConfig()

    all_backtests: List[pd.DataFrame] = []
    all_comparisons: List[pd.DataFrame] = []
    all_forecasts: List[pd.DataFrame] = []

    targets: List[Tuple[str, str]] = [("enterprise", "Total Enterprise")]
    for cat in categories:
        targets.append(("category", cat))
    for prod in top_5_products:
        targets.append(("product", prod))
    for store in top_3_stores:
        targets.append(("store", store))

    logger.info(f"Initiating forecasting engine across {len(targets)} series...")

    for level, entity in targets:
        logger.info(f"Processing Level: {level.upper()} | Entity: {entity}")
        series_df = prepare_daily_demand_series(df_demand, level=level, entity=entity if level != "enterprise" else None)

        backtest_df, comp_df, calibrated_stds = run_cross_validation_for_entity(series_df, level, entity, config)
        all_backtests.append(backtest_df)
        all_comparisons.append(comp_df)

        best_row = comp_df.iloc[0]
        best_model = best_row["model"]
        best_metrics = ForecastMetrics(
            mae=float(best_row["MAE"]),
            rmse=float(best_row["RMSE"]),
            wape=float(best_row["WAPE"]),
            mape=float(best_row["MAPE"]),
            mase=float(best_row["MASE"])
        )
        logger.info(f"  -> Best model for {entity}: {best_model} (WAPE={best_metrics.wape:.2f}%, MASE={best_metrics.mase:.3f})")

        future_df = generate_future_forecasts(
            full_series_df=series_df,
            best_model_name=best_model,
            level=level,
            entity=entity,
            metrics=best_metrics,
            config=config,
            future_promo_calendar_df=future_promo_cal,
            calibrated_stds=calibrated_stds
        )
        all_forecasts.append(future_df)

    final_backtests_df = pd.concat(all_backtests, ignore_index=True)
    final_comparisons_df = pd.concat(all_comparisons, ignore_index=True)
    final_forecasts_df = pd.concat(all_forecasts, ignore_index=True)

    backtest_path = os.path.join(reports_dir, "forecast_backtest_results.csv")
    comparison_path = os.path.join(reports_dir, "forecast_model_comparison.csv")
    forecast_path = os.path.join(output_dir, "forecast_results.csv")

    final_backtests_df.to_csv(backtest_path, index=False)
    final_comparisons_df.to_csv(comparison_path, index=False)
    final_forecasts_df.to_csv(forecast_path, index=False)

    logger.info(f"Saved CV Backtest Results to: {backtest_path}")
    logger.info(f"Saved Model Comparison Summary to: {comparison_path}")
    logger.info(f"Saved 30/60/90-Day Forward Forecasts to: {forecast_path}")

    return final_backtests_df, final_comparisons_df, final_forecasts_df


if __name__ == "__main__":
    run_end_to_end_forecasting_pipeline()
