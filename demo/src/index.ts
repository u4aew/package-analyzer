import getDependencyReport from 'package-json-analyzer';

const initApp = async () => {
    try {
        await getDependencyReport('package.json', 'report.html', 'token')
    } catch (e) {
        console.error(e)
    }
    console.log('build app')
}

initApp()
