# External Imports
# ---
from dataclasses import dataclass, field
from typing import Any
# ---

# Class
# ---
@dataclass
class Task:
	id: int
	data: Any
	result: Any = None
	error: Exception | None = None
	metadata: dict[str, Any] = field(default_factory=dict)
# ---
