declare function getDependencyReport(packageJsonPath: string, outputHtmlPath: string, githubToken: string): Promise<void>;
export default getDependencyReport;
