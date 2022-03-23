// Нахождение суммы элементов по строкам (столбцам) матрицы
const {Worker, parentPort} = require("worker_threads");

let matrixData = require('../resources/matrix500x100.json').matrix;
let result = 0

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
    constructor() {
        this.logger = new Logger('timer\t', 'magenta')
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
    }
}

const timer = new Timer()


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
                mainLogger.logLine(`Получен результат: ${payload}`)
                result += payload

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
    timer.start()

    let rows = matrixData.length

    mainLogger.logLine(`Матрица ${matrixData.length} рядов на ${matrixData[0].length} колонн загружена.`)

    let slaves = []
    for (let id = 0; id < 4; id++) {
        slaves.push(new SlaveWorker(id))
    }

    mainLogger.logLine(`Запуск процесса.`)
    let roundRobinQueue = setInterval(() => {
        slaves.forEach(slave => {
            if (!slave.busy) {
                if (matrixData.length > 0) {
                    slave.task(matrixData.shift())
                }
            }
        })

        if ((rows - matrixData.length) % 10 === 0) {
            mainLogger.logLine(`Выполнение задания: ${(rows / matrixData.length).toFixed(2)}%. Осталось рядов: ${matrixData.length}`)
        }

        if (matrixData.length === 0 && slaves.every(slave => slave.busy === false)) {
            mainLogger.logLine(`Задание выполнено. Результат: ${result}`)

            slaves.forEach(slave => slave.kill())
            clearInterval(roundRobinQueue)
            timer.stop()
        }
    }, 1000)
}

matrixSumParallel()
