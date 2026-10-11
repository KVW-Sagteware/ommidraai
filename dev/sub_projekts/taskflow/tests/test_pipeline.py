from taskflow.pipeline import Pipeline


def dummy_handler(task):
    return task


pipeline = Pipeline()

pipeline.add_stage("download", 2, dummy_handler)
pipeline.add_stage("process", 4, dummy_handler)
pipeline.add_stage("save", 1, dummy_handler)

pipeline.connect_input("download")
pipeline.connect("download", "process")
pipeline.connect("process", "save")
pipeline.connect_output("save")

vertices, matrix = pipeline.adjacency_matrix()

print("Vertices:")
print(vertices)

print("\nAdjacency matrix:")
for row in matrix:
    print(row)
