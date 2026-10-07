class RedBlackTreeNode:
    def __init__(self, key, value):
        self.key = key
        self.value = value
        self.color = "red"
        self.left = None
        self.right = None
        self.parent = None


class RedBlackTree:
    def __init__(self):
        self.nil = RedBlackTreeNode(None, None)
        self.nil.color = "black"
        self.nil.left = self.nil
        self.nil.right = self.nil
        self.nil.parent = self.nil
        self.root = self.nil

    def _compare_keys(self, left_key, right_key):
        if left_key == right_key:
            return 0
        if left_key < right_key:
            return -1
        return 1

    def _left_rotate(self, x):
        y = x.right
        x.right = y.left
        if y.left is not self.nil:
            y.left.parent = x
        y.parent = x.parent
        if x.parent is self.nil:
            self.root = y
        elif x is x.parent.left:
            x.parent.left = y
        else:
            x.parent.right = y
        y.left = x
        x.parent = y

    def _right_rotate(self, x):
        y = x.left
        x.left = y.right
        if y.right is not self.nil:
            y.right.parent = x
        y.parent = x.parent
        if x.parent is self.nil:
            self.root = y
        elif x is x.parent.right:
            x.parent.right = y
        else:
            x.parent.left = y
        y.right = x
        x.parent = y

    def _insert_fixup(self, z):
        while z.parent.color == "red":
            if z.parent is z.parent.parent.left:
                y = z.parent.parent.right
                if y.color == "red":
                    z.parent.color = "black"
                    y.color = "black"
                    z.parent.parent.color = "red"
                    z = z.parent.parent
                else:
                    if z is z.parent.right:
                        z = z.parent
                        self._left_rotate(z)
                    z.parent.color = "black"
                    z.parent.parent.color = "red"
                    self._right_rotate(z.parent.parent)
            else:
                y = z.parent.parent.left
                if y.color == "red":
                    z.parent.color = "black"
                    y.color = "black"
                    z.parent.parent.color = "red"
                    z = z.parent.parent
                else:
                    if z is z.parent.left:
                        z = z.parent
                        self._right_rotate(z)
                    z.parent.color = "black"
                    z.parent.parent.color = "red"
                    self._left_rotate(z.parent.parent)
        self.root.color = "black"

    def insert(self, key, value):
        z = RedBlackTreeNode(key, value)
        y = self.nil
        x = self.root

        while x is not self.nil:
            y = x
            if self._compare_keys(key, x.key) < 0:
                x = x.left
            else:
                x = x.right

        z.parent = y
        if y is self.nil:
            self.root = z
        elif self._compare_keys(key, y.key) < 0:
            y.left = z
        else:
            y.right = z

        z.left = self.nil
        z.right = self.nil
        z.color = "red"
        self._insert_fixup(z)
        return value

    def _minimum(self, node):
        while node.left is not self.nil:
            node = node.left
        return node

    def _transplant(self, u, v):
        if u.parent is self.nil:
            self.root = v
        elif u is u.parent.left:
            u.parent.left = v
        else:
            u.parent.right = v
        v.parent = u.parent

    def _delete_fixup(self, x):
        while x is not self.root and x.color == "black":
            if x is x.parent.left:
                w = x.parent.right
                if w.color == "red":
                    w.color = "black"
                    x.parent.color = "red"
                    self._left_rotate(x.parent)
                    w = x.parent.right
                if w.left.color == "black" and w.right.color == "black":
                    w.color = "red"
                    x = x.parent
                else:
                    if w.right.color == "black":
                        w.left.color = "black"
                        w.color = "red"
                        self._right_rotate(w)
                        w = x.parent.right
                    w.color = x.parent.color
                    x.parent.color = "black"
                    w.right.color = "black"
                    self._left_rotate(x.parent)
                    x = self.root
            else:
                w = x.parent.left
                if w.color == "red":
                    w.color = "black"
                    x.parent.color = "red"
                    self._right_rotate(x.parent)
                    w = x.parent.left
                if w.left.color == "black" and w.right.color == "black":
                    w.color = "red"
                    x = x.parent
                else:
                    if w.left.color == "black":
                        w.right.color = "black"
                        w.color = "red"
                        self._left_rotate(w)
                        w = x.parent.left
                    w.color = x.parent.color
                    x.parent.color = "black"
                    w.left.color = "black"
                    self._right_rotate(x.parent)
                    x = self.root
        x.color = "black"

    def delete(self, key):
        z = self._search(self.root, key)
        if z is self.nil:
            return False

        y = z
        y_original_color = y.color

        if z.left is self.nil:
            x = z.right
            self._transplant(z, z.right)
        elif z.right is self.nil:
            x = z.left
            self._transplant(z, z.left)
        else:
            y = self._minimum(z.right)
            y_original_color = y.color
            x = y.right
            if y.parent is z:
                x.parent = y
            else:
                self._transplant(y, y.right)
                y.right = z.right
                y.right.parent = y
            self._transplant(z, y)
            y.left = z.left
            y.left.parent = y
            y.color = z.color

        if y_original_color == "black":
            self._delete_fixup(x)

        return True

    def _search(self, node, key):
        while node is not self.nil and node.key != key:
            if self._compare_keys(key, node.key) < 0:
                node = node.left
            else:
                node = node.right
        return node

    def inorder_traversal(self, node=None):
        if node is None:
            node = self.root
        result = []
        if node is self.nil:
            return result
        result.extend(self.inorder_traversal(node.left))
        result.append(node.value)
        result.extend(self.inorder_traversal(node.right))
        return result

    def _find_node_by_destination(self, node, destination_id):
        if node is self.nil:
            return self.nil

        found = self._find_node_by_destination(node.left, destination_id)
        if found is not self.nil:
            return found

        if node.key is not None and node.key[1] == destination_id:
            return node

        return self._find_node_by_destination(node.right, destination_id)

    def find_by_destination(self, destination_id):
        node = self._find_node_by_destination(self.root, destination_id)
        if node is self.nil:
            return None
        return node.value

    def delete_by_destination(self, destination_id):
        node = self._find_node_by_destination(self.root, destination_id)
        if node is self.nil:
            return False
        return self.delete(node.key)

    def print_tree(self, node=None, level=0):
        if node is None:
            node = self.root
        if node is not self.nil:
            self.print_tree(node.right, level + 1)
            print(" " * 4 * level + "->", node.key, f"({node.color})")
            self.print_tree(node.left, level + 1)
