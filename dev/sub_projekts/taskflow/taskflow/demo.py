# External Imports
# ---
import time
from threading import Lock
# ---

# Internal Imports
# ---
from pipeline import Pipeline
from task import Task
# ---


def download_handler(task: Task) -> Task:
    """Simulate downloading a file."""
    time.sleep(0.16)

    task.data = f"Downloaded({task.data})"

    if task.id <= 100:
        print(f"Task {task.id}: Download complete")

    return task


def process_handler(task: Task) -> Task:
    """Simulate processing a downloaded file."""
    time.sleep(0.06)

    task.data = f"Processed({task.data})"

    if task.id <= 100:
        print(f"Task {task.id}: Processing complete")

    return task


def save_handler(task: Task) -> Task:
    """Simulate saving the processed file."""
    time.sleep(0.20)

    task.result = f"Saved({task.data})"

    if task.id <= 100:
        print(f"Task {task.id}: Saving complete")

    return task


def run_demo(save_workers: int) -> None:
    task_count = 50

    pipeline = Pipeline()

    # Create the stages.
    pipeline.add_stage("download", 2, download_handler)
    pipeline.add_stage("process", 4, process_handler)
    pipeline.add_stage("save", save_workers, save_handler)

    # Connect the stages.
    pipeline.connect_input("download")
    pipeline.connect("download", "process")
    pipeline.connect("process", "save")
    pipeline.connect_output("save")

    # Track completed and failed tasks.
    completed: list[Task] = []
    failed: list[tuple[Task, Exception]] = []
    lock = Lock()

    # Route each stage's output to the next stage.
    def make_output_callback(stage_name: str):
        def on_output(task: Task) -> None:
            destinations = [
                destination
                for source, destination in pipeline.connections
                if source == stage_name
            ]

            for destination in destinations:
                if destination == "__sink__":
                    with lock:
                        completed.append(task)
                else:
                    pipeline.stages[destination].submit(task)

        return on_output

    def on_error(task: Task, error: Exception) -> None:
        with lock:
            failed.append((task, error))

    def on_discard(task: Task) -> None:
        print(f"Task {task.id} was discarded")

    # Configure callbacks before starting workers.
    for name, stage in pipeline.stages.items():
        stage.set_callbacks(
            on_output=make_output_callback(name),
            on_error=on_error,
            on_discard=on_discard
        )

    print("\n" + "=" * 55)
    print(f"DEMO: save stage has {save_workers} worker(s)")
    print("=" * 55)

    # Show the pipeline configuration.
    print("\nStage configuration:")

    for name, stage in pipeline.stages.items():
        print(f"  {name}: {stage.worker_count} workers")

    # Show the adjacency matrix.
    vertices, matrix = pipeline.adjacency_matrix()

    print("\nAdjacency matrix:")
    print("Vertices:", vertices)

    for row in matrix:
        print(row)

    # Calculate theoretical maximum throughput.
    theoretical_throughput = pipeline.max_throughput()

    print(
        "\nTheoretical maximum flow:",
        theoretical_throughput,
        "capacity units"
    )

    # Start all stage workers.
    for stage in pipeline.stages.values():
        stage.start_workers()

    start_time = time.perf_counter()

    try:
        # Submit tasks to the first stage.
        for task_id in range(1, task_count + 1):
            task = Task(
                id=task_id,
                data=f"file_{task_id}.txt"
            )

            pipeline.stages["download"].submit(task)

        for stage in pipeline.stages.values():
            stage.join()

    finally:
        # Stop all worker threads.
        for stage in reversed(list(pipeline.stages.values())):
            stage.stop_workers()

    elapsed = time.perf_counter() - start_time

    # Display the results.
    print("\nResults:")
    print(f"  Tasks submitted: {task_count}")
    print(f"  Tasks completed: {len(completed)}")
    print(f"  Tasks failed:    {len(failed)}")
    print(f"  Elapsed time:    {elapsed:.2f} seconds")
    print(f"  Actual throughput: {len(completed) / elapsed:.2f} tasks/second")

    if completed:
        print("\nExample result:")
        print(f"  {completed[0].result}")

    if failed:
        print("\nErrors:")

        for task, error in failed:
            print(f"  Task {task.id}: {error}")


if __name__ == "__main__":
    # First run: the save stage has one worker.
    run_demo(save_workers=1)

    # Second run: the save stage has three workers.
    run_demo(save_workers=3)
