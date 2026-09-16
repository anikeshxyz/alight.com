"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Currency } from "@/types/pricing";
import { getActiveCurrenciesApi } from "@/services/currency-service";

interface CurrencyContextType {
  currencies: Currency[];
  currentCurrency: Currency;
  setCurrencyCode: (code: string) => void;
  formatMoney: (amountInInr: number | null | undefined, customCurrencyCode?: string) => string;
  convertFromInr: (amountInInr: number | null | undefined, customCurrencyCode?: string) => number;
  isLoading: boolean;
}

const DEFAULT_INR_CURRENCY: Currency = {
  id: "f0000000-0000-0000-0000-000000000001",
  code: "INR",
  name: "Indian Rupee",
  symbol: "₹",
  decimalPlaces: 2,
  isBase: true,
  isActive: true,
  exchangeRateToBase: 1.0,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = "alight_preferred_currency";

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([DEFAULT_INR_CURRENCY]);
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(DEFAULT_INR_CURRENCY);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCurrencies() {
      try {
        const res = await getActiveCurrenciesApi();
        if (res.success && res.data && res.data.length > 0) {
          setCurrencies(res.data);
          const savedCode = localStorage.getItem(CURRENCY_STORAGE_KEY);
          if (savedCode) {
            const found = res.data.find((c) => c.code.toUpperCase() === savedCode.toUpperCase());
            if (found) {
              setCurrentCurrency(found);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load active currencies", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCurrencies();
  }, []);

  const setCurrencyCode = useCallback(
    (code: string) => {
      const found = currencies.find((c) => c.code.toUpperCase() === code.toUpperCase());
      if (found) {
        setCurrentCurrency(found);
        localStorage.setItem(CURRENCY_STORAGE_KEY, found.code);
      }
    },
    [currencies]
  );

  const convertFromInr = useCallback(
    (amountInInr: number | null | undefined, customCurrencyCode?: string): number => {
      if (amountInInr === null || amountInInr === undefined || isNaN(amountInInr)) {
        return 0;
      }
      const targetCurr = customCurrencyCode
        ? currencies.find((c) => c.code.toUpperCase() === customCurrencyCode.toUpperCase()) || currentCurrency
        : currentCurrency;

      const rate = targetCurr.exchangeRateToBase || 1.0;
      const converted = amountInInr * rate;
      const factor = Math.pow(10, targetCurr.decimalPlaces || 2);
      return Math.round(converted * factor) / factor;
    },
    [currencies, currentCurrency]
  );

  const formatMoney = useCallback(
    (amountInInr: number | null | undefined, customCurrencyCode?: string): string => {
      if (amountInInr === null || amountInInr === undefined || isNaN(amountInInr)) {
        return `${currentCurrency.symbol} 0.00`;
      }
      const targetCurr = customCurrencyCode
        ? currencies.find((c) => c.code.toUpperCase() === customCurrencyCode.toUpperCase()) || currentCurrency
        : currentCurrency;

      const converted = convertFromInr(amountInInr, targetCurr.code);
      const formattedNum = converted.toLocaleString("en-US", {
        minimumFractionDigits: targetCurr.decimalPlaces || 2,
        maximumFractionDigits: targetCurr.decimalPlaces || 2,
      });

      return `${targetCurr.symbol} ${formattedNum}`;
    },
    [convertFromInr, currentCurrency, currencies]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        currentCurrency,
        setCurrencyCode,
        formatMoney,
        convertFromInr,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
