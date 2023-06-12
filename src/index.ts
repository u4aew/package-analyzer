import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ejs from 'ejs';
import ora from 'ora';

interface RepositoryInfo {
    stars: number;
    issues: number;
    updated: string;
}

async function getPackageInfo(packageName: string): Promise<string | undefined> {
    const url = `https://registry.npmjs.org/${packageName}`;
    try {
        const response = await axios.get(url);
        return response.data.repository.url;
    } catch (error) {
        console.error(`Error fetching package info for ${packageName}:`, (error as Error).message);
    }
}

async function getRepositoryInfoFromURL(repoUrl: string, githubToken: string): Promise<RepositoryInfo | undefined> {
    const urlParts = repoUrl.split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1].replace('.git', '');
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${githubToken}`,
            },
        });

        const { stargazers_count, open_issues_count, updated_at } = response.data;
        return { stars: stargazers_count, issues: open_issues_count, updated: updated_at };
    } catch (error) {
        console.error(`Error fetching repository info from URL ${repoUrl}:`, (error as Error).message);
    }
}

async function generateHTMLReport(report: { [key: string]: RepositoryInfo }): Promise<string | undefined> {
    try {
        const templatePath = path.join(__dirname, 'template', 'reportTemplate.ejs');
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = ejs.render(template, { report });
        return html;
    } catch (error) {
        console.error('Error generating HTML report:', (error as Error).message);
    }
}

async function getDependencyReport(packageJsonPath: string, outputHtmlPath: string, githubToken: string): Promise<void> {
    try {
        const packageJsonData = fs.readFileSync(packageJsonPath, 'utf-8');
        const { dependencies } = JSON.parse(packageJsonData);
        const report: { [key: string]: RepositoryInfo } = {};
        const totalDependencies = Object.keys(dependencies).length;
        let completedDependencies = 0;

        const spinner = ora('Analyzing dependencies').start();

        for (const dependency of Object.keys(dependencies)) {
            const repoUrl = await getPackageInfo(dependency);
            if (repoUrl) {
                const repoInfo = await getRepositoryInfoFromURL(repoUrl, githubToken);
                if (repoInfo) {
                    report[dependency] = repoInfo;
                } else {
                    console.warn(`Incomplete repository information found for ${dependency}`);
                }
            } else {
                console.warn(`No repository information found for ${dependency}`);
            }
            completedDependencies++;

            spinner.text = `Analyzing dependencies (${completedDependencies}/${totalDependencies})`;
        }

        spinner.succeed('Dependency analysis complete');

        const htmlReport = await generateHTMLReport(report);
        if (htmlReport) {
            fs.writeFileSync(outputHtmlPath, htmlReport, 'utf-8');
            console.log(`Report generated at: ${outputHtmlPath}`);
        }
    } catch (error) {
        console.error('Error generating dependency report:', (error as Error).message);
    }
}

export default getDependencyReport;
