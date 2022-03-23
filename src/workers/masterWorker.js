const {parentPort, workerData, Worker} = require("worker_threads");
const {workersAmount, matrix} = workerData

function logLine(line) {
    console.log(`main-worker\t| \x1b[32m${line} \x1b[0m`)
}

logLine('Основной поток запущен.')
logLine(`Запуск зависимых потоков (${workersAmount})...`)

let result = 0

class SlaveWorker {
    constructor(id) {
        this.id = id

        // отслеживание состояния
        this.busy = false

        this.worker = new Worker("./src/workers/slaveWorker.js", {
            type: "module",
            workerData:
                {
                    id: this.id
                }
        })

        this.worker.on('message', ({action, payload}) => {
            if (action === 'result') {
                logLine(`Получен результат из потока #${this.id}.`)

                parentPort.postMessage({action: 'result', source: this.id, payload: payload})

                this.busy = false
            } else if (action === 'error') {
                throw new Error(payload)
            }
        })

        this.worker.on('exit', () => {
            logLine(`Выход из потока #${this.id}.`)
        })
    }

    upload(payload) {
        if (!this.busy) {
            this.busy = true
            this.worker.postMessage({action: 'new_task', payload: payload})
        }
    }
}

let workers = []

for (let i = 0; i < workersAmount; i++) {
    workers.push(new SlaveWorker(i))
}

parentPort.on("message", ({action, workerId, payload}) => {
    switch (action) {
        case 'new_task':
            logLine('Получены данные из основной программы.')

            workers[workerId].upload(payload)
    }
});