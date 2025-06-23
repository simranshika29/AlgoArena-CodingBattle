import mongoose from 'mongoose';
import Problem from './models/Problem';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
     await mongoose.connect('mongodb://localhost:27017/algoarena', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);

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

  console.log('Sample problem added!');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 