-- Empty "build your own" profile (no holdings); listed only via dedicated sign-in, not demo grid.
INSERT INTO "users" ("id", "name", "email", "risk_profile", "kyc_status", "investment_goal", "currency", "total_portfolio_value")
VALUES ('user_scratch', 'My Portfolio', 'scratch@valura.local', 'moderate', 'approved', 'wealth_accumulation', 'USD', 0)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "cash_balances" ("id", "user_id", "balance", "currency")
VALUES ('cash_user_scratch', 'user_scratch', 0, 'USD')
ON CONFLICT ("user_id") DO UPDATE SET "balance" = EXCLUDED."balance", "updated_at" = now();
