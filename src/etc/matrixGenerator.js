const prompt = require('prompt-sync')({sigint: true});
const fs = require('fs')

let matrixRows = prompt('Введите кол-во строк: ');
let matrixColumns = prompt('Введите кол-во столбцов: ');

let minNumber = prompt('Введите минимальное число: ');
let maxNumber = prompt('Введите максимальное число: ');

console.log(`Генерация матрицы ${matrixRows} x ${matrixColumns}...`)

let json = {
    "matrix": []
}

for (let i = 0; i < matrixRows; i++) {

    json.matrix.push([])

    for (let j = 0; j < matrixColumns; j++) {
        json.matrix[i].push(Math.floor(Math.random() * (parseInt(maxNumber) - parseInt(minNumber)) + parseInt(minNumber)))
    }
}

fs.writeFileSync(`matrix${matrixRows}x${matrixColumns}.json`, JSON.stringify(json));

console.log(`Файл создан.`)