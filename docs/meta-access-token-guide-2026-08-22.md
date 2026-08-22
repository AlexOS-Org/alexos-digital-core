# Meta Ads Manager access-token guide

Meta’s official Marketing API authentication guide states that every Marketing API call requires an access token. The Graph API Explorer can generate a user token with permissions such as `ads_read` or `ads_management`, and the Access Token Debugger can show scopes and expiration. A short-lived user token can be exchanged for a long-lived token, generally about 60 days, but Meta recommends system-user access tokens for server-to-server interactions because a system-user token does not expire under normal conditions and is less likely to be invalidated than a long-lived user token.

For AlexOS, the preferred production route is a Meta Business system user with the minimum asset access required for the Daily Gear ad account and Pixel/dataset. Create the system user in Meta Business Settings, assign the user to the relevant ad account, create or select a Meta app, grant only the required Marketing API permission (normally `ads_read` for read-only Ads Manager reporting), generate the system-user token, then validate it in Meta’s Access Token Debugger or against a minimal read endpoint. Store the token only as the encrypted Cloudflare Worker secret `META_ACCESS_TOKEN`; never put it in the repository, browser settings, Pixel ID field or chat.

Official sources:

- https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authentication — Meta Marketing API authentication, Graph API Explorer, permissions, system-user tokens and secure storage.
- https://developers.facebook.com/docs/business-management-apis/system-users/ — Meta system users for server/software access to Business Manager assets.
- https://developers.facebook.com/documentation/facebook-login/guides/access-tokens/get-long-lived — long-lived user-token exchange and its approximately 60-day lifetime.
- https://developers.facebook.com/tools/explorer — Graph API Explorer.
- https://developers.facebook.com/tools/debug/accesstoken — Access Token Debugger.

Important distinction: the connected Meta Ads Manager service in this task can already access authorized ad-account data for agent-side research, but it does not expose its private credential for reuse in Cloudflare. A separate Meta system-user token must be created for the deployed Worker.
