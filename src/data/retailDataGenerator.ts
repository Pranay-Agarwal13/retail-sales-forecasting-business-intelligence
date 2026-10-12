/**
 * Browser-compatible Retail Sales Generator & Cleaning Engine (Revised)
 * Preserves RETURN transactions for retail BI & net revenue analysis,
 * isolates clean SALE records for unpolluted demand forecasting,
 * stores unit_cost in catalog, and recomputes profit explicitly.
 */

export interface RetailTransaction {
  order_id: string;
  original_order_id?: string | null;
  order_date: string;
  store_id: string;
  store_name: string;
  region: 'North' | 'South' | 'East' | 'West';
  product_id: string;
  product_name: string;
  category: string;
  sub_category: string;
  transaction_type: 'SALE' | 'RETURN';
  units_sold: number;
  unit_price: number;
  unit_cost: number;
  discount: number;
  revenue: number;
  profit: number;
  promotion_flag: number;
  holiday_flag: number;
  // Derived columns (after cleaning)
  year?: number;
  month?: number;
  quarter?: number;
  week?: number;
  day_of_week?: string;
  is_weekend?: number;
  profit_margin?: number;
}

export interface CleaningAuditReport {
  raw_count: number;
  clean_count: number;
  sales_count: number;
  returns_count: number;
  duplicates_purged: number;
  corrupt_dates_purged: number;
  corrupt_records_purged: number;
  missing_values_imputed: number;
  gross_revenue: number;
  return_revenue: number;
  net_revenue: number;
  net_profit: number;
  return_rate_pct: number;
  avg_profit_margin: number;
  date_min: string;
  date_max: string;
}

export const PRODUCT_CATALOG_MASTER = [
  { id: 'PROD-EL-001', name: 'UltraHD 55-inch 4K Smart TV', cat: 'Electronics', sub: 'Televisions', price: 499.99, cogs_pct: 0.68 },
  { id: 'PROD-EL-002', name: 'Noise-Cancelling Wireless Headphones', cat: 'Electronics', sub: 'Audio', price: 199.99, cogs_pct: 0.52 },
  { id: 'PROD-EL-003', name: 'Bluetooth Portable Speaker', cat: 'Electronics', sub: 'Audio', price: 79.99, cogs_pct: 0.48 },
  { id: 'PROD-EL-004', name: '14-inch Productivity Laptop', cat: 'Electronics', sub: 'Computers', price: 799.99, cogs_pct: 0.72 },
  { id: 'PROD-AP-001', name: 'Classic Crewneck Cotton T-Shirt', cat: 'Apparel', sub: 'Tops', price: 24.50, cogs_pct: 0.35 },
  { id: 'PROD-AP-002', name: 'Slim-Fit Denim Jeans', cat: 'Apparel', sub: 'Bottoms', price: 68.00, cogs_pct: 0.38 },
  { id: 'PROD-AP-003', name: 'Weatherproof Parka Jacket', cat: 'Apparel', sub: 'Outerwear', price: 149.00, cogs_pct: 0.45 },
  { id: 'PROD-HK-001', name: '12-Cup Programmable Coffee Maker', cat: 'Home & Kitchen', sub: 'Appliances', price: 89.99, cogs_pct: 0.55 },
  { id: 'PROD-HK-002', name: 'Non-Stick Cookware Set (10-Pc)', cat: 'Home & Kitchen', sub: 'Cookware', price: 129.99, cogs_pct: 0.50 },
  { id: 'PROD-HK-003', name: 'Memory Foam Queen Bed Pillow', cat: 'Home & Kitchen', sub: 'Bedding', price: 45.00, cogs_pct: 0.40 },
  { id: 'PROD-BP-001', name: 'Hydrating Facial Cleanser (200ml)', cat: 'Beauty & Personal Care', sub: 'Skincare', price: 18.50, cogs_pct: 0.28 },
  { id: 'PROD-BP-002', name: 'Botanical Nourishing Shampoo', cat: 'Beauty & Personal Care', sub: 'Haircare', price: 22.00, cogs_pct: 0.30 },
  { id: 'PROD-BP-003', name: 'Sonic Electric Toothbrush', cat: 'Beauty & Personal Care', sub: 'Dental Care', price: 64.99, cogs_pct: 0.45 },
];

export const STORE_NETWORK_MASTER = [
  { id: 'STR-101', name: 'Downtown Metro Flagship', region: 'East' as const, traffic: 1.45 },
  { id: 'STR-102', name: 'Suburban Galleria Mall', region: 'East' as const, traffic: 1.15 },
  { id: 'STR-201', name: 'Pacific Coast Superstore', region: 'West' as const, traffic: 1.35 },
  { id: 'STR-202', name: 'Silicon Valley Outlet', region: 'West' as const, traffic: 1.20 },
  { id: 'STR-301', name: 'Midwest Commerce Plaza', region: 'North' as const, traffic: 0.95 },
  { id: 'STR-401', name: 'Sunbelt Retail Commons', region: 'South' as const, traffic: 1.10 },
];

function checkHoliday(month: number, day: number, dayOfWeek: number): [number, string] {
  if (month === 1 && day === 1) return [1, "New Year's Day"];
  if (month === 2 && day === 14) return [1, "Valentine's Day"];
  if (month === 7 && day === 4) return [1, "Independence Day"];
  if (month === 11 && dayOfWeek === 4 && day >= 23 && day <= 29) return [1, "Black Friday"];
  if (month === 11 && dayOfWeek === 0 && day >= 26 && day <= 30) return [1, "Cyber Monday"];
  if (month === 12 && (day === 24 || day === 25)) return [1, "Christmas"];
  if (month === 12 && day === 31) return [1, "New Year's Eve"];
  return [0, ''];
}

export function simulateSyntheticData(sampleDays: number = 365 * 3, injectDirty: boolean = true) {
  const records: RetailTransaction[] = [];
  const startDate = new Date('2021-01-01T00:00:00Z');
  const numDays = Math.min(sampleDays, 1095);

  for (let d = 0; d < numDays; d++) {
    const curr = new Date(startDate.getTime() + d * 86400000);
    const year = curr.getUTCFullYear();
    const month = curr.getUTCMonth() + 1;
    const day = curr.getUTCDate();
    const dayOfWeek = curr.getUTCDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const yearMultiplier = 1.0 + (year - 2021) * 0.075;
    const dowWeights = [0.85, 0.90, 0.92, 1.00, 1.25, 1.45, 1.30];
    const dowFactor = dowWeights[isoDayOfWeek];

    const dayOfYear = Math.floor((curr.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / 86400000) + 1;
    let annualCycle = 1.0 + 0.15 * Math.sin((2 * Math.PI * (dayOfYear - 80)) / 365.25);
    if (month === 11) annualCycle += 0.35;
    if (month === 12) annualCycle += 0.45;

    const [isHoliday, holidayName] = checkHoliday(month, day, isoDayOfWeek);
    const holidayMult = holidayName === 'Black Friday' ? 1.7 : isHoliday ? 1.3 : 1.0;

    for (const store of STORE_NETWORK_MASTER) {
      const sampledProducts = PRODUCT_CATALOG_MASTER.slice(0, 4);
      for (const prod of sampledProducts) {
        const isPromo = (month >= 11 || isHoliday || isoDayOfWeek >= 4) && Math.random() < 0.25 ? 1 : 0;
        const discount = isPromo ? [0.10, 0.15, 0.20, 0.30][Math.floor(Math.random() * 4)] : 0;

        const baseUnits = prod.cat === 'Electronics' ? 2.2 : prod.cat === 'Apparel' ? 5.5 : 3.8;
        const promoMult = isPromo ? 1 + discount * 2.2 : 1.0;
        const expected = baseUnits * store.traffic * yearMultiplier * dowFactor * annualCycle * holidayMult * promoMult;
        
        const units = Math.max(1, Math.round(expected + (Math.random() - 0.5) * 3));
        let price = prod.price;
        if (year === 2022) price = Number((price * 1.03).toFixed(2));
        if (year === 2023) price = Number((price * 1.06).toFixed(2));

        const unitCost = Number((price * prod.cogs_pct).toFixed(2));
        const revenue = Number((units * price * (1 - discount)).toFixed(2));
        const profit = Number((revenue - (units * unitCost)).toFixed(2));
        const dateStr = curr.toISOString().split('T')[0];
        const saleOrderId = `ORD-${year}-${String(records.length + 1).padStart(6, '0')}`;

        // 1. Regular SALE transaction
        records.push({
          order_id: saleOrderId,
          original_order_id: null,
          order_date: dateStr,
          store_id: store.id,
          store_name: store.name,
          region: store.region,
          product_id: prod.id,
          product_name: prod.name,
          category: prod.cat,
          sub_category: prod.sub,
          transaction_type: 'SALE',
          units_sold: units,
          unit_price: price,
          unit_cost: unitCost,
          discount: discount,
          revenue: revenue,
          profit: profit,
          promotion_flag: isPromo,
          holiday_flag: isHoliday,
        });

        // 2. Realistic RETURN transaction generation (~3.5% return frequency for retail)
        if (Math.random() < 0.035) {
          const returnUnits = Math.min(units, Math.max(1, Math.floor(Math.random() * 2) + 1));
          const refundRevenue = -Number((returnUnits * price * (1 - discount)).toFixed(2));
          // Refund cost reversal
          const refundProfit = Number((refundRevenue - (-returnUnits * unitCost)).toFixed(2));
          const returnOrderId = `RET-${year}-${String(records.length + 1).padStart(6, '0')}`;

          records.push({
            order_id: returnOrderId,
            original_order_id: saleOrderId, // Preserves the link back to original sale transaction!
            order_date: dateStr,
            store_id: store.id,
            store_name: store.name,
            region: store.region,
            product_id: prod.id,
            product_name: prod.name,
            category: prod.cat,
            sub_category: prod.sub,
            transaction_type: 'RETURN',
            units_sold: -returnUnits,
            unit_price: price,
            unit_cost: unitCost,
            discount: 0.0,
            revenue: refundRevenue,
            profit: refundProfit,
            promotion_flag: isPromo,
            holiday_flag: isHoliday,
          });
        }
      }
    }
  }

  // Inject dirty records to validate pipeline
  let rawRecords = [...records];
  if (injectDirty && rawRecords.length > 50) {
    // 1. Exact duplicates
    const dupCount = Math.floor(rawRecords.length * 0.012);
    for (let i = 0; i < dupCount; i++) {
      const idx = Math.floor(Math.random() * rawRecords.length);
      rawRecords.push({ ...rawRecords[idx] });
    }

    // 2. Corrupt date formats
    const badDateIndices = [4, 18, 32];
    for (const bIdx of badDateIndices) {
      if (bIdx < rawRecords.length) {
        rawRecords[bIdx].order_date = '2022-13-45_CORRUPT';
      }
    }

    // 3. Null values in non-critical store name
    const nullStoreIndices = [7, 21];
    for (const sIdx of nullStoreIndices) {
      if (sIdx < rawRecords.length) {
        // @ts-ignore
        rawRecords[sIdx].store_name = null;
      }
    }
  }

  return { rawRecords };
}

export function cleanRetailData(rawRecords: RetailTransaction[]): {
  cleanRecords: RetailTransaction[];
  demandRecords: RetailTransaction[];
  audit: CleaningAuditReport;
} {
  const initialCount = rawRecords.length;
  let corruptDatesCount = 0;
  let duplicatesCount = 0;
  let corruptRecordsCount = 0;
  let missingImputedCount = 0;

  // 1. Parse and validate dates
  const validDateRecords: RetailTransaction[] = [];
  for (const r of rawRecords) {
    if (!r.order_date || r.order_date.includes('CORRUPT') || isNaN(Date.parse(r.order_date))) {
      corruptDatesCount++;
      continue;
    }
    validDateRecords.push(r);
  }

  // 2. Deduplication
  const seenKeys = new Set<string>();
  const deduplicated: RetailTransaction[] = [];
  for (const r of validDateRecords) {
    const key = `${r.order_date}_${r.store_id}_${r.product_id}_${r.transaction_type}_${r.units_sold}_${r.revenue}`;
    if (seenKeys.has(key)) {
      duplicatesCount++;
    } else {
      seenKeys.add(key);
      deduplicated.push(r);
    }
  }

  // 3. Validate logical integrity:
  // - SALE must have units_sold > 0, revenue >= 0
  // - RETURN must have units_sold < 0, revenue <= 0
  // - unit_price > 0 and unit_cost > 0
  const validatedRecords: RetailTransaction[] = [];
  for (const r of deduplicated) {
    if (!r.unit_price || r.unit_price <= 0 || !r.unit_cost || r.unit_cost <= 0) {
      corruptRecordsCount++;
      continue;
    }

    // Check transaction type consistency
    const isSale = r.transaction_type === 'SALE' && r.units_sold > 0;
    const isReturn = r.transaction_type === 'RETURN' && r.units_sold < 0;

    if (!isSale && !isReturn) {
      // Discard ill-formed anomalies (e.g., negative sale with no return label or vice versa)
      corruptRecordsCount++;
      continue;
    }

    validatedRecords.push(r);
  }

  // 4. Impute missing & Feature Engineering
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const cleanRecords: RetailTransaction[] = validatedRecords.map((r) => {
    const d = new Date(r.order_date + 'T00:00:00Z');
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const quarter = Math.ceil(month / 3);
    const dayOfWeekNum = d.getUTCDay();
    const dayOfWeek = dayNames[dayOfWeekNum];
    const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6 ? 1 : 0;

    // ISO week calculation
    const tempDate = new Date(d.getTime());
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - (tempDate.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

    // Explicit re-computation of revenue and profit using unit_cost:
    // Retail refund rule: for RETURN, discount is forced to 0.0
    const discount = r.transaction_type === 'RETURN' ? 0.0 : (r.discount || 0);
    const recomputedRevenue = Number((r.units_sold * r.unit_price * (1.0 - discount)).toFixed(2));
    const totalCost = Number((r.units_sold * r.unit_cost).toFixed(2));
    const recomputedProfit = Number((recomputedRevenue - totalCost).toFixed(2));

    // Profit margin calculation: ONLY for SALE transactions with positive revenue; undefined for returns
    const profitMargin =
      r.transaction_type === 'SALE' && recomputedRevenue > 0
        ? Number((recomputedProfit / recomputedRevenue).toFixed(4))
        : undefined;

    if (!r.store_name) missingImputedCount++;

    return {
      ...r,
      discount,
      store_name: r.store_name || 'Store ' + r.store_id,
      revenue: recomputedRevenue,
      profit: recomputedProfit,
      year,
      month,
      quarter,
      week,
      day_of_week: dayOfWeek,
      is_weekend: isWeekend,
      profit_margin: profitMargin,
    };
  });

  // Demand-only dataframe for forecasting (SALE only, zero return pollution)
  const demandRecords = cleanRecords.filter((r) => r.transaction_type === 'SALE');

  // Calculate audit aggregations
  let grossRev = 0;
  let returnRev = 0;
  let netProf = 0;
  let salesCount = 0;
  let returnsCount = 0;
  let minDate = cleanRecords[0]?.order_date || '';
  let maxDate = cleanRecords[0]?.order_date || '';

  for (const r of cleanRecords) {
    if (r.transaction_type === 'SALE') {
      grossRev += r.revenue;
      salesCount++;
    } else {
      returnRev += Math.abs(r.revenue);
      returnsCount++;
    }
    netProf += r.profit;
    if (r.order_date < minDate) minDate = r.order_date;
    if (r.order_date > maxDate) maxDate = r.order_date;
  }

  const netRev = grossRev - returnRev;
  const returnRatePct = grossRev > 0 ? (returnRev / grossRev) * 100 : 0;
  const avgMargin = netRev > 0 ? netProf / netRev : 0;

  const audit: CleaningAuditReport = {
    raw_count: initialCount,
    clean_count: cleanRecords.length,
    sales_count: salesCount,
    returns_count: returnsCount,
    duplicates_purged: duplicatesCount,
    corrupt_dates_purged: corruptDatesCount,
    corrupt_records_purged: corruptRecordsCount,
    missing_values_imputed: missingImputedCount,
    gross_revenue: Number(grossRev.toFixed(2)),
    return_revenue: Number(returnRev.toFixed(2)),
    net_revenue: Number(netRev.toFixed(2)),
    net_profit: Number(netProf.toFixed(2)),
    return_rate_pct: Number(returnRatePct.toFixed(2)),
    avg_profit_margin: Number(avgMargin.toFixed(4)),
    date_min: minDate,
    date_max: maxDate,
  };

  return { cleanRecords, demandRecords, audit };
}

export function exportToCsvString(data: RetailTransaction[]): string {
  if (data.length === 0) return '';
  const headers = [
    'order_id',
    'original_order_id',
    'order_date',
    'store_id',
    'store_name',
    'region',
    'product_id',
    'product_name',
    'category',
    'sub_category',
    'transaction_type',
    'units_sold',
    'unit_price',
    'unit_cost',
    'discount',
    'revenue',
    'profit',
    'promotion_flag',
    'holiday_flag',
    'year',
    'month',
    'quarter',
    'week',
    'day_of_week',
    'is_weekend',
    'profit_margin'
  ];

  const rows = data.map((r) =>
    [
      r.order_id,
      r.original_order_id ?? '',
      r.order_date,
      r.store_id,
      `"${r.store_name.replace(/"/g, '""')}"`,
      r.region,
      r.product_id,
      `"${r.product_name.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      `"${r.sub_category}"`,
      r.transaction_type,
      r.units_sold,
      r.unit_price,
      r.unit_cost,
      r.discount,
      r.revenue,
      r.profit,
      r.promotion_flag,
      r.holiday_flag,
      r.year ?? '',
      r.month ?? '',
      r.quarter ?? '',
      r.week ?? '',
      r.day_of_week ?? '',
      r.is_weekend ?? '',
      r.profit_margin ?? '',
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
