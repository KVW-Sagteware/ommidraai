import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.Scanner;

public class SelectionSort {

    // =========================================
    // Selection Sorteer Algoritme
    // =========================================
    public static void selectionSort(int[] numbers) {

        int n = numbers.length;

        // Beweeg deur elke posisie in die skikking
        for (int i = 0; i < n - 1; i++) {

            // Neem aan dat die huidige posisie
            // die kleinste waarde bevat
            int minIndex = i;

            // Vind die kleinste waarde in die
            // oorblywende ongesorteerde gedeelte
            for (int j = i + 1; j < n; j++) {

                if (numbers[j] < numbers[minIndex]) {
                    minIndex = j;
                }
            }

            // Ruil die kleinste waarde met die
            // waarde by posisie i
            if (minIndex != i) {

                int temp = numbers[i];
                numbers[i] = numbers[minIndex];
                numbers[minIndex] = temp;
            }
        }
    }

    // =========================================
    // Hoofmetode
    // =========================================
    public static void main(String[] args) {

        ArrayList<Integer> data = new ArrayList<>();

        // -----------------------------------------
        // Lees heelgetalle uit Test-Data.txt
        // -----------------------------------------
        try (Scanner scanner = new Scanner(new File("Test-Data.txt"))) {

            while (scanner.hasNextInt()) {
                data.add(scanner.nextInt());
            }

        } catch (FileNotFoundException e) {

            System.out.println(
                    "Error: Test-Data.txt was not found."
            );

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
        // BEGIN TYDMETING
        // -----------------------------------------
        long startTime = System.nanoTime();

        // Voer Selection Sort uit
        selectionSort(numbers);

        // -----------------------------------------
        // STOP TYDMETING
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