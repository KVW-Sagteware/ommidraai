import unittest

from taskflow.maxflow import EdmondsKarp


class TestEdmondsKarp(unittest.TestCase):

    def setUp(self) -> None:
        self.algorithm = EdmondsKarp()

    def test_simple_path(self) -> None:
        capacity = [
            [0, 3, 0],
            [0, 0, 2],
            [0, 0, 0]
        ]

        result = self.algorithm.max_flow(
            capacity,
            source=0,
            sink=2
        )

        self.assertEqual(result, 2)

    def test_multiple_paths(self) -> None:
        capacity = [
            [0, 3, 2, 0],
            [0, 0, 0, 3],
            [0, 0, 0, 2],
            [0, 0, 0, 0]
        ]

        result = self.algorithm.max_flow(
            capacity,
            source=0,
            sink=3
        )

        self.assertEqual(result, 5)

    def test_classic_network(self) -> None:
        capacity = [
            [0, 16, 13, 0, 0, 0],
            [0, 0, 10, 12, 0, 0],
            [0, 4, 0, 0, 14, 0],
            [0, 0, 9, 0, 0, 20],
            [0, 0, 0, 7, 0, 4],
            [0, 0, 0, 0, 0, 0]
        ]

        result = self.algorithm.max_flow(
            capacity,
            source=0,
            sink=5
        )

        self.assertEqual(result, 23)

    def test_source_equals_sink(self) -> None:
        capacity = [
            [0, 5],
            [0, 0]
        ]

        with self.assertRaises(ValueError):
            self.algorithm.max_flow(
                capacity,
                source=0,
                sink=0
            )

    def test_negative_capacity(self) -> None:
        capacity = [
            [0, -5],
            [0, 0]
        ]

        with self.assertRaises(ValueError):
            self.algorithm.max_flow(
                capacity,
                source=0,
                sink=1
            )


if __name__ == "__main__":
    unittest.main()
