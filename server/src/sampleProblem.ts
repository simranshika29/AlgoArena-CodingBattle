import mongoose from 'mongoose';
import Problem from './models/Problem';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
     await mongoose.connect(process.env.MONGODB_URI!);

  const sampleProblem = {
    title: 'Sum of Two Numbers',
    description: `Write a program that takes two integers as input and prints their sum.\n\n**Preferred Languages:** C, C++, Python, Java\n\n**Example:**\nInput: 3 5\nOutput: 8`,
    difficulty: 'easy',
    testCases: [
      { input: '3 5', output: '8', isHidden: false },
      { input: '10 20', output: '30', isHidden: false },
      { input: '-2 7', output: '5', isHidden: false },
      { input: '100 200', output: '300', isHidden: true }
    ],
    timeLimit: 1000,
    memoryLimit: 256,
    createdBy: new mongoose.Types.ObjectId(), // Replace with a real user ID in production
    status: 'approved',
  };

  await Problem.create(sampleProblem);

  // Additional sample problems
  const problems = [
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
      acceptedLanguages: ['java', 'c', 'cpp', 'python'],
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
      acceptedLanguages: ['java', 'cpp', 'python'],
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
      acceptedLanguages: ['java', 'python'],
    },
  ];

  await Problem.insertMany(problems);

  // More sample problems
  const moreProblems = [
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
      acceptedLanguages: ['python', 'java', 'cpp', 'c'],
    },
    {
      title: 'Valid Parentheses',
      description: 'Given a string containing just the characters \'(\', \'\)\', \'{\', \'\}\', \'[\' and \'\]\', determine if the input string is valid.',
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
      acceptedLanguages: ['python', 'java', 'cpp'],
    },
    {
      title: 'Merge Two Sorted Lists',
      description: 'Merge two sorted linked lists and return it as a new sorted list.',
      difficulty: 'medium',
      testCases: [
        { input: '1 2 4\n1 3 4', output: '1 1 2 3 4 4', isHidden: false },
        { input: 'EMPTY', output: 'EMPTY', isHidden: false },
        { input: '2 6 7\n1 3 5', output: '1 2 3 5 6 7', isHidden: false },
        { input: '5 10\n', output: '5 10', isHidden: true },
        { input: ' ', output: ' ', isHidden: false },
      ],
      timeLimit: 2000,
      memoryLimit: 256,
      createdBy: new mongoose.Types.ObjectId(),
      status: 'approved',
      acceptedLanguages: ['python', 'java', 'cpp'],
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
      acceptedLanguages: ['python', 'java', 'cpp', 'c'],
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
      acceptedLanguages: ['python', 'java', 'cpp'],
    }
  ];

  await Problem.insertMany(moreProblems);

  // 10 Additional sample problems
  const additionalProblems = [
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
      title: 'Prime Number Check',
      description: 'Determine if a given number is prime. A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.\n\n**Example:**\nInput: 17\nOutput: true',
      difficulty: 'easy',
      testCases: [
        { input: '17', output: 'true', isHidden: false },
        { input: '4', output: 'false', isHidden: false },
        { input: '2', output: 'true', isHidden: false },
        { input: '1', output: 'false', isHidden: false },
        { input: '97', output: 'true', isHidden: true }
      ],
      timeLimit: 1000,
      memoryLimit: 256,
      createdBy: new mongoose.Types.ObjectId(),
      status: 'approved',
      acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
    },
    {
      title: 'Binary Search',
      description: 'Implement binary search to find the index of a target element in a sorted array. If the target is not found, return -1.\n\n**Example:**\nInput: 1 3 5 7 9 11, Target: 7\nOutput: 3',
      difficulty: 'medium',
      testCases: [
        { input: '1 3 5 7 9 11\n7', output: '3', isHidden: false },
        { input: '1 2 3 4 5\n6', output: '-1', isHidden: false },
        { input: '1 3 5 7\n1', output: '0', isHidden: false },
        { input: '2 4 6 8 10\n10', output: '4', isHidden: true }
      ],
      timeLimit: 2000,
      memoryLimit: 256,
      createdBy: new mongoose.Types.ObjectId(),
      status: 'approved',
      acceptedLanguages: ['python', 'java', 'cpp', 'javascript'],
    },
    {
      title: 'Bubble Sort',
      description: 'Implement bubble sort algorithm to sort an array of integers in ascending order.\n\n**Example:**\nInput: 64 34 25 12 22 11 90\nOutput: 11 12 22 25 34 64 90',
      difficulty: 'medium',
      testCases: [
        { input: '64 34 25 12 22 11 90', output: '11 12 22 25 34 64 90', isHidden: false },
        { input: '5 2 4 6 1 3', output: '1 2 3 4 5 6', isHidden: false },
        { input: '1', output: '1', isHidden: false },
        { input: '3 1 4 1 5 9 2 6', output: '1 1 2 3 4 5 6 9', isHidden: true }
      ],
      timeLimit: 2000,
      memoryLimit: 256,
      createdBy: new mongoose.Types.ObjectId(),
      status: 'approved',
      acceptedLanguages: ['python', 'java', 'cpp', 'c', 'javascript'],
    },
    {
      title: 'Anagram Check',
      description: 'Determine if two strings are anagrams. An anagram is a word or phrase formed by rearranging the letters of another word or phrase.\n\n**Example:**\nInput: listen silent\nOutput: true',
      difficulty: 'medium',
      testCases: [
        { input: 'listen silent', output: 'true', isHidden: false },
        { input: 'hello world', output: 'false', isHidden: false },
        { input: 'anagram nagaram', output: 'true', isHidden: false },
        { input: 'rat car', output: 'false', isHidden: true }
      ],
      timeLimit: 2000,
      memoryLimit: 256,
      createdBy: new mongoose.Types.ObjectId(),
      status: 'approved',
      acceptedLanguages: ['python', 'java', 'cpp', 'javascript'],
    },
    {
      title: 'Longest Common Subsequence',
      description: 'Find the length of the longest common subsequence between two strings. A subsequence is a sequence that appears in the same relative order but not necessarily contiguous.\n\n**Example:**\nInput: abcde ace\nOutput: 3',
      difficulty: 'hard',
      testCases: [
        { input: 'abcde ace', output: '3', isHidden: false },
        { input: 'abc abc', output: '3', isHidden: false },
        { input: 'abc def', output: '0', isHidden: false },
        { input: 'abcdgh aedfhr', output: '3', isHidden: true }
      ],
      timeLimit: 3000,
      memoryLimit: 512,
      createdBy: new mongoose.Types.ObjectId(),
      status: 'approved',
      acceptedLanguages: ['python', 'java', 'cpp'],
    },
    {
      title: 'Dijkstra\'s Shortest Path',
      description: 'Implement Dijkstra\'s algorithm to find the shortest path from a source vertex to all other vertices in a weighted graph.\n\n**Example:**\nInput: 4\n0 4 0 0\n4 0 8 0\n0 8 0 7\n0 0 7 0\n0\nOutput: 0 4 12 19',
      difficulty: 'hard',
      testCases: [
        { input: '4\n0 4 0 0\n4 0 8 0\n0 8 0 7\n0 0 7 0\n0', output: '0 4 12 19', isHidden: false },
        { input: '3\n0 1 4\n1 0 2\n4 2 0\n0', output: '0 1 3', isHidden: false },
        { input: '2\n0 5\n5 0\n0', output: '0 5', isHidden: true }
      ],
      timeLimit: 5000,
      memoryLimit: 512,
      createdBy: new mongoose.Types.ObjectId(),
      status: 'approved',
      acceptedLanguages: ['python', 'java', 'cpp'],
    },
    {
      title: 'N-Queens Problem',
      description: 'Place N queens on an N×N chessboard so that no two queens threaten each other. Return the number of valid solutions.\n\n**Example:**\nInput: 4\nOutput: 2',
      difficulty: 'hard',
      testCases: [
        { input: '4', output: '2', isHidden: false },
        { input: '1', output: '1', isHidden: false },
        { input: '2', output: '0', isHidden: false },
        { input: '8', output: '92', isHidden: true }
      ],
      timeLimit: 10000,
      memoryLimit: 512,
      createdBy: new mongoose.Types.ObjectId(),
      status: 'approved',
      acceptedLanguages: ['python', 'java', 'cpp'],
    },
    {
      title: 'Knapsack Problem',
      description: 'Given weights and values of n items, put these items in a knapsack of capacity W to get the maximum total value.\n\n**Example:**\nInput: 3 50\n10 60\n20 100\n30 120\nOutput: 220',
      difficulty: 'hard',
      testCases: [
        { input: '3 50\n10 60\n20 100\n30 120', output: '220', isHidden: false },
        { input: '4 10\n2 3\n3 4\n4 5\n5 6', output: '10', isHidden: false },
        { input: '1 10\n5 10', output: '10', isHidden: false },
        { input: '5 15\n1 1\n2 2\n3 3\n4 4\n5 5', output: '15', isHidden: true }
      ],
      timeLimit: 5000,
      memoryLimit: 512,
      createdBy: new mongoose.Types.ObjectId(),
      status: 'approved',
      acceptedLanguages: ['python', 'java', 'cpp'],
    }
  ];

  await Problem.insertMany(additionalProblems);

  console.log('Sample problem added!');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 