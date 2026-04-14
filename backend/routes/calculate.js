import { Router } from "express";
import { FD_BANKS } from "../prompts/system.js";

const router = Router();

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const calculateMaturity = (amount, rate, months) =>
  Math.round(amount * Math.pow(1 + rate / 100 / 12, months));

router.post("/", (request, response) => {
  const amount = safeNumber(request.body?.amount);
  const rate = safeNumber(request.body?.rate);
  const months = safeNumber(request.body?.months);

  if (amount <= 0 || rate <= 0 || months <= 0) {
    return response.status(400).json({
      message: "amount, rate और months सभी मान्य positive numbers होने चाहिए।",
    });
  }

  const maturity = calculateMaturity(amount, rate, months);
  const profit = Math.max(0, maturity - amount);
  const effectiveRate = Number((Math.pow(maturity / amount, 12 / months) - 1).toFixed(4));

  const comparison = FD_BANKS.map((bank) => ({
    bank: bank.bank,
    rate: bank.rate,
    maturity: calculateMaturity(amount, bank.rate, months),
  }))
    .sort((a, b) => b.maturity - a.maturity)
    .slice(0, 3);

  return response.json({
    maturity,
    profit,
    effectiveRate,
    comparison,
  });
});

export default router;
