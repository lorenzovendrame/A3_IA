const boardSize = 10;
let score = 50;
let board = [];
let path = [];

// Criação do tabuleiro
function createBoard() {
    const boardDiv = document.getElementById('board');
    
    for (let i = 0; i < boardSize; i++) {
        board[i] = [];
        for (let j = 0; j < boardSize; j++) {
            board[i][j] = { type: 'empty', visited: false };
            const cellDiv = document.createElement('div');
            cellDiv.className = 'cell';
            cellDiv.dataset.row = i;
            cellDiv.dataset.col = j;
            boardDiv.appendChild(cellDiv);
        }
    }
}

// Adicionando obstáculos
function addObstacles() {
    let obstaclesToPlace = Math.floor(boardSize * boardSize * 0.2); // 20% do tabuleiro
    while (obstaclesToPlace > 0) {
        const row = Math.floor(Math.random() * boardSize);
        const col = Math.floor(Math.random() * boardSize);
        if (row === 0 && col === 0 || row === boardSize - 1 && col === boardSize - 1) continue; // Não colocar obstáculos na entrada ou saída
        if (board[row][col].type === 'empty') {
            board[row][col].type = 'obstacle';
            obstaclesToPlace--;
        }
    }
}

// Adicionando pontos extras
function addExtraPoints() {
    let points5ToPlace = 5;
    let points10ToPlace = 3;

    while (points5ToPlace > 0) {
        const row = Math.floor(Math.random() * boardSize);
        const col = Math.floor(Math.random() * boardSize);
        if (board[row][col].type === 'empty') {
            board[row][col].type = 'point5';
            points5ToPlace--;
        }
    }

    while (points10ToPlace > 0) {
        const row = Math.floor(Math.random() * boardSize);
        const col = Math.floor(Math.random() * boardSize);
        if (board[row][col].type === 'empty') {
            board[row][col].type = 'point10';
            points10ToPlace--;
        }
    }
}

// Função heurística para estimar o custo até o objetivo
function heuristic(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col); // Distância de Manhattan
}

// Algoritmo A*
function aStar(start, goal) {
    let openSet = [start];
    let cameFrom = {};
    
    let gScore = Array.from({ length: boardSize }, () => Array(boardSize).fill(Infinity));
    gScore[start.row][start.col] = 0;

    let fScore = Array.from({ length: boardSize }, () => Array(boardSize).fill(Infinity));
    fScore[start.row][start.col] = heuristic(start, goal);

    while (openSet.length > 0) {
        openSet.sort((a, b) => fScore[a.row][a.col] - fScore[b.row][b.col]);
        let current = openSet.shift();

        if (current.row === goal.row && current.col === goal.col) {
            reconstructPath(cameFrom, current);
            return true;
        }

        const neighbors = [
            { row: current.row + 1, col: current.col }, // baixo
            { row: current.row - 1, col: current.col }, // cima
            { row: current.row, col: current.col + 1 }, // direita
            { row: current.row, col: current.col - 1 }  // esquerda
        ];

        for (const neighbor of neighbors) {
            if (
                neighbor.row >= 0 && neighbor.row < boardSize &&
                neighbor.col >= 0 && neighbor.col < boardSize &&
                board[neighbor.row][neighbor.col].type !== 'obstacle'
            ) {
                const tentativeGScore = gScore[current.row][current.col] + 1;

                if (tentativeGScore < gScore[neighbor.row][neighbor.col]) {
                    cameFrom[`${neighbor.row},${neighbor.col}`] = current;
                    gScore[neighbor.row][neighbor.col] = tentativeGScore;
                    fScore[neighbor.row][neighbor.col] = tentativeGScore + heuristic(neighbor, goal);

                    if (!openSet.some(n => n.row === neighbor.row && n.col === neighbor.col)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
    }

    return false; // Caminho não encontrado
}

// Reconstruir o caminho a partir dos nós visitados
function reconstructPath(cameFrom, current) {
    while (current) {
        path.push(current);
        current = cameFrom[`${current.row},${current.col}`];
    }
    path.reverse(); // O caminho deve ser do início ao fim
}

// Atualizar a visualização do tabuleiro
function updateBoard() {
    const cells = document.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        const row = cell.dataset.row;
        const col = cell.dataset.col;

        switch (board[row][col].type) {
            case 'obstacle':
                cell.classList.add('obstacle');
                break;
            case 'point5':
                cell.classList.add('point5');
                break;
            case 'point10':
                cell.classList.add('point10');
                break;
            default:
                break;
        }

        // Marcar o caminho percorrido pelo robô
        if (path.some(p => p.row == row && p.col == col)) {
            cell.classList.add('path');
            
            // Atualizar a pontuação conforme o tipo de célula
            if (board[row][col].type === 'point5') {
                score += 5;
            } else if (board[row][col].type === 'point10') {
                score += 10;
            } else {
                score -= 1; // Custo de movimento padrão é -1 ponto
            }
        }
    });

    document.getElementById('score').innerText = `Pontuação: ${score}`;
}

// Função principal para iniciar o jogo
function startGame() {
    createBoard();
    addObstacles();
    addExtraPoints();
    
    const startNode = { row: 0, col: 0 };
    const goalNode = { row: boardSize - 1, col: boardSize - 1 };

    if (!aStar(startNode, goalNode)) {
        console.error("Caminho não encontrado!");
        return;
    }

    updateBoard();
}

document.addEventListener("DOMContentLoaded", function() {
    const reiniciarButton = document.getElementById("reiniciar");
    reiniciarButton.addEventListener("click", reiniciar);
});
    
function reiniciar() {
    document.getElementById('board').remove(); //Deletar tabuleiro atual
    var boardDiv = document.createElement('div');
    boardDiv.id = 'board'; // Set the ID of the new div
    document.getElementById('reiniciar').after(boardDiv); //Criar div para colocar novo tabuleiro

    score = 50;
    board = [];
    path = [];

    startGame();
}

startGame();
