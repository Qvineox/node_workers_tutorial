const {parentPort, workerData} = require("worker_threads");
const {id, requiredTime} = workerData

function visitorLogger(visitorId, isSuccess, line) {
    let scope = `VISITOR #${visitorId}\t |`

    if (isSuccess) {
        console.log('\x1b[32m%s\x1b[0m', `${scope} ${line}`)
    } else {
        console.log('\x1b[31m%s\x1b[0m', `${scope} ${line}`)
    }
}

parentPort.on("message", data => {
    switch (data.action) {
        case 'invite':
            visitorLogger(id, true, `Проходит на стрижку (требуется ${requiredTime} минут)`)

            setTimeout(() => {
                visitorLogger(id, true, `Стрижка окончена`)

                process.exit()
            }, requiredTime * 100)
    }
});