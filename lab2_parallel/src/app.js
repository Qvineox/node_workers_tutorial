const {Worker} = require("worker_threads");

// логгеры
function lobbyLogger(line) {
    let scope = 'LOBBY\t\t |'

    console.log('\x1b[33m%s\x1b[0m', `${scope} ${line}`)
}

function barberLogger(line) {
    let scope = 'BARBER\t\t |'

    console.log('\x1b[35m%s\x1b[0m', `${scope} ${line}`)
}

function visitorLogger(visitorId, isSuccess, line) {
    let scope = `VISITOR #${visitorId}\t |`

    if (isSuccess) {
        console.log('\x1b[32m%s\x1b[0m', `${scope} ${line}`)
    } else {
        console.log('\x1b[31m%s\x1b[0m', `${scope} ${line}`)
    }
}

// парикмахер
class Barber {
    constructor(checkInterval) {
        this.checkInterval = checkInterval
        this.busy = false
    }

    checkForVisitors() {
        setInterval(() => {
            if (!this.busy) {
                barberLogger('Проверка на наличие ожидающих гостей')

                if (Visitor.queue.length > 0) {
                    this.inviteVisitor(Visitor.queue[0])
                }
            }
        }, this.checkInterval)
    }

    inviteVisitor(visitor) {
        visitor.worker.postMessage({action: 'invite'})
        this.busy = true

        barberLogger(`Приглашен посетитель #${visitor.id}`)
        visitor.leaveQueue()

        visitor.worker.on('exit', () => {
            this.busy = false
        })
    }
}

// посетитель
class Visitor {
    scope = 'LOBBY\t\t'

    static queue = []
    queueMaxLength = 3

    constructor(id, hairCondition, hairLength) {
        const hairConditions = [
            0.75,   //perfect
            1,      //good
            1.25,   //mediocre
            1.5,    //poor
            2       //extreme
        ]

        this.id = id
        this.requiredTime = 10 + hairConditions[hairCondition] * hairLength

        lobbyLogger(`Посетитель #${id} зашел в здание`)

        this.worker = new Worker("./worker.js", {
            workerData:
                {
                    id: this.id,
                    requiredTime: this.requiredTime
                }
        });

        this.checkQueue()

        this.worker.on('exit', exitCode => {
            this.leave(true)
        })
    }

    checkQueue() {
        if (Visitor.queue.length < this.queueMaxLength) {
            visitorLogger(this.id, true, `Проверяет количество людей в очереди (Всего: ${Visitor.queue.length})`)
            this.enterQueue()
        } else {
            visitorLogger(this.id, false, `Проверяет количество людей в очереди (Всего: ${Visitor.queue.length})`)
            this.leave(false)
        }

        lobbyLogger(`Гости: [${Visitor.queue}] (Всего: ${Visitor.queue.length})`)
    }

    enterQueue() {
        visitorLogger(this.id, true, `Садится в очередь`)

        Visitor.queue.push(this)
    }

    leaveQueue() {
        visitorLogger(this.id, true, `Покидает очередь`)

        Visitor.queue.shift()
    }

    leave(isHappy) {
        if (isHappy) {
            visitorLogger(this.id, true, `Покидает здание довольным`)
        } else {
            visitorLogger(this.id, false, `Покидает здание недовольным`)
        }
    }

    toString() {
        return `{#${this.id}}`
    }
}

function generateVisitors() {
    let current = 1

    let hairCondition = Math.floor(Math.random() * 5)
    let hairLength = Math.floor(Math.random() * 201)

    new Visitor(current++, hairCondition, hairLength)

    setInterval(() => {
        let hairCondition = Math.floor(Math.random() * 5)
        let hairLength = Math.floor(Math.random() * 201)

        new Visitor(current++, hairCondition, hairLength)
    }, Math.floor(Math.random() * (10000 - 4000) + 4000))
}


generateVisitors()

const barber = new Barber(1000)
barber.checkForVisitors()


