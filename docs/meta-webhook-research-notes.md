# Meta Ads Webhook Research Notes

Research date: 19 August 2026.

Official Meta Ads Webhooks documentation states that Ads Webhooks push updates when something changes in an ad account, and that the notification tells the app to read the relevant Marketing API endpoint for current details rather than treating the webhook payload as the complete metric record.

The official overview lists the `subscriptions` webhook as covering object creation/update and Insights metrics such as impressions, spend, or conversions crossing a configured threshold. The subscription documentation states that reads require `ads_read` or `ads_management`; creating subscriptions requires the app to be subscribed to the `ad_account` object's `subscriptions` field, an app access token for the app-level subscription, and an ad-account admin token to connect a managed account. Meta sends a verification request to the HTTPS callback URL during setup.

The official setup guide states that a callback endpoint must receive GET and POST requests, validate the verification challenge, validate payload signatures, and then read the updated object/Insights data after receiving events. This means webhooks can reduce blind polling and trigger near-real-time refreshes, but a complete continuous spend/metric pipeline still requires authenticated follow-up Insights reads and a deployment with a public HTTPS callback endpoint.

Sources:

- https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ads-webhooks-overview
- https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/subscriptions
- https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/setup/get-started
