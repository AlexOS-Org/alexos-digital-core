export function getAccountThemeId(name: string) {
  const value = name.toLowerCase();
  if (/m[- ]?pesa/.test(value)) return "mpesa";
  if (/kcb/.test(value)) return "kcb";
  if (/i&m|im bank/.test(value)) return "im";
  if (/sbm/.test(value)) return "sbm";
  if (/salary/.test(value)) return "salary";
  if (/binance|crypto/.test(value)) return "binance";
  if (/cash/.test(value)) return "cash";
  if (/airtel/.test(value)) return "airtel";
  return "default";
}
