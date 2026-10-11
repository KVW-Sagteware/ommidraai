# External Imports
# ---
from queue import Queue
from typing import Callable
# ---

# Internal Imports
# ---
from stage import Stage
from task import Task
from maxflow import EdmondsKarp
# ---

# Constants
# ---
SOURCE = "__source__"
SINK = "__sink__"
# ---

# Class
# ---
class Pipeline:
	# Constructor
	# ---
	def __init__(
			self,
		) -> None:
		self.stages: dict[str, Stage] = {}
		self.connections: list[tuple[str, str]] = []

		self.running = False
		self.input_queue: Queue[Task] = Queue()

		self.completed_tasks: list[Task] = []
		self.failed_tasks: list[Task] = []
	# ---
	
	# Add Stage
	# ---
	def add_stage(
		self,
		name: str,
		worker_count: int,
		handler: Callable,
	) -> None:
		# Check Integrity
		# ---
		if name == SOURCE or name == SINK:
			raise ValueError(f"Stage '{name}' is a reserved name")
		if name in self.stages:
			raise ValueError(f"Stage '{name}' already exists")
		# ---

		# Add Stage
		# ---
		self.stages[name] = Stage(
			name=name,
			worker_count=worker_count,
			handler=handler,
		)
		# ---
	# ---

	# Connect
	# ---
	def connect(
		self,
		source: str,
		destination: str,
	) -> None:

		if self.running:
			raise RuntimeError("Cannot modify connections while running")

		if source == SINK:
			raise ValueError("Cannot connect from the sink")

		if destination == SOURCE:
			raise ValueError("Cannot connect to the source")

		if source != SOURCE and source not in self.stages:
			raise ValueError(f"Unknown source stage: {source}")

		if destination != SINK and destination not in self.stages:
			raise ValueError(f"Unknown destination stage: {destination}")

		connection = (source, destination)

		if connection in self.connections:
			raise ValueError(
				f"Connection '{source}' -> '{destination}' already exists"
			)

		self.connections.append(connection)
		# ---

	def connect_input(
		self,
		destination: str,
	) -> None:
		# Connect Input
		# ---
		self.connect(
			source=SOURCE,
			destination=destination
		)
		# ---

	def connect_output(
		self,
		source: str,
	) -> None:
		# Connect Output
		# ---
		self.connect(
			source=source,
			destination=SINK,
		)
		# ---
	# ---

	# Maximum Throughput
	# ---
	def max_throughput(
		self,
	) -> int:
		# Create Capacity Network
		# ---
		vertices, capacity = self.capacity_matrix()
		# ---

		# Set Source and Sink Indices
		# ---
		source = vertices.index(SOURCE)
		sink = vertices.index(SINK)
		# ---

		# Return
		# ---
		return EdmondsKarp().max_flow(
			capacity,
			source,
			sink,
		)
		# ---
	# ---

	# Start
	# ---
	def start(
		self,
	) -> None:
		# Check Running
		# ---
		if self.running:
			raise RuntimeError("Pipeline already running")
		# ---

		# Create Threads
		# ---
		for stage in self.stages.values():
			stage.start_workers()
		# ---

		# Enable Flag
		# ---
		self.running = True
		# ---
	# ---

	# Submit
	# ---
	def submit(
		self,
		task: Task,
	) -> None:
		# Check Running
		# ---
		if not self.running:
			raise RuntimeError("Pipeline is not running")
		# ---

		# Queue Task
		# ---
		self.input_queue.put(task)
		# ---
	# ---

	# Stop
	# ---
	def stop(
		self,
	) -> None:
		# Stop Threads
		# ---
		for stage in self.stages.values():
			stage.stop_workers()
		# ---

		# Zero Flag
		# ---
		self.running = False
		# ---
	# ---

	# Generate Adjacency Matrix
	# ---
	def adjacency_matrix(
			self,
	) -> tuple[list[str], list[list[int]]]:
		vertices = [SOURCE, *self.stages.keys(), SINK]

		# Create Matrix
		# ---
		size = len(vertices)
		matrix = [[0] * size for _ in range(size)]
		# ---

		# Map Verteces
		# ---
		indices = {
			name: index
			for index, name in enumerate(vertices)
		}
		# ---

		# Add Connections
		# ---
		for source, destination in self.connections:
			row = indices[source]
			column = indices[destination]

			matrix[row][column] = 1
		# ---

		return vertices, matrix
	# ---

	# Generate Capacity Matrix
	# ---
	def capacity_matrix(
		self,
	) -> tuple[list[str,], list[list[int]]]:
		# Create Matrix
		# ---
		vertices, adjacency = self.adjacency_matrix()
		# ---

		# Create Empty Capacity Matrix
		# ---
		size = len(vertices)
		capacity = [[0] * size for _ in range(size)]
		# ---

		# Set Indices
		# ---
		indices = {
			name: index
			for index, name in enumerate(vertices)
		}
		# ---

		# Set Capacities
		# ---
		for source, destination in self.connections:
			if source == SOURCE:
				capacity[indices[source]][indices[destination]] = (
					self.stages[destination].worker_count
				)
			elif destination == SINK:
				capacity[indices[source]][indices[destination]] = (
					self.stages[source].worker_count
				)
			else:
				capacity[indices[source]][indices[destination]] = (
					self.stages[destination].worker_count
				)
		# ---

		return vertices, capacity
	# ---
# ---
