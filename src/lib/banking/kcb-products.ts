export const KCB_PRODUCT_OPTIONS = {
  LOANS: [
    "Personal Loan",
    "Sahi Loan",
    "Check-off Loan",
    "Non-check-off Loan",
    "Mortgage",
    "Other loan product",
  ],
  SALARY_ACCOUNTS: ["Salary Account"],
  OTHER_RETAIL_ACCOUNTS: [
    "Advantage / Private School / Platinum Account",
    "Group / Sacco Account",
    "Other Retail Account",
    "Biashara Developer Club membership",
  ],
  DEPOSITS: ["Deposit Account", "Fixed Deposit Receipt (FDR)", "Other deposit product"],
  MOBI: ["Mobi"],
  CREDIT_CARDS: [
    "Classic Card",
    "Gold Card",
    "Platinum Card",
    "Corporate Card",
    "Serena Gold Card",
    "Supplementary Card",
    "School / College Prepaid Card",
  ],
  INSURANCE: ["Insurance Policy"],
  VOOMA: ["Vooma Merchant", "Vooma Agent"],
} as const satisfies Record<string, readonly string[]>;

export function productOptionsForKpi(code: string | null | undefined): readonly string[] {
  return (
    (code && KCB_PRODUCT_OPTIONS[code as keyof typeof KCB_PRODUCT_OPTIONS]) || ["Other product"]
  );
}
