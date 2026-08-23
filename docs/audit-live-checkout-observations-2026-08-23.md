# Live checkout observations

The live DailyGear checkout route loaded successfully with the YJ bag in the cart. It displays required first name, phone, county, town/area, and street/building/house/shop-number fields; optional last name, email, delivery details, and order notes; an optional one-time abandoned-checkout reminder; and a remember-details control. The country defaults to Kenya.

Payment choices exposed by the route are Pay on delivery, M-Pesa with instructions after ordering, and Bank transfer. The checkout summary shows the item, delivery charge, and total, with a Place order button. No personal information was entered and no order was submitted. A controlled checkout test still requires explicit confirmation immediately before submission because it would create a real production order and potentially trigger notifications or ledger effects.
