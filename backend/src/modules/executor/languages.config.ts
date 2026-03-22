export const languageConfigs = {
  python: {
    image: 'python:3.11-slim',
    extension: '.py',
    command: 'python',
    template: `def solution():
    # Write your code here
    pass

if __name__ == "__main__":
    solution()`,
  },
  javascript: {
    image: 'node:20-slim',
    extension: '.js',
    command: 'node',
    template: `function solution() {
    // Write your code here
}

solution();`,
  },
  java: {
    image: 'openjdk:17-slim',
    extension: '.java',
    command: 'java',
    template: `public class Solution {
    public static void main(String[] args) {
        // Write your code here
    }
}`,
  },
  cpp: {
    image: 'gcc:latest',
    extension: '.cpp',
    command: 'g++',
    compileCommand: 'g++ -o solution solution.cpp && ./solution',
    template: `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}`,
  },
  c: {
    image: 'gcc:latest',
    extension: '.c',
    command: 'gcc',
    compileCommand: 'gcc -o solution solution.c && ./solution',
    template: `#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}`,
  },
};

export type Language = keyof typeof languageConfigs;
