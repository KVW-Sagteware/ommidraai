import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.Scanner;

public class RadixSort {

    // =========================================
    // Radix Sorteer Algoritme
    // =========================================
    public static void radixSort(int[] numbers) {

        if (numbers.length == 0) {
            return;
        }

        // Skei negatiewe en positiewe getalle
        ArrayList<Integer> negativeList = new ArrayList<>();
        ArrayList<Integer> positiveList = new ArrayList<>();

        for (int number : numbers) {

            if (number < 0) {
                negativeList.add(-number);
            } else {
                positiveList.add(number);
            }
        }

        // Verander lyste na skikkings
        int[] negativeNumbers = new int[negativeList.size()];
        int[] positiveNumbers = new int[positiveList.size()];

        for (int i = 0; i < negativeList.size(); i++) {
            negativeNumbers[i] = negativeList.get(i);
        }

        for (int i = 0; i < positiveList.size(); i++) {
            positiveNumbers[i] = positiveList.get(i);
        }

        // Sorteer beide skikkings
        radixSortPositive(negativeNumbers);
        radixSortPositive(positiveNumbers);

        // Kombineer die skikkings
        int index = 0;

        // Negatiewe getalle moet in omgekeerde volgorde geplaas word
        for (int i = negativeNumbers.length - 1; i >= 0; i--) {
            numbers[index] = -negativeNumbers[i];
            index++;
        }

        // Voeg positiewe getalle by
        for (int number : positiveNumbers) {
            numbers[index] = number;
            index++;
        }
    }

    // =========================================
    // Radix Sorteer vir Positiewe Heelgetalle
    // =========================================
    public static void radixSortPositive(int[] numbers) {

        if (numbers.length == 0) {
            return;
        }

        // Vind die grootste getal
        int max = numbers[0];

        for (int number : numbers) {
            if (number > max) {
                max = number;
            }
        }

        // Sorteer volgens elke syfer
        for (int place = 1; max / place > 0; place *= 10) {
            countingSort(numbers, place);
        }
    }

    // =========================================
    // Counting Sort wat deur Radix Sort gebruik word
    // =========================================
    public static void countingSort(int[] numbers, int place) {

        int n = numbers.length;

        int[] output = new int[n];

        // Daar is 10 moontlike syfers (0-9)
        int[] count = new int[10];

        // Tel hoeveel keer elke syfer voorkom
        for (int number : numbers) {

            int digit = (number / place) % 10;

            count[digit]++;
        }

        // Bereken die posisies
        for (int i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }

        // Bou die uitset-skikking
        for (int i = n - 1; i >= 0; i--) {

            int digit = (numbers[i] / place) % 10;

            output[count[digit] - 1] = numbers[i];

            count[digit]--;
        }

        // Kopieer die uitset terug na die oorspronklike skikking
        for (int i = 0; i < n; i++) {
            numbers[i] = output[i];
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

        // Voer Radix Sort uit
        radixSort(numbers);

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