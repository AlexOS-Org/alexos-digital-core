from decimal import Decimal

# Verified persisted records from the bounded Supabase audit on 2026-08-22.
recurring = {
    "Garbage": Decimal("250"),
    "Home WiFi": Decimal("1500"),
    "House rent": Decimal("13000"),
    "Water": Decimal("260"),
}
budgets = {
    "Airtime": Decimal("1500"),
    "Electricity": Decimal("1500"),
    "Food": Decimal("5000"),
    "Kids": Decimal("10000"),
    "Medical": Decimal("5000"),
    "Transport": Decimal("8000"),
}
line_items = {
    "Garbage": recurring["Garbage"],
    "Home WiFi": recurring["Home WiFi"],
    "House rent": recurring["House rent"],
    "Water": recurring["Water"],
    **budgets,
}
print("Essential monthly modeled baseline (KES):", sum(line_items.values()))
for name, amount in line_items.items():
    print(f"{name}\t{amount}")
actual_posted = {
    "Transport": Decimal("100"),
    "Airtime": Decimal("40"),
    "Food": Decimal("100"),
    "Electricity": Decimal("100"),
}
print("Actual posted personal expenses found in persisted extract (KES):", sum(actual_posted.values()))
print("Emergency fund targets:")
for months in (3, 6):
    print(months, sum(line_items.values()) * months)
