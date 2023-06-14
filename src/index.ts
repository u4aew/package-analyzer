import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ejs from 'ejs';
import ora from 'ora';

interface RepositoryInfo {
    stars: number;
    issues: number;
    updated: string;
    homepage: string;
    npmUrl: string;
    license: string;
}

async function getPackageInfo(packageName: string): Promise<{repoUrl: string, npmUrl: string} | undefined> {
    const url = `https://registry.npmjs.org/${packageName}`;
    try {
        const response = await axios.get(url);
        return {
            repoUrl: response.data.repository.url,
            npmUrl: `https://www.npmjs.com/package/${packageName}`
        };
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

        const { stargazers_count, open_issues_count, updated_at, html_url, license } = response.data;
        return { stars: stargazers_count, issues: open_issues_count, updated: updated_at, homepage: html_url, npmUrl: `https://www.npmjs.com/package/${repo}`, license: license ? license.spdx_id : 'None' };
    } catch (error) {
        console.error(`Error fetching repository info from URL ${repoUrl}:`, (error as Error).message);
    }
}

async function generateHTMLReport(report: { [key: string]: RepositoryInfo }, packagesWithRiskyLicenses: { [key: string]: RepositoryInfo } ): Promise<string | undefined> {
    try {
        const templatePath = path.join(__dirname, 'template', 'reportTemplate.ejs');
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = ejs.render(template, { report, packagesWithRiskyLicenses });
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

        const riskyLicenses = ['GPL', 'AGPL', 'SSPL'];
        const packagesWithRiskyLicenses: { [key: string]: RepositoryInfo } = {};

        const spinner = ora('Analyzing dependencies').start();

        for (const dependency of Object.keys(dependencies)) {
            const urls = await getPackageInfo(dependency);
            if (urls && urls.repoUrl) {
                const repoInfo = await getRepositoryInfoFromURL(urls.repoUrl, githubToken);
                if (repoInfo) {
                    if (riskyLicenses.includes(repoInfo.license)) {
                        packagesWithRiskyLicenses[dependency] = repoInfo;
                    }
                    // @ts-ignore
                    report[dependency] = { ...repoInfo, npmUrl: urls.npmUrl };
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

        const htmlReport = await generateHTMLReport(report, packagesWithRiskyLicenses);
        if (htmlReport) {
            fs.writeFileSync(outputHtmlPath, htmlReport, 'utf-8');
            console.log(`Report generated at: ${outputHtmlPath}`);
        }
    } catch (error) {
        console.error('Error generating dependency report:', (error as Error).message);
    }
}

export default getDependencyReport;
