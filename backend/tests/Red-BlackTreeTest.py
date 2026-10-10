# Hierdie is 'n toets leer vir die Red-Black Tree implementasie.
# Dit laat jou toe om 'n Red-Black Tree te skep vanaf 'n tekslêer, en dan verskeie operasies soos soek, invoeg, en verwyder uit te voer.
# Dis om te demonstreer hoe die Red-Black Tree werk en om die prestasie van verskeie operasies te meet.
# 
# Hardloop hierdie file vanaf die ommidraai/backend/ folder met:
# 
# python .\tests\Red-BlackTreeTest.py
# 

import sys
from pathlib import Path
import time

app = Path(__file__).resolve().parent.parent / "app" / "algorithms"

sys.path.append(str(app))

from RedBlackTree import RedBlackTree

def initialize_rbt_from_data(
    file_path: str
) -> RedBlackTree:
    rbt = RedBlackTree()
    line_number = 0

    try:
        with open(file_path, 'r') as file:
            for line in file:
                data = int(line.strip())
                rbt.insert(data, data)
                line_number += 1
        return rbt
    except FileNotFoundError:
        print(f"Test data file '{file_path}' not found.")
    except ValueError as e:
        print(e)

def search_in_rbt_from_input(rbt: RedBlackTree):
    key = int(input("Enter the key to search for: "))

    start_time = time.time()
    node = rbt._search(rbt.root, key)
    end_time = time.time()
    search_time = end_time - start_time

    if node is not None:
        print(f"Found node with key {key}: {node.value}")
    else:
        print(f"No node found with key {key}.")
    print(f"Search time: {search_time:.6f} seconds")

def delete_from_rbt_from_input(rbt: RedBlackTree):
    key = int(input("Enter the key to delete: "))
    
    start_time = time.time()
    rbt.delete(key)
    end_time = time.time()
    delete_time = end_time - start_time
    print(f"Delete time: {delete_time:.6f} seconds")
    rbt.print_tree()

def add_to_rbt_from_input(rbt: RedBlackTree):
    key = int(input("Enter the key to add: "))

    start_time = time.time()
    rbt.insert(key, key)
    end_time = time.time()
    add_time = end_time - start_time
    print(f"Add time: {add_time:.6f} seconds")
    rbt.print_tree()

def print_rbt(rbt: RedBlackTree):
    rbt.print_tree()

def main():
    rbt = initialize_rbt_from_data('tests/Test-Data.txt')

    operations = {
        '1': search_in_rbt_from_input,
        '2': delete_from_rbt_from_input,
        '3': add_to_rbt_from_input,
        '4': print_rbt,
    }

    while True:
        print("\nChoose an operation:")
        print("1. Search for a node")
        print("2. Delete a node")
        print("3. Add a node")
        print("4. Print the tree")
        print("5. Exit")

        choice = input("Enter your choice: ")
        print()

        if choice == '5':
            break
        elif choice in operations:
            operations[choice](rbt)
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()