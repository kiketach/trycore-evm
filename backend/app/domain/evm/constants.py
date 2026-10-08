from decimal import Decimal

# Percentages arrive on a 0..100 scale; EVM formulas need the 0..1 fraction.
PERCENT_SCALE = Decimal(100)
MIN_PERCENT = Decimal(0)
MAX_PERCENT = Decimal(100)

# Money is reported in cents; indices with two decimals, the precision a project leader reads.
MONEY_QUANTUM = Decimal("0.01")
INDEX_QUANTUM = Decimal("0.01")

# CPI and SPI equal to 1 mean "exactly as planned": above is better, below is worse.
PERFORMANCE_BASELINE = Decimal(1)

ZERO = Decimal(0)
