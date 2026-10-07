from decimal import Decimal
from typing import Annotated

from pydantic import PlainSerializer

# Values are computed as Decimal; JSON carries them as numbers (Pydantic's default would be
# strings), so clients can chart and compare them without parsing.
DecimalAsNumber = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
