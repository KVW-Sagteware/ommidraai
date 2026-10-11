# External Imports
# ---
from queue import Queue
from typing import Callable
# ---

# Internal Imports
# ---
from task import Task
from worker import Worker
# ---

# Classes
# ---
class Stage:
	# Constructor
	# ---
	def __init__(
		self,
		name: str,
		worker_count: int = 1,
		handler: Callable[[Task], Task | None] = None,
	) -> None:
		# Validate Workers
		# ---
		if worker_count < 1:
			raise ValueError("A stage must have at least one worker")
		# ---

		# Assign Parameters
		# ---
		self.name: str = name
		self.worker_count: int = worker_count
		self.handler: Callable = handler
		# ---

		# Default Declarations
		# ---
		self.queue: Queue[Task | None] = Queue()
		self.workers: list[Worker] = []
		self.running: bool = False
		self.on_output: Callable[[Task], None] = lambda task: None
		self.on_error: Callable[[Task, Exception], None] = (
			lambda task, error: None
		)
		self.on_discard: Callable[[Task], None] = lambda task: None
		# ---
	# ---

	# Set Callbacks
	# ---
	def set_callbacks(
		self,
		on_output: Callable[[Task], None],
		on_error: Callable[[Task, Exception], None],
		on_discard: Callable[[Task], None],
	) -> None:
		# Check Running
		# ---
		if self.running:
			raise RuntimeError("Cannot change callbacks while running")
		# ---

		# Edit Callbcks
		# ---
		self.on_output = on_output
		self.on_error = on_error
		self.on_discard = on_discard
		# ---
	# ---

	# Start
	# ---
	def start_workers(
		self,
	) -> None:
		# Check Running
		# ---
		if self.running:
			return
		self.running = True
		# ---

		# Create Workers
		# ---
		try:
			for i in range(self.worker_count):
				# Set Up Worker
				# ---
				worker = Worker(
					name=f"{self.name}-worker-{i+1}",
					task_queue=self.queue,
					handler=self._process_task,
					on_error=self._handle_error
				)
				# ---

				# Add Worker
				# ---
				self.workers.append(worker)
				# ---

				# Start Worker
				# ---
				worker.start()
				# ---
			# ---

		except Exception as e:
			# Stop Workers
			# ---
			self.stop_workers()
			# ---

			# Raise Error
			# ---
			raise e
			# ---
		# ---
	# ---

	# Stop
	# ---
	def stop_workers(
		self,
	) -> None:
		# Check Running
		# ---
		if not self.running:
			return
		self.running = False
		# ---

		# Finish Queued Tasks
		# ---
		self.queue.join()
		# ---

		# Add 'None' Task
		# ---
		for _ in self.workers:
			self.queue.put(None)
		# ---

		# Finish Current Tasks
		# ---
		for worker in self.workers:
			worker.join()
		# ---

		# Remove Workers
		# ---
		self.workers.clear()
		# ---

		# Toggle Flag
		# ---
		self.running = False
		# ---
	# ---

	# Submit
	# ---
	def submit(
		self,
		task: Task
	) -> None:
		# Check Running
		# ---
		if not self.running:
			raise RuntimeError(f"Cannot submit tasks to stopped stage '{self.name}'")
		# ---

		# Add Task
		# ---
		self.queue.put(task)
		# ---
	# ---

	# Process Task
	# ---
	def _process_task(
		self,
		task: Task
	) -> None:
		try:
			# Handle Task
			# ---
			result = self.handler(task)
			# ---

			# Check Result
			# ---
			if result is not None:
				self.on_output(result)
			else:
				self.on_discard(task)
			# ---

		except Exception as e:
			self.on_error(task, e)
	# ---

	# Handle Error
	# ---
	def _handle_error(
		self,
		task: Task,
		error: Exception
	) -> None:
		task.error = error
		self.on_error(task, error)

	# Join
	# ---
	def join(
		self,
	) -> None:
		self.queue.join()
	# ---
# ---
