# NPM Dependency Reporter

This project is a tool for analyzing dependencies from a `package.json` file and generating an HTML report that provides information about each dependency's repository, including the star count, open issue count, and last updated date.

## Usage

The main function `getDependencyReport` requires three parameters:

- `packageJsonPath`: The path to the `package.json` file to analyze.
- `outputHtmlPath`: The path where the HTML report will be saved.
- `githubToken`: Your GitHub personal access token. This is required to use GitHub's API to fetch repository information.

Here's an example of how you could use this function:

```javascript
import getDependencyReport from './path/to/your/file';

const packageJsonPath = './path/to/your/package.json';
const outputHtmlPath = './path/to/output/report.html';
const githubToken = 'your github token here';

getDependencyReport(packageJsonPath, outputHtmlPath, githubToken);
```

This will create an HTML report at the specified `outputHtmlPath`.

## Contributing

Contributions are always welcome. Please make a pull request.

## License

This project is licensed under the terms of the MIT license.
