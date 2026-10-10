import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.Scanner;

public class BubbleSort {

    // Borrel Sorteer algorithm
    public static void bubbleSort(int[] numbers) {

        int n = numbers.length;

        for (int i = 0; i < n - 1; i++) {

            boolean swapped = false;

            for (int j = 0; j < n - i - 1; j++) {

                // as huidige nommer groter is, ruil om 
                // gaan na die volgende int
                if (numbers[j] > numbers[j + 1]) {

                    int temp = numbers[j];
                    numbers[j] = numbers[j + 1];
                    numbers[j + 1] = temp;

                    swapped = true;
                }
            }

            // geen veranderinge = geruilde sorteering
            if (!swapped) {
                break;
            }
        }
    }

    public static void main(String[] args) {

        ArrayList<Integer> data = new ArrayList<>();

        // lees vanaf Test-Data.txt 
        try (Scanner scanner = new Scanner(new File("Test-Data.txt"))) {

            while (scanner.hasNext()) {
                if (!scanner.hasNextInt()) {
                    System.out.println("Error: Invalid integer in Test-Data.txt: "
                            + scanner.next());
                    return;
                }
                data.add(scanner.nextInt());
            }

        } catch (FileNotFoundException e) {
            System.out.println("Error: Test-Data.txt was not found in "
                    + new File(".").getAbsolutePath());
            return;
        }

        // Convert ArrayList<Integer> to int[]
        int[] numbers = new int[data.size()];

        for (int i = 0; i < data.size(); i++) {
            numbers[i] = data.get(i);
        }

        // Vertoon aantal integers
        System.out.println("Number of integers: " + numbers.length);

        // Display oorspronklike data
        System.out.println("\nOriginal data:");
        for (int number : numbers) {
            System.out.print(number + " ");
        }

        // -------------------------------------------------
        // Begin hardlooptyd timer 
        // -------------------------------------------------
        long startTime = System.nanoTime();

        // Sorteer data
        bubbleSort(numbers);

        // -------------------------------------------------
        // Eindig hardlooptyd timer
        // -------------------------------------------------
        long endTime = System.nanoTime();

        // Calculate hardlooptyd
        long runtime = endTime - startTime;

        // Vertoon gesorteerde data
        System.out.println("\n\nSorted data:");
        for (int number : numbers) {
            System.out.print(number + " ");
        }

        // Vertoon Hardlooptyd
        System.out.println("\n\n--- Runtime Results ---");
        System.out.println("Runtime: " + runtime + " nanoseconds");
        System.out.println("Runtime: " + (runtime / 1_000.0) + " microseconds");
        System.out.println("Runtime: " + (runtime / 1_000_000.0) + " milliseconds");
    }
}