# Package Analyzer

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-username/package-analyzer/blob/main/LICENSE)

Package Analyzer is an npm library that analyzes the dependencies of a project and generates an HTML report with information about their popularity, such as the number of stars, open issues, and the last update date of their respective GitHub repositories.

## Installation

You can install the library globally or as a development dependency in your project.

### Global installation

```bash
npm install -g package-analyzer
```

### Installation as a development dependency

```bash
npm install --save-dev package-analyzer
```

## Usage

The library can be used programmatically or through the command line.

### Programmatically

```javascript
const { getDependencyReport } = require('package-analyzer');

const packageJsonPath = './path/to/your/project/package.json';
const outputHtmlPath = './path/to/save/report.html';

getDependencyReport(packageJsonPath, outputHtmlPath);
```

Replace `packageJsonPath` with the path to your project's `package.json` file, and `outputHtmlPath` with the desired path to save the generated HTML report.

### Command Line

```bash
package-analyzer <path/to/package.json> <path/to/save/report.html>
```

Replace `<path/to/package.json>` with the path to your project's `package.json` file, and `<path/to/save/report.html>` with the desired path to save the generated HTML report.
