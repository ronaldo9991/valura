-- Demo portfolio personas for login grid (`GET /api/users` excludes user_scratch).
-- Idempotent: safe to re-run after partial applies.

INSERT INTO "users" ("id", "name", "email", "risk_profile", "kyc_status", "investment_goal", "currency", "total_portfolio_value")
VALUES
  ('user_001', 'Marcus Chen', 'marcus.chen@demo.valura.local', 'moderate', 'approved', 'wealth_accumulation', 'USD', '284230.0000'),
  ('user_002', 'Sarah Williams', 'sarah.williams@demo.valura.local', 'conservative', 'approved', 'income', 'USD', '176540.0000'),
  ('user_003', 'Hiroshi Tanaka', 'hiroshi.tanaka@demo.valura.local', 'aggressive', 'approved', 'wealth_accumulation', 'USD', '512890.0000'),
  ('user_004', 'Elena Vasquez', 'elena.vasquez@demo.valura.local', 'moderate', 'approved', 'wealth_accumulation', 'USD', '98200.0000'),
  ('user_005', 'David Okonkwo', 'david.okonkwo@demo.valura.local', 'moderate', 'approved', 'wealth_accumulation', 'USD', '305670.0000'),
  ('user_006', 'Lina Andersson', 'lina.andersson@demo.valura.local', 'conservative', 'approved', 'preservation', 'USD', '218900.0000'),
  ('user_007', 'Omar Haddad', 'omar.haddad@demo.valura.local', 'aggressive', 'approved', 'wealth_accumulation', 'USD', '403120.0000'),
  ('user_008', 'Maya Patel', 'maya.patel@demo.valura.local', 'moderate', 'approved', 'wealth_accumulation', 'USD', '197450.0000'),
  ('user_009', 'Tomas Novak', 'tomas.novak@demo.valura.local', 'conservative', 'approved', 'income', 'USD', '162300.0000'),
  ('user_010', 'Yuki Sato', 'yuki.sato@demo.valura.local', 'moderate', 'approved', 'wealth_accumulation', 'USD', '271880.0000')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "cash_balances" ("id", "user_id", "balance", "currency")
VALUES
  ('cash_user_001', 'user_001', '48250.5000', 'USD'),
  ('cash_user_002', 'user_002', '62340.0000', 'USD'),
  ('cash_user_003', 'user_003', '38790.2500', 'USD'),
  ('cash_user_004', 'user_004', '15200.0000', 'USD'),
  ('cash_user_005', 'user_005', '55120.0000', 'USD'),
  ('cash_user_006', 'user_006', '44890.0000', 'USD'),
  ('cash_user_007', 'user_007', '29100.5000', 'USD'),
  ('cash_user_008', 'user_008', '37450.0000', 'USD'),
  ('cash_user_009', 'user_009', '58910.0000', 'USD'),
  ('cash_user_010', 'user_010', '43670.0000', 'USD')
ON CONFLICT ("user_id") DO UPDATE SET
  "balance" = EXCLUDED."balance",
  "updated_at" = now();

INSERT INTO "holdings" ("id", "user_id", "ticker", "name", "shares", "avg_cost_basis", "sector", "currency")
VALUES
  ('h_u001_aapl', 'user_001', 'AAPL', 'Apple Inc.', '320.00000000', '178.2500', 'Technology', 'USD'),
  ('h_u001_msft', 'user_001', 'MSFT', 'Microsoft Corporation', '210.00000000', '392.1000', 'Technology', 'USD'),
  ('h_u001_googl', 'user_001', 'GOOGL', 'Alphabet Inc.', '180.00000000', '138.7500', 'Technology', 'USD'),

  ('h_u002_jnj', 'user_002', 'JNJ', 'Johnson & Johnson', '450.00000000', '156.2000', 'Healthcare', 'USD'),
  ('h_u002_pg', 'user_002', 'PG', 'Procter & Gamble Co.', '380.00000000', '162.4000', 'Consumer Defensive', 'USD'),

  ('h_u003_nvda', 'user_003', 'NVDA', 'NVIDIA Corporation', '520.00000000', '118.9000', 'Technology', 'USD'),
  ('h_u003_amd', 'user_003', 'AMD', 'Advanced Micro Devices', '890.00000000', '124.6000', 'Technology', 'USD'),
  ('h_u003_meta', 'user_003', 'META', 'Meta Platforms Inc.', '190.00000000', '485.3000', 'Technology', 'USD'),

  ('h_u004_vti', 'user_004', 'VTI', 'Vanguard Total Stock Market ETF', '140.00000000', '242.1000', 'Financial Services', 'USD'),
  ('h_u004_agg', 'user_004', 'AGG', 'iShares Core U.S. Aggregate Bond ETF', '220.00000000', '98.4000', 'Financial Services', 'USD'),

  ('h_u005_jpm', 'user_005', 'JPM', 'JPMorgan Chase & Co.', '410.00000000', '188.7000', 'Financial Services', 'USD'),
  ('h_u005_xom', 'user_005', 'XOM', 'Exxon Mobil Corporation', '510.00000000', '112.3000', 'Energy', 'USD'),

  ('h_u006_pep', 'user_006', 'PEP', 'PepsiCo Inc.', '290.00000000', '168.9000', 'Consumer Defensive', 'USD'),
  ('h_u006_ko', 'user_006', 'KO', 'The Coca-Cola Company', '520.00000000', '61.2500', 'Consumer Defensive', 'USD'),

  ('h_u007_tsla', 'user_007', 'TSLA', 'Tesla Inc.', '340.00000000', '212.4000', 'Consumer Cyclical', 'USD'),
  ('h_u007_coin', 'user_007', 'COIN', 'Coinbase Global Inc.', '410.00000000', '218.7000', 'Financial Services', 'USD'),

  ('h_u008_cost', 'user_008', 'COST', 'Costco Wholesale Corporation', '95.00000000', '785.2000', 'Consumer Defensive', 'USD'),
  ('h_u008_hd', 'user_008', 'HD', 'The Home Depot Inc.', '160.00000000', '348.9000', 'Consumer Cyclical', 'USD'),

  ('h_u009_vz', 'user_009', 'VZ', 'Verizon Communications Inc.', '780.00000000', '39.8500', 'Communication Services', 'USD'),
  ('h_u009_mrkr', 'user_009', 'MRK', 'Merck & Co. Inc.', '410.00000000', '106.2000', 'Healthcare', 'USD'),

  ('h_u010_nflx', 'user_010', 'NFLX', 'Netflix Inc.', '130.00000000', '612.8000', 'Communication Services', 'USD'),
  ('h_u010_shop', 'user_010', 'SHOP', 'Shopify Inc.', '240.00000000', '72.4500', 'Technology', 'USD')
ON CONFLICT ("id") DO NOTHING;
