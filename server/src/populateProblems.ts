import mongoose from 'mongoose';
import Problem from './models/Problem';
import dotenv from 'dotenv';

dotenv.config();

async function populateProblems() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Clear existing problems
    await Problem.deleteMany({});
    console.log('Cleared existing problems');

    // Sample problems with all required fields
    const problems = [
      {
        title: 'Sum of Two Numbers',
        description: `Write a program that takes two integers as input and prints their sum.\n\n**Example:**\nInput: 3 5\nOutput: 8`,
        difficulty: 'easy',
        testCases: [
          { input: '3 5', output: '8', isHidden: false },
          { input: '10 20', output: '30', isHidden: false },
          { input: '-2 7', output: '5', isHidden: false },
          { input: '100 200', output: '300', isHidden: true }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['java', 'c', 'cpp', 'python', 'javascript'],
      },
      {
        title: 'Reverse a String',
        description: 'Write a program that takes a string as input and prints its reverse.\n\n**Example:**\nInput: hello\nOutput: olleh',
        difficulty: 'easy',
        testCases: [
          { input: 'hello', output: 'olleh', isHidden: false },
          { input: 'world', output: 'dlrow', isHidden: false },
          { input: 'abc', output: 'cba', isHidden: false },
          { input: 'racecar', output: 'racecar', isHidden: true }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['java', 'c', 'cpp', 'python', 'javascript'],
      },
      {
        title: 'Two Sum',
        description: 'Given an array of integers and a target, return indices of the two numbers such that they add up to the target.\n\n**Example:**\nInput: 2 7 11 15, Target: 9\nOutput: 0 1',
        difficulty: 'medium',
        testCases: [
          { input: '2 7 11 15\n9', output: '0 1', isHidden: false },
          { input: '1 2 3 4\n5', output: '0 3', isHidden: false },
          { input: '3 2 4\n6', output: '1 2', isHidden: false },
          { input: '3 3\n6', output: '0 1', isHidden: true }
        ],
        timeLimit: 2000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['java', 'cpp', 'python', 'javascript'],
      },
      {
        title: 'Palindrome Number',
        description: 'Determine if an integer is a palindrome. An integer is a palindrome when it reads the same backward as forward.',
        difficulty: 'easy',
        testCases: [
          { input: '121', output: 'true', isHidden: false },
          { input: '-121', output: 'false', isHidden: false },
          { input: '10', output: 'false', isHidden: false },
          { input: '1331', output: 'true', isHidden: true }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      {
        title: 'Valid Parentheses',
        description: 'Given a string containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
        difficulty: 'medium',
        testCases: [
          { input: '()', output: 'true', isHidden: false },
          { input: '()[]{}', output: 'true', isHidden: false },
          { input: '(]', output: 'false', isHidden: false },
          { input: '([)]', output: 'false', isHidden: false },
          { input: '{[]}', output: 'true', isHidden: true }
        ],
        timeLimit: 2000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'javascript'],
      },
      {
        title: 'Factorial Calculation',
        description: 'Calculate the factorial of a given non-negative integer n. The factorial of n is the product of all positive integers less than or equal to n.\n\n**Example:**\nInput: 5\nOutput: 120',
        difficulty: 'easy',
        testCases: [
          { input: '5', output: '120', isHidden: false },
          { input: '0', output: '1', isHidden: false },
          { input: '1', output: '1', isHidden: false },
          { input: '10', output: '3628800', isHidden: true }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      {
        title: 'Fibonacci Sequence',
        description: 'Generate the nth number in the Fibonacci sequence. The Fibonacci sequence is defined as: F(0) = 0, F(1) = 1, and F(n) = F(n-1) + F(n-2) for n > 1.\n\n**Example:**\nInput: 7\nOutput: 13',
        difficulty: 'easy',
        testCases: [
          { input: '7', output: '13', isHidden: false },
          { input: '0', output: '0', isHidden: false },
          { input: '1', output: '1', isHidden: false },
          { input: '10', output: '55', isHidden: true }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      {
        title: 'Maximum Subarray',
        description: 'Find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
        difficulty: 'medium',
        testCases: [
          { input: '-2 1 -3 4 -1 2 1 -5 4', output: '6', isHidden: false },
          { input: '1', output: '1', isHidden: false },
          { input: '5 4 -1 7 8', output: '23', isHidden: false },
          { input: '-1 -2 -3 -4', output: '-1', isHidden: true }
        ],
        timeLimit: 2000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      {
        title: 'Longest Substring Without Repeating Characters',
        description: 'Given a string, find the length of the longest substring without repeating characters.\n\n**Example:**\nInput: abcabcbb\nOutput: 3',
        difficulty: 'hard',
        testCases: [
          { input: 'abcabcbb', output: '3', isHidden: false },
          { input: 'bbbbb', output: '1', isHidden: false },
          { input: 'pwwkew', output: '3', isHidden: false },
          { input: 'dvdf', output: '3', isHidden: true }
        ],
        timeLimit: 3000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['java', 'python', 'cpp', 'javascript'],
      },
      {
        title: 'Find Peak Element',
        description: 'A peak element is an element that is strictly greater than its neighbors. Given an array, find a peak element and return its index.',
        difficulty: 'hard',
        testCases: [
          { input: '1 2 3 1', output: '2', isHidden: false },
          { input: '1 2 1 3 5 6 4', output: '5', isHidden: false },
          { input: '5 4 3 2 1', output: '0', isHidden: false },
          { input: '2 1 2 3 2 1', output: '3', isHidden: true }
        ],
        timeLimit: 3000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'javascript'],
      },
      // 1. Count Vowels
      {
        title: 'Count Vowels',
        description: 'Write a program to count the number of vowels in a given string.',
        difficulty: 'easy',
        testCases: [
          { input: 'hello', output: '2', isHidden: false },
          { input: 'world', output: '1', isHidden: false },
          { input: 'aeiou', output: '5', isHidden: false },
          { input: 'bcdfg', output: '0', isHidden: true }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      // 2. Prime Number Check
      {
        title: 'Prime Number Check',
        description: 'Check if a given number is a prime number.',
        difficulty: 'easy',
        testCases: [
          { input: '7', output: 'true', isHidden: false },
          { input: '10', output: 'false', isHidden: false },
          { input: '2', output: 'true', isHidden: false },
          { input: '1', output: 'false', isHidden: true }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      // 3. GCD of Two Numbers
      {
        title: 'GCD of Two Numbers',
        description: 'Find the greatest common divisor (GCD) of two integers.',
        difficulty: 'easy',
        testCases: [
          { input: '12 18', output: '6', isHidden: false },
          { input: '100 25', output: '25', isHidden: false },
          { input: '7 13', output: '1', isHidden: false },
          { input: '81 27', output: '27', isHidden: true }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      // 4. Merge Two Sorted Arrays
      {
        title: 'Merge Two Sorted Arrays',
        description: 'Merge two sorted arrays into one sorted array.',
        difficulty: 'medium',
        testCases: [
          { input: '1 3 5\n2 4 6', output: '1 2 3 4 5 6', isHidden: false },
          { input: '10 20\n5 15', output: '5 10 15 20', isHidden: false },
          { input: '1 2 3\n', output: '1 2 3', isHidden: false },
          { input: '\n4 5 6', output: '4 5 6', isHidden: true }
        ],
        timeLimit: 2000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      // 5. Matrix Transpose
      {
        title: 'Matrix Transpose',
        description: 'Given a matrix, print its transpose.',
        difficulty: 'medium',
        testCases: [
          { input: '2 2\n1 2\n3 4', output: '1 3\n2 4', isHidden: false },
          { input: '3 2\n1 2\n3 4\n5 6', output: '1 3 5\n2 4 6', isHidden: false },
          { input: '1 1\n7', output: '7', isHidden: false },
          { input: '2 3\n1 2 3\n4 5 6', output: '1 4\n2 5\n3 6', isHidden: true }
        ],
        timeLimit: 2000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      // 6. Anagram Checker
      {
        title: 'Anagram Checker',
        description: 'Check if two strings are anagrams of each other.',
        difficulty: 'easy',
        testCases: [
          { input: 'listen\nsilent', output: 'true', isHidden: false },
          { input: 'hello\nworld', output: 'false', isHidden: false },
          { input: 'evil\nlive', output: 'true', isHidden: false },
          { input: 'abc\ncba', output: 'true', isHidden: true }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      // 7. Find Duplicates in Array
      {
        title: 'Find Duplicates in Array',
        description: 'Find all duplicate elements in an array.',
        difficulty: 'medium',
        testCases: [
          { input: '1 2 3 2 4 5 1', output: '1 2', isHidden: false },
          { input: '5 6 7 8', output: '', isHidden: false },
          { input: '9 9 9 9', output: '9', isHidden: false },
          { input: '1 2 3 4 5', output: '', isHidden: true }
        ],
        timeLimit: 2000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      // 8. Rotate Array
      {
        title: 'Rotate Array',
        description: 'Rotate an array to the right by k steps.',
        difficulty: 'medium',
        testCases: [
          { input: '1 2 3 4 5\n2', output: '4 5 1 2 3', isHidden: false },
          { input: '10 20 30 40\n1', output: '40 10 20 30', isHidden: false },
          { input: '7 8 9\n3', output: '7 8 9', isHidden: false },
          { input: '1 2 3 4\n0', output: '1 2 3 4', isHidden: true }
        ],
        timeLimit: 2000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      // 9. Subset Sum
      {
        title: 'Subset Sum',
        description: 'Given a set of numbers, determine if there is a subset with a given sum.',
        difficulty: 'hard',
        testCases: [
          { input: '3\n1 2 3\n5', output: 'true', isHidden: false },
          { input: '4\n2 4 6 10\n16', output: 'true', isHidden: false },
          { input: '3\n1 2 5\n4', output: 'false', isHidden: false },
          { input: '5\n1 3 5 7 9\n8', output: 'true', isHidden: true }
        ],
        timeLimit: 4000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      // 10. Word Ladder
      {
        title: 'Word Ladder',
        description: 'Given two words and a dictionary, find the length of the shortest transformation sequence from start to end.',
        difficulty: 'hard',
        testCases: [
          { input: 'hit\ncog\nhot dot dog lot log cog', output: '5', isHidden: false },
          { input: 'hit\ncog\nhot dot dog lot log', output: '0', isHidden: false },
          { input: 'a\nc\na b c', output: '2', isHidden: false },
          { input: 'red\nend\nred led end', output: '3', isHidden: true }
        ],
        timeLimit: 5000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'javascript'],
      },
      // 11. Sudoku Solver
      {
        title: 'Sudoku Solver',
        description: 'Write a program to solve a 9x9 Sudoku puzzle.',
        difficulty: 'hard',
        testCases: [
          { input: '530070000600195000098000060800060003400803001700020006060000280000419005000080079', output: '534678912672195348198342567859761423426853791713924856961537284287419635345286179', isHidden: false },
          { input: '003020600900305001001806400008102900700000008006708200002609500800203009005010300', output: '483921657967345821251876493548132976729564138136798245372689514814253769695417382', isHidden: false },
          { input: '123456789456789123789123456231564897564897231897231564312645978645978312978312645', output: '123456789456789123789123456231564897564897231897231564312645978645978312978312645', isHidden: true }
        ],
        timeLimit: 8000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'javascript'],
      },
      // 12. Longest Palindromic Substring
      {
        title: 'Longest Palindromic Substring',
        description: 'Given a string, find the longest palindromic substring.',
        difficulty: 'hard',
        testCases: [
          { input: 'babad', output: 'bab', isHidden: false },
          { input: 'cbbd', output: 'bb', isHidden: false },
          { input: 'a', output: 'a', isHidden: false },
          { input: 'ac', output: 'a', isHidden: true }
        ],
        timeLimit: 4000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'javascript'],
      },
      // 13. Coin Change
      {
        title: 'Coin Change',
        description: 'Given coins of different denominations and a total amount, compute the fewest number of coins needed.',
        difficulty: 'medium',
        testCases: [
          { input: '3\n1 2 5\n11', output: '3', isHidden: false },
          { input: '2\n2 5\n3', output: '-1', isHidden: false },
          { input: '1\n2\n0', output: '0', isHidden: false },
          { input: '4\n1 2 5 10\n27', output: '4', isHidden: true }
        ],
        timeLimit: 3000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      // 14. Remove Duplicates from Sorted List
      {
        title: 'Remove Duplicates from Sorted List',
        description: 'Remove duplicates from a sorted linked list.',
        difficulty: 'easy',
        testCases: [
          { input: '1 1 2 3 3', output: '1 2 3', isHidden: false },
          { input: '1 2 3 4', output: '1 2 3 4', isHidden: false },
          { input: '2 2 2 2', output: '2', isHidden: false },
          { input: '1', output: '1', isHidden: true }
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      },
      // 15. Find Median of Two Sorted Arrays
      {
        title: 'Find Median of Two Sorted Arrays',
        description: 'Find the median of two sorted arrays.',
        difficulty: 'hard',
        testCases: [
          { input: '1 3\n2', output: '2.0', isHidden: false },
          { input: '1 2\n3 4', output: '2.5', isHidden: false },
          { input: '0 0\n0 0', output: '0.0', isHidden: false },
          { input: '2\n1 3', output: '2.0', isHidden: true }
        ],
        timeLimit: 5000,
        memoryLimit: 256,
        createdBy: new mongoose.Types.ObjectId(),
        status: 'approved',
        acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
      }
    ];

    // Filter out empty output test cases
    const filteredProblems = problems.map(problem => ({
      ...problem,
      testCases: problem.testCases.filter(testCase => testCase.output !== '')
    }));

    // Insert problems
    await Problem.insertMany(filteredProblems);
    console.log(`Successfully inserted ${filteredProblems.length} problems`);

    // Verify insertion
    const count = await Problem.countDocuments();
    console.log(`Total problems in database: ${count}`);

  } catch (error) {
    console.error('Error populating problems:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateProblems(); 