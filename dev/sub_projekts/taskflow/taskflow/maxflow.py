# External Imports
# ---
from collections import deque
# ---

# Class
# ---
class EdmondsKarp:
	# Breadth First Search
	# ---
	def _bfs(
		self,
		capacity: list[list[int]],
		flow: list[list[int]],
		source: int,
		sink: int
	) -> list[int] | None:
		# Adjacency Matrix Rows
		# ---
		n = len(capacity)
		# ---

		# Parent Array
		# ---
		parent = [-1] * n
		parent[source] = source

		queue = deque([source])
		# ---

		# BFS Loop
		# ---
		while queue:

			current = queue.popleft()

			for next_node in range(n):

				residual = (
					capacity[current][next_node]
					- flow[current][next_node]
				)

				if (
					parent[next_node] == -1
					and residual > 0
				):
					parent[next_node] = current
					queue.append(next_node)

					if next_node == sink:
						return parent
		# ---

		return None
	# ---

	# Find Path Flow
	# ---
	def _find_path_flow(
		self,
		capacity: list[list[int]],
		flow: list[list[int]],
		parent: list[int],
		source: int,
		sink: int
	) -> int:

		path_flow = float("inf")
		current = sink

		while current != source:

			previous = parent[current]

			residual = (
				capacity[previous][current]
				- flow[previous][current]
			)

			path_flow = min(path_flow, residual)

			current = previous

		return int(path_flow)
	# ---

	# Update Flow
	# ---
	def _update_flow(
		self,
		flow: list[list[int]],
		parent: list[int],
		source: int,
		sink: int,
		path_flow: int
	) -> None:

		current = sink

		while current != source:

			previous = parent[current]

			flow[previous][current] += path_flow
			flow[current][previous] -= path_flow

			current = previous
	# ---

	# Max Flow
	# ---
	def max_flow(
		self,
		capacity: list[list[int]],
		source: int,
		sink: int,
	) -> int:
		# Adjacency Matrix Rows
		# ---
		n: int = len(capacity)
		# ---

		# Check Integrity
		# ---
		if n == 0:
			raise ValueError("The network cannot be empty")
		if any(len(row) != n for row in capacity):
			raise ValueError("The capacity matrix must be square")
		if not (0 <= source < n and 0 <= sink < n):
			raise ValueError("Source and sink must be valid node indices")
		if source == sink:
			raise ValueError("Source and sink must be different")
		if any(
			not isinstance(value, int) or isinstance(value, bool) or value < 0
			for row in capacity
			for value in row
		):
			raise ValueError("Capacities must be non-negative integers")
		# ---

		# Flow
		# ---
		flow = [
			[0] * n
			for _ in range(n)
		]
		max_flow = 0
		# ---

		# Shortest Route
		# ---
		while True:
			# BFS
			# ---
			parent = self._bfs(
				capacity=capacity,
				flow=flow,
				source=source,
				sink=sink
			)
			if parent is None:
				break
			# ---

			# Flow
			# ---
			path_flow = self._find_path_flow(
				capacity=capacity,
				flow=flow,
				parent=parent,
				source=source,
				sink=sink
			)

			self._update_flow(
				flow=flow,
				parent=parent,
				source=source,
				sink=sink,
				path_flow=path_flow
			)

			max_flow += path_flow
			# ---

		return max_flow
		# ---
	# ---
# ---
