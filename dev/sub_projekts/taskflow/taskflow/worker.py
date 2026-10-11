# External Imports
# ---
from queue import Queue
from threading import Thread
from typing import Callable
# ---

# Local Imports
# ---
from task import Task
# ---

# Classes
# ---
class Worker(Thread):
	# Constructor
	# ---
	def __init__(
		self,
		name: str,
		task_queue: Queue[Task | None],
		handler: Callable[[Task], None],
		on_error: Callable[[Task, Exception], None],
	) -> None:
		super().__init__(
			name=name
		)
		self.task_queue: Queue[Task | None] = task_queue
		self.handler: Callable[[Task], None] = handler
		self.on_error: Callable[[Task, Exception], None] = on_error
	# ---

	# Run
	# ---
	def run(
		self,
	) -> None:
		while True:
			# Get Task
			# ---
			task = self.task_queue.get()
			# ---

			# Check Exit
			# ---
			if task is None:
				return
			# ---

			# Complete Task
			# ---
			try:
				self.handler(task)
			except Exception as error:
				self.on_error(task, error)
			finally:
				self.task_queue.task_done()
			# ---
	# ---
# ---
