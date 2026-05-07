import os
from modules.gemini import process_with_gemini

test_text = """
IN THE HIGH COURT OF JUDICATURE AT BOMBAY
ORDINARY ORIGINAL CIVIL JURISDICTION
WRIT PETITION NO. 1234 OF 2024

ABC Corp ... Petitioner
vs
State of Maharashtra ... Respondent

Date: May 5, 2024

ORDER:
The Respondent is directed to release the seized goods within 2 weeks.
The Petitioner shall pay the penalty of Rs. 10,000.
"""

result = process_with_gemini(test_text)
print(f"Result: {result}")
