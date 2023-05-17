#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ejs = require('ejs');
const ora = require('ora');

async function getPackageInfo(packageName) {
    const url = `https://registry.npmjs.org/${packageName}`;
    try {
        const response = await axios.get(url);
        return response.data.repository.url;
    } catch (error) {
        console.error(`Error fetching package info for ${packageName}:`, error.message);
    }
}

async function getRepositoryInfoFromURL(repoUrl) {
    const urlParts = repoUrl.split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1].replace('.git', '');
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${process.argv[4]}`,
            },
        });

        const { stargazers_count, open_issues_count, updated_at } = response.data;
        return { stars: stargazers_count, issues: open_issues_count, updated: updated_at };
    } catch (error) {
        console.error(`Error fetching repository info from URL ${repoUrl}:`, error.message);
    }
}

async function generateHTMLReport(report) {
    try {
        const templatePath = path.join(__dirname, 'reportTemplate.ejs');
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = ejs.render(template, { report });
        return html;
    } catch (error) {
        console.error('Error generating HTML report:', error.message);
    }
}

async function getDependencyReport(packageJsonPath, outputHtmlPath) {
    try {
        const packageJsonData = fs.readFileSync(packageJsonPath, 'utf-8');
        const { dependencies } = JSON.parse(packageJsonData);
        const report = {};
        const totalDependencies = Object.keys(dependencies).length;
        let completedDependencies = 0;

        const spinner = ora('Analyzing dependencies').start();

        for (const dependency of Object.keys(dependencies)) {
            const repoUrl = await getPackageInfo(dependency);
            if (repoUrl) {
                const repoInfo = await getRepositoryInfoFromURL(repoUrl);
                if (repoInfo && repoInfo.stars && repoInfo.issues && repoInfo.updated) {
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
        fs.writeFileSync(outputHtmlPath, htmlReport, 'utf-8');
        console.log(`Report generated at: ${outputHtmlPath}`);
    } catch (error) {
        console.error('Error generating dependency report:', error.message);
    }
}

if (process.argv.length !== 5) {
    console.log('Usage: package-analyzer <path/to/package.json> <path/to/save/report.html> github-token');
} else {
    const packageJsonPath = path.resolve(process.argv[2]);
    const outputHtmlPath = path.resolve(process.argv[3]);
    getDependencyReport(packageJsonPath, outputHtmlPath);
}
