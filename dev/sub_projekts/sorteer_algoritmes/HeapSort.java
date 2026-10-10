import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.Scanner;

public class HeapSort {

    // =========================================
    // Hoop Sorteer Algoritme
    // =========================================
    public static void heapSort(int[] numbers) {

        int n = numbers.length;

        // Bou Maksimum Hoop
        for (int i = n / 2 - 1; i >= 0; i--) {
            heapify(numbers, n, i);
        }

        // Verwyder elemente een vir een uit die hoop
        for (int i = n - 1; i > 0; i--) {

            // Skuif die grootste element na die einde
            int temp = numbers[0];
            numbers[0] = numbers[i];
            numbers[i] = temp;

            // Bou die oorblywende elemente weer as 'n hoop
            heapify(numbers, i, 0);
        }
    }

    // =========================================
    // Hoop Bou Funksie
    // =========================================
    public static void heapify(int[] numbers, int n, int root) {

        int largest = root;

        // Linker kind se posisie
        int leftChild = 2 * root + 1;

        // Regter kind se posisie
        int rightChild = 2 * root + 2;

        // Toets of die linker kind groter is
        if (leftChild < n && numbers[leftChild] > numbers[largest]) {
            largest = leftChild;
        }

        // Toets of die regter kind groter is
        if (rightChild < n && numbers[rightChild] > numbers[largest]) {
            largest = rightChild;
        }

        // As die grootste element nie die wortel is nie
        if (largest != root) {

            int temp = numbers[root];
            numbers[root] = numbers[largest];
            numbers[largest] = temp;

            // Bou die geaffekteerde sub-boom weer as 'n hoop
            heapify(numbers, n, largest);
        }
    }

    // =========================================
    // Hoofmetode
    // =========================================
    public static void main(String[] args) {

        ArrayList<Integer> data = new ArrayList<>();

        // -----------------------------------------
        // Lees die data uit Test-Data.txt
        // -----------------------------------------
        try (Scanner scanner = new Scanner(new File("Test-Data.txt"))) {

            while (scanner.hasNextInt()) {
                data.add(scanner.nextInt());
            }

        } catch (FileNotFoundException e) {

            System.out.println("Error: Test-Data.txt was not found.");
            return;
        }

        // Verander ArrayList<Integer> na int[]
        int[] numbers = new int[data.size()];

        for (int i = 0; i < data.size(); i++) {
            numbers[i] = data.get(i);
        }

        // -----------------------------------------
        // Vertoon die aantal heelgetalle
        // -----------------------------------------
        System.out.println(
                "Number of integers: " + numbers.length
        );

        // -----------------------------------------
        // Vertoon die oorspronklike data
        // -----------------------------------------
        System.out.println("\nOriginal data:");

        for (int number : numbers) {
            System.out.print(number + " ");
        }

        // -----------------------------------------
        // Begin die tydmeting
        // -----------------------------------------
        long startTime = System.nanoTime();

        // Voer die hoop-sorteeralgoritme uit
        heapSort(numbers);

        // -----------------------------------------
        // Stop die tydmeting
        // -----------------------------------------
        long endTime = System.nanoTime();

        // Bereken die uitvoeringstyd
        long runtime = endTime - startTime;

        // -----------------------------------------
        // Vertoon die gesorteerde data
        // -----------------------------------------
        System.out.println("\n\nSorted data:");

        for (int number : numbers) {
            System.out.print(number + " ");
        }

        // -----------------------------------------
        // Vertoon die uitvoeringstyd
        // -----------------------------------------
        System.out.println("\n\n========== Runtime Results ==========");

        System.out.println("Runtime: " + runtime + " nanoseconds");
        System.out.println("Runtime: " + (runtime / 1_000.0) + " microseconds");
        System.out.println("Runtime: " + (runtime / 1_000_000.0) + " milliseconds");

        System.out.println("=====================================");
    }
}