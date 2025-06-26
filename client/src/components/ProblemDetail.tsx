import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  testCases: TestCase[];
  timeLimit: number;
  memoryLimit: number;
  acceptedLanguages: string[];
}

interface Submission {
  status: string;
  testResults: {
    passed: boolean;
    output: string;
    expectedOutput: string;
    executionTime: number;
    memoryUsed: number;
  }[];
}

const ProblemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await axios.get(`http://10.180.28.83:5000/api/problems/${id}`);
        setProblem(response.data);
        // Set default code based on language
        setCode(getDefaultCode(language));
      } catch (error) {
        setError('Error fetching problem');
      }
    };

    fetchProblem();
  }, [id]);

  const getDefaultCode = (lang: string) => {
    if (problem && problem.title === 'Sum of Two Numbers') {
      switch (lang) {
        case 'c':
          return `#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("%d\\n", a + b);\n    return 0;\n}`;
        case 'cpp':
          return `#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b << endl;\n    return 0;\n}`;
        case 'python':
          return `a, b = map(int, input().split())\nprint(a + b)`;
        case 'c':
          return `#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("%d\\n", a + b);\n    return 0;\n}`;
        default:
          return '';
      }
    }
    
    // Default code for new problems
    if (problem) {
      switch (problem.title) {
        case 'Factorial Calculation':
          switch (lang) {
            case 'python':
              return `def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nn = int(input())\nprint(factorial(n))`;
            case 'c':
              return `#include <stdio.h>\n\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("%d\\n", factorial(n));\n    return 0;\n}`;
            case 'cpp':
              return `#include <iostream>\nusing namespace std;\n\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main() {\n    int n;\n    cin >> n;\n    cout << factorial(n) << endl;\n    return 0;\n}`;
            case 'java':
              return `import java.util.Scanner;\n\npublic class Main {\n    public static int factorial(int n) {\n        if (n <= 1) return 1;\n        return n * factorial(n - 1);\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(factorial(n));\n    }\n}`;
            default:
              return '';
          }
          
        case 'Fibonacci Sequence':
          switch (lang) {
            case 'python':
              return `def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\nn = int(input())\nprint(fibonacci(n))`;
            case 'c':
              return `#include <stdio.h>\n\nint fibonacci(int n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("%d\\n", fibonacci(n));\n    return 0;\n}`;
            case 'cpp':
              return `#include <iostream>\nusing namespace std;\n\nint fibonacci(int n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nint main() {\n    int n;\n    cin >> n;\n    cout << fibonacci(n) << endl;\n    return 0;\n}`;
            case 'java':
              return `import java.util.Scanner;\n\npublic class Main {\n    public static int fibonacci(int n) {\n        if (n <= 1) return n;\n        return fibonacci(n - 1) + fibonacci(n - 2);\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(fibonacci(n));\n    }\n}`;
            default:
              return '';
          }
          
        case 'Prime Number Check':
          switch (lang) {
            case 'python':
              return `def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\nn = int(input())\nprint(is_prime(n))`;
            case 'c':
              return `#include <stdio.h>\n#include <math.h>\n\nint isPrime(int n) {\n    if (n < 2) return 0;\n    for (int i = 2; i <= sqrt(n); i++) {\n        if (n % i == 0) return 0;\n    }\n    return 1;\n}\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("%s\\n", isPrime(n) ? "true" : "false");\n    return 0;\n}`;
            case 'cpp':
              return `#include <iostream>\n#include <cmath>\nusing namespace std;\n\nbool isPrime(int n) {\n    if (n < 2) return false;\n    for (int i = 2; i <= sqrt(n); i++) {\n        if (n % i == 0) return false;\n    }\n    return true;\n}\n\nint main() {\n    int n;\n    cin >> n;\n    cout << (isPrime(n) ? "true" : "false") << endl;\n    return 0;\n}`;
            case 'java':
              return `import java.util.Scanner;\n\npublic class Main {\n    public static boolean isPrime(int n) {\n        if (n < 2) return false;\n        for (int i = 2; i <= Math.sqrt(n); i++) {\n            if (n % i == 0) return false;\n        }\n        return true;\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(isPrime(n));\n    }\n}`;
            default:
              return '';
          }
          
        case 'Binary Search':
          switch (lang) {
            case 'python':
              return `def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\n# Read input\narr = list(map(int, input().split()))\ntarget = int(input())\nprint(binary_search(arr, target))`;
            case 'c':
              return `#include <stdio.h>\n#include <string.h>\n\nint binarySearch(int arr[], int n, int target) {\n    int left = 0, right = n - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}\n\nint main() {\n    int arr[100], n = 0;\n    while (scanf("%d", &arr[n]) == 1) {\n        n++;\n        if (getchar() == '\\n') break;\n    }\n    int target;\n    scanf("%d", &target);\n    int result = binarySearch(arr, n, target);\n    printf("%d\\n", result);\n    return 0;\n}`;
            case 'cpp':
              return `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint binarySearch(vector<int>& arr, int target) {\n    int left = 0, right = arr.size() - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}\n\nint main() {\n    vector<int> arr;\n    int num;\n    while (cin >> num) {\n        arr.push_back(num);\n        if (cin.get() == '\\n') break;\n    }\n    int target;\n    cin >> target;\n    cout << binarySearch(arr, target) << endl;\n    return 0;\n}`;
            case 'java':
              return `import java.util.Scanner;\nimport java.util.Arrays;\n\npublic class Main {\n    public static int binarySearch(int[] arr, int target) {\n        int left = 0, right = arr.length - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (arr[mid] == target) return mid;\n            if (arr[mid] < target) left = mid + 1;\n            else right = mid - 1;\n        }\n        return -1;\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String[] arrStr = sc.nextLine().split(" ");\n        int[] arr = new int[arrStr.length];\n        for (int i = 0; i < arrStr.length; i++) {\n            arr[i] = Integer.parseInt(arrStr[i]);\n        }\n        int target = sc.nextInt();\n        System.out.println(binarySearch(arr, target));\n    }\n}`;
            default:
              return '';
          }
          
        case 'Bubble Sort':
          switch (lang) {
            case 'python':
              return `def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n\narr = list(map(int, input().split()))\nresult = bubble_sort(arr)\nprint(' '.join(map(str, result)))`;
            case 'c':
              return `#include <stdio.h>\n\nvoid bubbleSort(int arr[], int n) {\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                int temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n            }\n        }\n    }\n}\n\nint main() {\n    int arr[100], n = 0;\n    while (scanf("%d", &arr[n]) == 1) {\n        n++;\n        if (getchar() == '\\n') break;\n    }\n    bubbleSort(arr, n);\n    for (int i = 0; i < n; i++) {\n        printf("%d", arr[i]);\n        if (i < n - 1) printf(" ");\n    }\n    printf("\\n");\n    return 0;\n}`;
            case 'cpp':
              return `#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid bubbleSort(vector<int>& arr) {\n    int n = arr.size();\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                swap(arr[j], arr[j + 1]);\n            }\n        }\n    }\n}\n\nint main() {\n    vector<int> arr;\n    int num;\n    while (cin >> num) {\n        arr.push_back(num);\n        if (cin.get() == '\\n') break;\n    }\n    bubbleSort(arr);\n    for (int i = 0; i < arr.size(); i++) {\n        cout << arr[i];\n        if (i < arr.size() - 1) cout << " ";\n    }\n    cout << endl;\n    return 0;\n}`;
            case 'java':
              return `import java.util.Scanner;\nimport java.util.Arrays;\n\npublic class Main {\n    public static void bubbleSort(int[] arr) {\n        int n = arr.length;\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < n - i - 1; j++) {\n                if (arr[j] > arr[j + 1]) {\n                    int temp = arr[j];\n                    arr[j] = arr[j + 1];\n                    arr[j + 1] = temp;\n                }\n            }\n        }\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String[] arrStr = sc.nextLine().split(" ");\n        int[] arr = new int[arrStr.length];\n        for (int i = 0; i < arrStr.length; i++) {\n            arr[i] = Integer.parseInt(arrStr[i]);\n        }\n        bubbleSort(arr);\n        for (int i = 0; i < arr.length; i++) {\n            System.out.print(arr[i]);\n            if (i < arr.length - 1) System.out.print(" ");\n        }\n        System.out.println();\n    }\n}`;
            default:
              return '';
          }
          
        case 'Anagram Check':
          switch (lang) {
            case 'python':
              return `def is_anagram(s1, s2):\n    return sorted(s1) == sorted(s2)\n\ns1, s2 = input().split()\nprint(is_anagram(s1, s2))`;
            case 'c':
              return `#include <stdio.h>\n#include <string.h>\n\nint isAnagram(char* s1, char* s2) {\n    int count1[256] = {0}, count2[256] = {0};\n    for (int i = 0; s1[i] != '\\0'; i++) {\n        count1[s1[i]]++;\n    }\n    for (int i = 0; s2[i] != '\\0'; i++) {\n        count2[s2[i]]++;\n    }\n    for (int i = 0; i < 256; i++) {\n        if (count1[i] != count2[i]) return 0;\n    }\n    return 1;\n}\n\nint main() {\n    char s1[100], s2[100];\n    scanf("%s %s", s1, s2);\n    printf("%s\\n", isAnagram(s1, s2) ? "true" : "false");\n    return 0;\n}`;
            case 'cpp':
              return `#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nbool isAnagram(string s1, string s2) {\n    sort(s1.begin(), s1.end());\n    sort(s2.begin(), s2.end());\n    return s1 == s2;\n}\n\nint main() {\n    string s1, s2;\n    cin >> s1 >> s2;\n    cout << (isAnagram(s1, s2) ? "true" : "false") << endl;\n    return 0;\n}`;
            case 'java':
              return `import java.util.Scanner;\nimport java.util.Arrays;\n\npublic class Main {\n    public static boolean isAnagram(String s1, String s2) {\n        char[] arr1 = s1.toCharArray();\n        char[] arr2 = s2.toCharArray();\n        Arrays.sort(arr1);\n        Arrays.sort(arr2);\n        return Arrays.equals(arr1, arr2);\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(isAnagram(s1, s2));\n    }\n}`;
            default:
              return '';
          }
          
        case 'Longest Common Subsequence':
          switch (lang) {
            case 'python':
              return `def lcs(s1, s2):\n    m, n = len(s1), len(s2)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    \n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if s1[i-1] == s2[j-1]:\n                dp[i][j] = dp[i-1][j-1] + 1\n            else:\n                dp[i][j] = max(dp[i-1][j], dp[i][j-1])\n    \n    return dp[m][n]\n\ns1, s2 = input().split()\nprint(lcs(s1, s2))`;
            case 'c':
              return `#include <stdio.h>\n#include <string.h>\n\nint lcs(char* s1, char* s2) {\n    int m = strlen(s1), n = strlen(s2);\n    int dp[m+1][n+1];\n    \n    for (int i = 0; i <= m; i++) {\n        for (int j = 0; j <= n; j++) {\n            if (i == 0 || j == 0) dp[i][j] = 0;\n            else if (s1[i-1] == s2[j-1]) dp[i][j] = dp[i-1][j-1] + 1;\n            else dp[i][j] = max(dp[i-1][j], dp[i][j-1]);\n        }\n    }\n    \n    return dp[m][n];\n}\n\nint main() {\n    char s1[100], s2[100];\n    scanf("%s %s", s1, s2);\n    printf("%d\\n", lcs(s1, s2));\n    return 0;\n}`;
            case 'cpp':
              return `#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint lcs(string s1, string s2) {\n    int m = s1.length(), n = s2.length();\n    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));\n    \n    for (int i = 1; i <= m; i++) {\n        for (int j = 1; j <= n; j++) {\n            if (s1[i - 1] == s2[j - 1]) {\n                dp[i][j] = dp[i - 1][j - 1] + 1;\n            } else {\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);\n            }\n        }\n    }\n    return dp[m][n];\n}\n\nint main() {\n    string s1, s2;\n    cin >> s1 >> s2;\n    cout << lcs(s1, s2) << endl;\n    return 0;\n}`;
            case 'java':
              return `import java.util.Scanner;\n\npublic class Main {\n    public static int lcs(String s1, String s2) {\n        int m = s1.length(), n = s2.length();\n        int[][] dp = new int[m + 1][n + 1];\n        \n        for (int i = 1; i <= m; i++) {\n            for (int j = 1; j <= n; j++) {\n                if (s1.charAt(i - 1) == s2.charAt(j - 1)) {\n                    dp[i][j] = dp[i - 1][j - 1] + 1;\n                } else {\n                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n                }\n            }\n        }\n        return dp[m][n];\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(lcs(s1, s2));\n    }\n}`;
            default:
              return '';
          }
          
        case 'Dijkstra\'s Shortest Path':
          switch (lang) {
            case 'python':
              return `import heapq\n\ndef dijkstra(graph, start):\n    n = len(graph)\n    distances = [float('inf')] * n\n    distances[start] = 0\n    pq = [(0, start)]\n    \n    while pq:\n        dist, node = heapq.heappop(pq)\n        if dist > distances[node]:\n            continue\n        \n        for neighbor, weight in enumerate(graph[node]):\n            if weight > 0:\n                new_dist = dist + weight\n                if new_dist < distances[neighbor]:\n                    distances[neighbor] = new_dist\n                    heapq.heappush(pq, (new_dist, neighbor))\n    \n    return distances\n\n# Read input\nn = int(input())\ngraph = []\nfor _ in range(n):\n    row = list(map(int, input().split()))\n    graph.append(row)\nstart = int(input())\n\nresult = dijkstra(graph, start)\nprint(' '.join(map(str, result)))`;
            case 'c':
              return `#include <stdio.h>\n#include <string.h>\n\nint dijkstra(int graph[][100], int n, int start) {\n    int distances[n];\n    for (int i = 0; i < n; i++) distances[i] = INT_MAX;\n    distances[start] = 0;\n    \n    int visited[n] = {0};\n    \n    for (int count = 0; count < n - 1; count++) {\n        int u = -1;\n        for (int v = 0; v < n; v++) {\n            if (!visited[v] && (u == -1 || distances[v] < distances[u])) {\n                u = v;\n            }\n        }\n        \n        visited[u] = 1;\n        \n        for (int v = 0; v < n; v++) {\n            if (graph[u][v] > 0 && !visited[v] && distances[u] != INT_MAX && distances[u] + graph[u][v] < distances[v]) {\n                distances[v] = distances[u] + graph[u][v];\n            }\n        }\n    }\n    return distances[n - 1];\n}\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int graph[n][n];\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            scanf("%d", &graph[i][j]);\n        }\n    }\n    int start;\n    scanf("%d", &start);\n    \n    int result = dijkstra(graph, n, start);\n    printf("%d\\n", result);\n    return 0;\n}`;
            case 'cpp':
              return `#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<int> dijkstra(vector<vector<int>>& graph, int start) {\n    int n = graph.size();\n    vector<int> distances(n, INT_MAX);\n    distances[start] = 0;\n    \n    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;\n    pq.push({0, start});\n    \n    while (!pq.empty()) {\n        int dist = pq.top().first;\n        int node = pq.top().second;\n        pq.pop();\n        \n        if (dist > distances[node]) continue;\n        \n        for (int neighbor = 0; neighbor < n; neighbor++) {\n            if (graph[node][neighbor] > 0) {\n                int newDist = dist + graph[node][neighbor];\n                if (newDist < distances[neighbor]) {\n                    distances[neighbor] = newDist;\n                    pq.push({newDist, neighbor});\n                }\n            }\n        }\n    }\n    return distances;\n}\n\nint main() {\n    int n;\n    cin >> n;\n    vector<vector<int>> graph(n, vector<int>(n));\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            cin >> graph[i][j];\n        }\n    }\n    int start;\n    cin >> start;\n    \n    vector<int> result = dijkstra(graph, start);\n    for (int i = 0; i < result.size(); i++) {\n        cout << result[i];\n        if (i < result.size() - 1) cout << " ";\n    }\n    cout << endl;\n    return 0;\n}`;
            case 'java':
              return `import java.util.*;\n\npublic class Main {\n    public static int[] dijkstra(int[][] graph, int start) {\n        int n = graph.length;\n        int[] distances = new int[n];\n        Arrays.fill(distances, Integer.MAX_VALUE);\n        distances[start] = 0;\n        \n        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);\n        pq.offer(new int[]{0, start});\n        \n        while (!pq.isEmpty()) {\n            int[] current = pq.poll();\n            int dist = current[0], node = current[1];\n            \n            if (dist > distances[node]) continue;\n            \n            for (int neighbor = 0; neighbor < n; neighbor++) {\n                if (graph[node][neighbor] > 0) {\n                    int newDist = dist + graph[node][neighbor];\n                    if (newDist < distances[neighbor]) {\n                        distances[neighbor] = newDist;\n                        pq.offer(new int[]{newDist, neighbor});\n                    }\n                }\n            }\n        }\n        return distances;\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[][] graph = new int[n][n];\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < n; j++) {\n                graph[i][j] = sc.nextInt();\n            }\n        }\n        int start = sc.nextInt();\n        \n        int[] result = dijkstra(graph, start);\n        for (int i = 0; i < result.length; i++) {\n            System.out.print(result[i]);\n            if (i < result.length - 1) System.out.print(" ");\n        }\n        System.out.println();\n    }\n}`;
            default:
              return '';
          }
          
        case 'N-Queens Problem':
          switch (lang) {
            case 'python':
              return `def solve_n_queens(n):\n    def is_safe(board, row, col):\n        for i in range(row):\n            if board[i] == col or abs(board[i] - col) == abs(i - row):\n                return False\n        return True\n    \n    def backtrack(board, row):\n        if row == n:\n            return 1\n        count = 0\n        for col in range(n):\n            if is_safe(board, row, col):\n                board[row] = col\n                count += backtrack(board, row + 1)\n        return count\n    \n    board = [-1] * n\n    return backtrack(board, 0)\n\nn = int(input())\nprint(solve_n_queens(n))`;
            case 'c':
              return `#include <stdio.h>\n#include <string.h>\n\nint isSafe(int board[], int row, int col) {\n    for (int i = 0; i < row; i++) {\n        if (board[i] == col || abs(board[i] - col) == abs(i - row)) {\n            return 0;\n        }\n    }\n    return 1;\n}\n\nint solveNQueens(int n) {\n    int board[n];\n    return backtrack(board, 0, n);\n}\n\nint backtrack(int board[], int row, int n) {\n    if (row == n) return 1;\n    \n    int count = 0;\n    for (int col = 0; col < n; col++) {\n        if (isSafe(board, row, col)) {\n            board[row] = col;\n            count += backtrack(board, row + 1, n);\n        }\n    }\n    return count;\n}\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("%d\\n", solveNQueens(n));\n    return 0;\n}`;
            case 'cpp':
              return `#include <iostream>\n#include <vector>\nusing namespace std;\n\nbool isSafe(vector<int>& board, int row, int col) {\n    for (int i = 0; i < row; i++) {\n        if (board[i] == col || abs(board[i] - col) == abs(i - row)) {\n            return false;\n        }\n    }\n    return true;\n}\n\nint backtrack(vector<int>& board, int row, int n) {\n    if (row == n) return 1;\n    \n    int count = 0;\n    for (int col = 0; col < n; col++) {\n        if (isSafe(board, row, col)) {\n            board[row] = col;\n            count += backtrack(board, row + 1, n);\n        }\n    }\n    return count;\n}\n\nint solveNQueens(int n) {\n    vector<int> board(n, -1);\n    return backtrack(board, 0, n);\n}\n\nint main() {\n    int n;\n    cin >> n;\n    cout << solveNQueens(n) << endl;\n    return 0;\n}`;
            case 'java':
              return `import java.util.Scanner;\n\npublic class Main {\n    public static int solveNQueens(int n) {\n        return backtrack(new int[n], 0, n);\n    }\n    \n    private static int backtrack(int[] board, int row, int n) {\n        if (row == n) return 1;\n        \n        int count = 0;\n        for (int col = 0; col < n; col++) {\n            if (isSafe(board, row, col)) {\n                board[row] = col;\n                count += backtrack(board, row + 1, n);\n            }\n        }\n        return count;\n    }\n    \n    private static boolean isSafe(int[] board, int row, int col) {\n        for (int i = 0; i < row; i++) {\n            if (board[i] == col || Math.abs(board[i] - col) == Math.abs(i - row)) {\n                return false;\n            }\n        }\n        return true;\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(solveNQueens(n));\n    }\n}`;
            default:
              return '';
          }
          
        case 'Knapsack Problem':
          switch (lang) {
            case 'python':
              return `def knapsack(weights, values, capacity):\n    n = len(weights)\n    dp = [[0] * (capacity + 1) for _ in range(n + 1)]\n    \n    for i in range(1, n + 1):\n        for w in range(capacity + 1):\n            if weights[i-1] <= w:\n                dp[i][w] = max(dp[i-1][w], dp[i-1][w-weights[i-1]] + values[i-1])\n            else:\n                dp[i][w] = dp[i-1][w]\n    \n    return dp[n][capacity]\n\n# Read input\nn, capacity = map(int, input().split())\nweights = []\nvalues = []\nfor _ in range(n):\n    w, v = map(int, input().split())\n    weights.append(w)\n    values.append(v)\n\nprint(knapsack(weights, values, capacity))`;
            case 'c':
              return `#include <stdio.h>\n#include <string.h>\n\nint knapsack(int weights[], int values[], int capacity, int n) {\n    int dp[n+1][capacity+1];\n    memset(dp, 0, sizeof(dp));\n    \n    for (int i = 1; i <= n; i++) {\n        for (int w = 0; w <= capacity; w++) {\n            if (weights[i-1] <= w) {\n                dp[i][w] = max(dp[i-1][w], dp[i-1][w-weights[i-1]] + values[i-1]);\n            }\n        }\n    }\n    return dp[n][capacity];\n}\n\nint main() {\n    int n, capacity;\n    scanf("%d %d", &n, &capacity);\n    \n    int weights[n], values[n];\n    for (int i = 0; i < n; i++) {\n        scanf("%d %d", &weights[i], &values[i]);\n    }\n    \n    printf("%d\\n", knapsack(weights, values, capacity, n));\n    return 0;\n}`;
            case 'cpp':
              return `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint knapsack(vector<int>& weights, vector<int>& values, int capacity) {\n    int n = weights.size();\n    vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));\n    \n    for (int i = 1; i <= n; i++) {\n        for (int w = 0; w <= capacity; w++) {\n            if (weights[i - 1] <= w) {\n                dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);\n            } else {\n                dp[i][w] = dp[i - 1][w];\n            }\n        }\n    }\n    return dp[n][capacity];\n}\n\nint main() {\n    int n, capacity;\n    cin >> n >> capacity;\n    \n    vector<int> weights(n), values(n);\n    for (int i = 0; i < n; i++) {\n        cin >> weights[i] >> values[i];\n    }\n    \n    cout << knapsack(weights, values, capacity) << endl;\n    return 0;\n}`;
            case 'java':
              return `import java.util.Scanner;\n\npublic class Main {\n    public static int knapsack(int[] weights, int[] values, int capacity) {\n        int n = weights.length;\n        int[][] dp = new int[n + 1][capacity + 1];\n        \n        for (int i = 1; i <= n; i++) {\n            for (int w = 0; w <= capacity; w++) {\n                if (weights[i - 1] <= w) {\n                    dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);\n                } else {\n                    dp[i][w] = dp[i - 1][w];\n                }\n            }\n        }\n        return dp[n][capacity];\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int capacity = sc.nextInt();\n        \n        int[] weights = new int[n];\n        int[] values = new int[n];\n        \n        for (int i = 0; i < n; i++) {\n            weights[i] = sc.nextInt();\n            values[i] = sc.nextInt();\n        }\n        \n        System.out.println(knapsack(weights, values, capacity));\n    }\n}`;
            default:
              return '';
          }
      }
    }
    
    // Fallback for other problems
    switch (lang) {
      case 'javascript':
        return 'function solution(input) {\n  // Write your code here\n  return input;\n}';
      case 'python':
        return 'def solution(input):\n    # Write your code here\n    return input';
      case 'c':
        return '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}';
      case 'cpp':
        return '#include <iostream>\n#include <string>\n\nstd::string solution(std::string input) {\n    // Write your code here\n    return input;\n}';
      default:
        return '';
    }
  };

  const handleLanguageChange = (event: any) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    setCode(getDefaultCode(newLanguage));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setError('Please login to submit your solution');
      return;
    }

    try {
      const response = await axios.post('http://10.180.28.83:5000/api/submissions', {
        problemId: id,
        code,
        language
      });
      setSubmission(response.data);
      setError('');
    } catch (error) {
      setError('Error submitting solution');
    }
  };

  if (!problem) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white' }}>
          {problem.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ color: 'lightgray' }}>
          Difficulty: {problem.difficulty}
        </Typography>
        <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="body1" paragraph sx={{ color: 'white' }}>
            {problem.description}
          </Typography>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'white' }}>Accepted Languages:</Typography>
            {problem.acceptedLanguages && problem.acceptedLanguages.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {problem.acceptedLanguages.map(lang => (
                  <span key={lang} style={{
                    background: '#e0e0e0',
                    borderRadius: '8px',
                    padding: '2px 10px',
                    fontSize: '0.95em',
                    marginRight: '6px',
                    marginBottom: '4px',
                    display: 'inline-block'
                  }}>{lang.toUpperCase()}</span>
                ))}
              </Box>
            )}
          </Box>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ height: '500px' }}>
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14
                }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: 'white' }}>Language</InputLabel>
                <Select
                  value={language}
                  label="Language"
                  onChange={handleLanguageChange}
                  sx={{ color: 'white' }}
                >
                  {problem.acceptedLanguages.map(lang => {
                    let label = lang;
                    if (lang === 'cpp') label = 'C++';
                    else if (lang === 'c') label = 'C';
                    else if (lang === 'javascript') label = 'JavaScript';
                    else if (lang === 'python') label = 'Python';
                    else label = lang.charAt(0).toUpperCase() + lang.slice(1);
                    return <MenuItem key={lang} value={lang}>{label}</MenuItem>;
                  })}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={!isAuthenticated}
              >
                Submit Solution
              </Button>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Paper>

            {submission && (
              <Paper elevation={2} sx={{ p: 2, mt: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Test Results
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {submission.testResults.map((result, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: 'white' }}>
                      Test Case {index + 1}:
                      <Typography
                        component="span"
                        color={result.passed ? 'success.main' : 'error.main'}
                        sx={{ ml: 1 }}
                      >
                        {result.passed ? 'Passed' : 'Failed'}
                      </Typography>
                    </Typography>
                    {!result.passed && (
                      <>
                        <Typography variant="body2" sx={{ color: 'lightgray' }}>
                          Expected: {result.expectedOutput}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'lightgray' }}>
                          Got: {result.output}
                        </Typography>
                      </>
                    )}
                    <Typography variant="body2" sx={{ color: 'lightgray' }}>
                      Time: {result.executionTime}ms | Memory: {result.memoryUsed}KB
                    </Typography>
                  </Box>
                ))}
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ProblemDetail; 