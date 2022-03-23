// Нахождение суммы элементов по строкам (столбцам) матрицы
const {Worker, parentPort} = require("worker_threads");

let matrixData = require('../resources/matrix1000x1000.json');
let results = {
    parallelResult: 0,
    normalResult: 0,

    parallelTime: null,
    normalTime: null
}

const config = {
    workers: 16,
    interval: 10,
}

class Logger {
    static colours = {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
    }


    constructor(scope, colour) {
        if (colour in Logger.colours) {
            this.colour = Logger.colours[colour]
        } else throw new Error('No such colour')

        this.scope = scope

        this.logLine('Логгер инициализирован.')
    }

    logLine(line) {
        console.log(`${this.scope}\t| ${this.colour}${line} \x1b[0m`)
    }
}

const mainLogger = new Logger('program\t', 'yellow')

class Timer {
    constructor(name) {
        this.name = name

        this.logger = new Logger(`timer-${this.name}`, 'magenta')
        this.startTime = null
        this.finishTime = null
    }

    start() {
        this.logger.logLine('Начало отсчета.')

        this.startTime = performance.now()
    }

    stop() {
        this.logger.logLine('Конец отсчета.')

        this.finishTime = performance.now()
        this.duration = this.finishTime - this.startTime

        this.logger.logLine(`Затрачено времени: ${this.duration.toFixed(2)} мс.`)
        results.parallelTime = this.duration
    }
}

class SlaveWorker {
    constructor(id) {
        this.id = id
        this.busy = false

        this.worker = new Worker("./src/workers/slaveWorker.js", {
            workerData:
                {
                    id: this.id
                }
        })

        this.worker.on('message', ({action, payload}) => {
            if (action === 'RESULT') {
                // mainLogger.logLine(`Получен результат: ${payload}`)
                results.parallelResult += payload

                this.busy = false
            } else if (action === 'error') {
                throw new Error(payload)
            }
        })


    }

    task(payload) {
        this.busy = true

        this.worker.postMessage({action: 'NEW_TASK', payload: payload})
    }

    kill() {
        if (!this.busy) {
            this.worker.terminate()
        } else throw new Error('Поток еще выполняет задание.')

    }
}

function matrixSumParallel() {
    const timer = new Timer('async')
    timer.start()

    mainLogger.logLine(`Запуск зависимых процессов.`)
    let slaves = []
    for (let id = 0; id < config.workers; id++) {
        slaves.push(new SlaveWorker(id))
    }

    mainLogger.logLine(`Запуск процесса.`)
    let data = matrixData.matrix

    let roundRobinQueue = setInterval(() => {
        slaves.forEach(slave => {
            if (!slave.busy) {
                if (data.length > 0) {
                    slave.task(data.shift())
                }
            }
        })


        if (data.length === 0 && slaves.every(slave => slave.busy === false)) {
            mainLogger.logLine(`Асинхронное задание выполнено.`)

            slaves.forEach(slave => slave.kill())
            clearInterval(roundRobinQueue)
            timer.stop()
        }
        // } else if ((rows - data.length) % 10 === 0) {
        //     mainLogger.logLine(`Выполнение задания: ${(rows / data.length).toFixed(2)}%. Осталось рядов: ${data.length}`)
        // }
    }, config.interval)
}

function matrixSumNormal() {
    const timer = new Timer('sync')
    timer.start()

    let data = matrixData.matrix
    mainLogger.logLine(`Матрица ${data.length} рядов на ${data[0].length} колонн загружена.`)

    mainLogger.logLine(`Запуск процесса.`)

    while (data.length > 0) {
        results.normalResult += data.shift().reduce((partialSum, a) => partialSum + a, 0);
    }

    mainLogger.logLine(`Синхронное задание выполнено.`)
    timer.stop()
}

matrixSumParallel()
// matrixSumNormal()