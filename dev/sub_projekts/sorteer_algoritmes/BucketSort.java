import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Scanner;

public class BucketSort {

    // Bucket Sort Algorithm
    public static void bucketSort(int[] numbers) {

        if (numbers.length == 0) {
            return;
        }

        // vind die minimum and maximum waardes
        int min = numbers[0];
        int max = numbers[0];

        for (int number : numbers) {
            if (number < min) {
                min = number;
            }

            if (number > max) {
                max = number;
            }
        }

        // Skep Emmer
        int bucketCount = (int) Math.sqrt(numbers.length);

        if (bucketCount < 1) {
            bucketCount = 1;
        }

        ArrayList<ArrayList<Integer>> buckets = new ArrayList<>();

        for (int i = 0; i < bucketCount; i++) {
            buckets.add(new ArrayList<>());
        }

        // plaas elke nommer in sy gegewe emmer
        for (int number : numbers) {

            int bucketIndex;

            // Verhoed 0 deeling van gelyke nommers
            if (max == min) {
                bucketIndex = 0;
            } else {
                bucketIndex = (int) ((long) (number - min)
                        * bucketCount / (max - min + 1L));

                // kyk vir veiligheid
                if (bucketIndex >= bucketCount) {
                    bucketIndex = bucketCount - 1;
                }
            }

            buckets.get(bucketIndex).add(number);
        }

        // Sorteer elke emmer
        for (ArrayList<Integer> bucket : buckets) {
            Collections.sort(bucket);
        }

        // kombineer emmers in skikking in
        int index = 0;

        for (ArrayList<Integer> bucket : buckets) {
            for (int number : bucket) {
                numbers[index] = number;
                index++;
            }
        }
    }

    public static void main(String[] args) {

        ArrayList<Integer> data = new ArrayList<>();

        // -----------------------------------------
        // lees vanaf Test-Data.txt
        // -----------------------------------------
        try (Scanner scanner = new Scanner(new File("Test-Data.txt"))) {

            while (scanner.hasNextInt()) {
                data.add(scanner.nextInt());
            }

        } catch (FileNotFoundException e) {

            System.out.println("Error: Test-Data.txt was not found.");
            return;
        }

        // verander ArrayList<Integer> na int[]
        int[] numbers = new int[data.size()];

        for (int i = 0; i < data.size(); i++) {
            numbers[i] = data.get(i);
        }

        System.out.println("Number of integers: " + numbers.length);

        // -----------------------------------------
        // Vertoon oorspronklike data
        // -----------------------------------------
        System.out.println("\nOriginal data:");

        for (int number : numbers) {
            System.out.print(number + " ");
        }

        // -----------------------------------------
        // begin klokslagg
        // -----------------------------------------
        long startTime = System.nanoTime();

        // hardloop emmer sorteer
        bucketSort(numbers);

        // -----------------------------------------
        // stop klokslag
        // -----------------------------------------
        long endTime = System.nanoTime();

        // Calculate runtime
        long runtime = endTime - startTime;

        // -----------------------------------------
        // vertoon sorteerde data
        // -----------------------------------------
        System.out.println("\n\nSorted data:");

        for (int number : numbers) {
            System.out.print(number + " ");
        }

        // -----------------------------------------
        // vertoon hardlooptyd
        // -----------------------------------------
        System.out.println("\n\n========== Runtime Results ==========");

        System.out.println("Runtime: " + runtime + " nanoseconds");
        System.out.println("Runtime: " + (runtime / 1_000.0) + " microseconds");
        System.out.println("Runtime: " + (runtime / 1_000_000.0) + " milliseconds");

        System.out.println("=====================================");
    }
}