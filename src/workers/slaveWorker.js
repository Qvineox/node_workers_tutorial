const {parentPort, workerData} = require("worker_threads");
const {id} = workerData

function logLine(line) {
    console.log(`slave-worker-${id}\t| \x1b[36m${line} \x1b[0m`)
}

// logLine(`Зависимый поток #${id} запущен.`)

parentPort.on("message", data => {
    switch (data.action) {
        case 'NEW_TASK':
            // logLine('Получено новое задание.')

            let row = data.payload

            const sum = row.reduce((partialSum, a) => partialSum + a, 0);
            parentPort.postMessage({action: 'RESULT', payload: sum})

    }
});