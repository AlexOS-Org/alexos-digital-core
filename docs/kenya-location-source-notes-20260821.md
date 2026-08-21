# Kenya checkout location source notes

## External source

GeoNames Kenya country dump: https://download.geonames.org/export/dump/KE.zip

GeoNames populated-place records were filtered to feature class `P`, feature codes `PPLC`, `PPLA`, `PPLA2` or `PPL`, and population at least 1,000. The records use Kenya county administrative codes in the `admin1` field. Nairobi county code `05` returned `Nairobi`, `Thika` and `Imara Daima Estate`; the existing application data already included Nairobi and Imara Daima. Additional Nairobi labels such as Westlands, Kilimani, Kileleshwa, Lavington, Karen, Lang'ata, Kasarani, Roysambu, Embakasi, South C, South B, Eastleigh, Parklands, Runda, Donholm and Kawangware are captured as customer-entered delivery areas, not as claims about delivery fees or route availability.

## Application policy

The selector keeps all 47 counties and county-scoped town candidates. The checkout also permits a customer to type a non-listed town or area. The server contract remains Kenya-only with non-empty county and town values; it does not fabricate a fee, zone or delivery promise for a typed location. Customers should add estate, landmark and delivery instructions separately.
