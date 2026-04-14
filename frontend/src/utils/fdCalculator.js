const FALLBACK_FD_RATES = [
  { bank: "Unity Small Finance Bank", rate: 9.0 },
  { bank: "Suryoday Small Finance Bank", rate: 8.5 },
  { bank: "ESAF Small Finance Bank", rate: 8.25 },
  { bank: "Utkarsh Small Finance Bank", rate: 8.0 },
  { bank: "State Bank of India", rate: 6.8 },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function calculateFDMaturity(amount, rate, months) {
  const principal = toNumber(amount);
  const annualRate = toNumber(rate);
  const durationMonths = toNumber(months);

  if (principal <= 0 || annualRate <= 0 || durationMonths <= 0) {
    return { maturity: 0, profit: 0, effectiveRate: 0 };
  }

  const maturity = Math.round(principal * Math.pow(1 + annualRate / 100 / 12, durationMonths));
  const profit = Math.max(0, maturity - principal);
  const effectiveRate = Number((Math.pow(maturity / principal, 12 / durationMonths) - 1).toFixed(4));

  return { maturity, profit, effectiveRate };
}

export function compareBanks(amount, months, rates = FALLBACK_FD_RATES, top = 3) {
  return rates
    .map((item) => {
      const calc = calculateFDMaturity(amount, item.rate, months);
      return {
        bank: item.bank,
        rate: item.rate,
        maturity: calc.maturity,
      };
    })
    .sort((a, b) => b.maturity - a.maturity)
    .slice(0, top);
}

export const FD_RATES = [
  { name: "Unity Small Finance Bank", rate: 9.0, badge: "सबसे अच्छा", color: "#10b981" },
  { name: "Suryoday Small Finance Bank", rate: 8.5, badge: "", color: "#10b981" },
  { name: "ESAF Small Finance Bank", rate: 8.25, badge: "", color: "#10b981" },
  { name: "Utkarsh Small Finance Bank", rate: 8.0, badge: "", color: "#f59e0b" },
  { name: "AU Small Finance Bank", rate: 7.75, badge: "", color: "#f59e0b" },
  { name: "State Bank of India", rate: 6.8, badge: "सबसे सुरक्षित", color: "#6b7280" },
];
