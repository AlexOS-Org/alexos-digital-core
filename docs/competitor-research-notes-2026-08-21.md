# DailyGear competitor research notes — 21 August 2026

## Public Meta Ads Library

Official URL: https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=KE&is_targeted_country=false&media_type=all

Observed public controls: country selection (Kenya), ad category, advertiser/keyword search, active ad scope and media type. Meta states that the Ad Library covers ads currently running across Meta technologies and that an ad can appear within 24 hours after its first impression; changes can also take up to 24 hours to appear. The public page also links to the Ad Library Report and Ad Library API. The public UI did not expose a general ecommerce page follower-count filter.

## Jumia Kenya page

Requested URL: https://www.facebook.com/JumiaKenya

Observed result: Facebook redirected the browser to a login page. No follower or like count was recorded. This must be treated as unavailable rather than inferred from a search snippet or third-party page.

## Data rule

Do not present follower/like counts, active-ad counts or ad durations unless directly observed from a public source or returned by an authorized connector. The Meta Ads Manager connector exposes the owner’s authorized ad accounts, campaigns, ad sets, ads and performance insights; it does not expose a general public competitor Ads Library search or Facebook page follower counts.
