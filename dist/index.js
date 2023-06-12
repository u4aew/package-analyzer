"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const ejs_1 = __importDefault(require("ejs"));
const ora_1 = __importDefault(require("ora"));
function getPackageInfo(packageName) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://registry.npmjs.org/${packageName}`;
        try {
            const response = yield axios_1.default.get(url);
            return response.data.repository.url;
        }
        catch (error) {
            console.error(`Error fetching package info for ${packageName}:`, error.message);
        }
    });
}
function getRepositoryInfoFromURL(repoUrl, githubToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const urlParts = repoUrl.split('/');
        const owner = urlParts[urlParts.length - 2];
        const repo = urlParts[urlParts.length - 1].replace('.git', '');
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        try {
            const response = yield axios_1.default.get(apiUrl, {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                },
            });
            const { stargazers_count, open_issues_count, updated_at } = response.data;
            return { stars: stargazers_count, issues: open_issues_count, updated: updated_at };
        }
        catch (error) {
            console.error(`Error fetching repository info from URL ${repoUrl}:`, error.message);
        }
    });
}
function generateHTMLReport(report) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const templatePath = path_1.default.join(__dirname, 'template', 'reportTemplate.ejs');
            const template = fs_1.default.readFileSync(templatePath, 'utf-8');
            const html = ejs_1.default.render(template, { report });
            return html;
        }
        catch (error) {
            console.error('Error generating HTML report:', error.message);
        }
    });
}
function getDependencyReport(packageJsonPath, outputHtmlPath, githubToken) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const packageJsonData = fs_1.default.readFileSync(packageJsonPath, 'utf-8');
            const { dependencies } = JSON.parse(packageJsonData);
            const report = {};
            const totalDependencies = Object.keys(dependencies).length;
            let completedDependencies = 0;
            const spinner = (0, ora_1.default)('Analyzing dependencies').start();
            for (const dependency of Object.keys(dependencies)) {
                const repoUrl = yield getPackageInfo(dependency);
                if (repoUrl) {
                    const repoInfo = yield getRepositoryInfoFromURL(repoUrl, githubToken);
                    if (repoInfo) {
                        report[dependency] = repoInfo;
                    }
                    else {
                        console.warn(`Incomplete repository information found for ${dependency}`);
                    }
                }
                else {
                    console.warn(`No repository information found for ${dependency}`);
                }
                completedDependencies++;
                spinner.text = `Analyzing dependencies (${completedDependencies}/${totalDependencies})`;
            }
            spinner.succeed('Dependency analysis complete');
            const htmlReport = yield generateHTMLReport(report);
            if (htmlReport) {
                fs_1.default.writeFileSync(outputHtmlPath, htmlReport, 'utf-8');
                console.log(`Report generated at: ${outputHtmlPath}`);
            }
        }
        catch (error) {
            console.error('Error generating dependency report:', error.message);
        }
    });
}
exports.default = getDependencyReport;
