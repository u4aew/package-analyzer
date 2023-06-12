import getDependencyReport from 'package-analyzer';

const initApp = async () => {
    try {
        await getDependencyReport('package.json', 'report.html', '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')
    } catch (e) {
        console.error(e)
    }
    console.log('build app')
}

initApp()
