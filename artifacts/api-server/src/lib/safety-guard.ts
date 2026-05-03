/**
 * Safety Guard — runs before any LLM call.
 * Pure local computation, no network calls, must complete < 10ms.
 * Returns null if safe, or a { blocked: true, category, response } object.
 */

interface SafetyResult {
  blocked: boolean;
  category?: string;
  response?: string;
}

const BLOCKED_PATTERNS: { category: string; patterns: RegExp[]; response: string }[] = [
  {
    category: "insider_trading",
    patterns: [
      /\binsider\s+trad(e|ing|er)\b/i,
      /\bnon[- ]?public\s+information\b/i,
      /\bfront[- ]?run(ning|ner)?\b/i,
      /\btip(ping)?\s+(someone|them|you)\s+about\b/i,
      /\btrade\s+on\s+inside\b/i,
    ],
    response:
      "Insider trading is a serious securities law violation that carries criminal penalties including imprisonment and substantial fines. I'm not able to assist with trading strategies based on material non-public information. If you have questions about legal investment research or publicly available data, I'm happy to help.",
  },
  {
    category: "market_manipulation",
    patterns: [
      /\bpump[- ]and[- ]dump\b/i,
      /\bmanipulat(e|ing|ion)\s+(the\s+)?(market|price|stock)\b/i,
      /\bwash\s+trad(e|ing)\b/i,
      /\bspoof(ing)?\s+(order|the\s+market)\b/i,
      /\blayer(ing)?\s+orders?\b/i,
      /\bcoordinat(e|ing)\s+to\s+(buy|sell|drive)\b/i,
    ],
    response:
      "Market manipulation is illegal and undermines the integrity of financial markets. I'm unable to provide guidance on strategies designed to artificially influence prices or deceive other market participants. I'm here to help with legitimate investment analysis and portfolio management.",
  },
  {
    category: "money_laundering",
    patterns: [
      /\bmoney\s+launder(ing|er)?\b/i,
      /\blaunder(ing)?\s+(money|funds|cash)\b/i,
      /\bstructur(ing|e)\s+(deposits|transactions|payments)\b/i,
      /\bsmurfing\b/i,
      /\bhide\s+(the\s+)?(source|origin)\s+of\s+(money|funds|cash)\b/i,
      /\bconceal\s+(illegal|dirty)\s+(money|funds)\b/i,
    ],
    response:
      "Money laundering is a serious financial crime with severe legal consequences. I'm not able to assist with concealing the origin of funds or structuring transactions to evade reporting requirements. For questions about legitimate tax planning or compliance, I recommend consulting a licensed financial advisor.",
  },
  {
    category: "guaranteed_returns",
    patterns: [
      /\bguaranteed?\s+(return|profit|gain|income|yield)\b/i,
      /\b(100%|certain|risk[- ]?free)\s+(profit|return|gain|investment)\b/i,
      /\bnever\s+los(e|ing)\s+money\b/i,
      /\bcan't\s+lose\b/i,
      /\bsure[- ]?thing\s+investment\b/i,
    ],
    response:
      "No investment can guarantee returns — any claim of guaranteed profits or risk-free investments is a hallmark of financial fraud. All investments carry some level of risk. I'm here to help you understand real risk-adjusted returns and build a portfolio aligned with your actual risk tolerance.",
  },
  {
    category: "reckless_advice",
    patterns: [
      /\b(bet|put)\s+(everything|all|100%)\s+(on|in|into)\s+\w+\b/i,
      /\btake\s+out\s+(a\s+)?(loan|mortgage|debt)\s+to\s+(invest|buy|trade)\b/i,
      /\bmortgage\s+(my|your|the)\s+house\s+to\s+(invest|buy|trade)\b/i,
      /\bleverage\s+everything\b/i,
      /\bmax(imum)?\s+leverage\b/i,
    ],
    response:
      "Investing borrowed money or leveraging your home to speculate in financial markets carries extreme risk of total loss. I'm designed to help you invest wisely within your means. I strongly recommend discussing major financial decisions with a qualified financial advisor before proceeding.",
  },
];

const EDUCATIONAL_BYPASS: RegExp[] = [
  /\bwhat\s+is\b/i,
  /\bhow\s+does\b/i,
  /\bexplain\b/i,
  /\bdefin(e|ition)\b/i,
  /\bhistory\s+of\b/i,
  /\blearn\s+about\b/i,
  /\bunderstand\b/i,
  /\beducational?\b/i,
  /\bexample\s+of\b/i,
  /\bwhy\s+(is|was|do|did)\b/i,
];

function isEducational(query: string): boolean {
  return EDUCATIONAL_BYPASS.some((pattern) => pattern.test(query));
}

export function runSafetyGuard(query: string): SafetyResult {
  const trimmed = query.trim();

  if (isEducational(trimmed)) {
    return { blocked: false };
  }

  for (const rule of BLOCKED_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(trimmed)) {
        return {
          blocked: true,
          category: rule.category,
          response: rule.response,
        };
      }
    }
  }

  return { blocked: false };
}
