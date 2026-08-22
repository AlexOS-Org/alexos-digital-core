import mpesaLogo from "@/assets/branding/accounts/mpesa.png";
import kcbLogo from "@/assets/branding/accounts/kcb.png";
import imBankLogo from "@/assets/branding/accounts/im-bank.jpg";
import sbmLogo from "@/assets/branding/accounts/sbm.png";
import binanceLogo from "@/assets/branding/accounts/binance.png";
import cashLogo from "@/assets/branding/accounts/cash.png";

export function getAccountLogo(name: string) {
  const value = name.toLowerCase();
  if (/m[- ]?pesa/.test(value)) return mpesaLogo;
  if (/kcb/.test(value)) return kcbLogo;
  if (/i&m|im bank/.test(value)) return imBankLogo;
  if (/sbm/.test(value)) return sbmLogo;
  if (/binance|crypto/.test(value)) return binanceLogo;
  if (/cash/.test(value)) return cashLogo;
  if (/salary/.test(value)) return cashLogo;
  return null;
}
