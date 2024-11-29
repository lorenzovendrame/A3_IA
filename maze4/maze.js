const size = 10; // Tamanho do tabuleiro
const obstaclesCount = 25; // Número de obstáculos
const recover5Count = 5; // Locais que recuperam 5 pontos
const recover10Count = 3; // Locais que recuperam 10 pontos
let board = Array.from({ length: size }, () => Array(size).fill(0)); // Inicializa o tabuleiro
let score = 50; // Pontuação inicial

// Função para verificar se a posição é válida
function isValid(x, y) {
    return x >= 0 && x < size && y >= 0 && y < size;
}

// Função para embaralhar um array (Fisher-Yates shuffle)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Função para gerar um caminho do início ao fim usando DFS
function generatePath() {
    let path = [];
    let visited = Array.from({ length: size }, () => Array(size).fill(false));

    function dfs(x, y) {
        if (x === size - 1 && y === size - 1) { // Se chegamos ao destino
            path.push([x, y]);
            return true;
        }

        visited[x][y] = true;
        path.push([x, y]);

        const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // Direções possíveis
        shuffle(directions); // Embaralha as direções

        for (let [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;

            if (isValid(newX, newY) && !visited[newX][newY]) {
                if (dfs(newX, newY)) return true; // Se encontramos um caminho
            }
        }

        path.pop(); // Remove se não for um caminho válido
        return false;
    }

    dfs(0, 0); // Inicia a busca a partir da posição (0, 0)
    
    // Marca o caminho no tabuleiro
    path.forEach(([x, y]) => board[x][y] = 0);
    
    return path; // Retorna o caminho encontrado
}

// Função para colocar obstáculos no tabuleiro
function placeObstacles(path) {
    let obstaclesPlaced = 0;

    while (obstaclesPlaced < obstaclesCount) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);

        // Verifica se a célula é livre e não faz parte do caminho
        if (board[x][y] === 0 && !path.some(pos => pos[0] === x && pos[1] === y)) {
            board[x][y] = 1; // Define como obstáculo
            obstaclesPlaced++;
        }
    }
}

// Função para colocar locais de recuperação no tabuleiro
function placeRecoveryPoints() {
    let pointsPlaced = { recover5: 0, recover10: 0 };

    while (pointsPlaced.recover5 < recover5Count) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);

        if (board[x][y] === 0) { // Célula livre
            board[x][y] = 'recover-5'; // Define como local que recupera 5 pontos
            pointsPlaced.recover5++;
        }
    }

    while (pointsPlaced.recover10 < recover10Count) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);

        if (board[x][y] === 0) { // Célula livre
            board[x][y] = 'recover-10'; // Define como local que recupera 10 pontos
            pointsPlaced.recover10++;
        }
    }
}

// Função heurística (distância de Manhattan)
function heuristic(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

// Implementação do algoritmo A*
function aStar(start, goal) {
    let openSet = [start];
    let cameFrom = {};

    let gScore = Array.from({ length: size }, () => Array(size).fill(Infinity));
    gScore[start[0]][start[1]] = 0;

    let fScore = Array.from({ length: size }, () => Array(size).fill(Infinity));
    fScore[start[0]][start[1]] = heuristic(start, goal);

    while (openSet.length > 0) {
        // Encontrar o nó com menor fScore
        let currentIndex = openSet.reduce((lowestIndex, node, index) => 
            fScore[node[0]][node[1]] < fScore[openSet[lowestIndex][0]][openSet[lowestIndex][1]] ? index : lowestIndex,
            0);
        
        let current = openSet[currentIndex];

        // Se chegamos ao objetivo
        if (current[0] === goal[0] && current[1] === goal[1]) {
            return reconstructPath(cameFrom, current);
        }

        // Remover current de openSet
        openSet.splice(currentIndex, 1);

        const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        
        for (let [dx, dy] of directions) {
            const neighbor = [current[0] + dx, current[1] + dy];

            if (!isValid(neighbor[0], neighbor[1]) || board[neighbor[0]][neighbor[1]] === 1) {
                continue; // Ignora obstáculos e posições inválidas
            }

            let tentative_gScore = gScore[current[0]][current[1]] + 1;

            if (tentative_gScore < gScore[neighbor[0]][neighbor[1]]) {
                cameFrom[neighbor] = current;
                gScore[neighbor[0]][neighbor[1]] = tentative_gScore;
                fScore[neighbor[0]][neighbor[1]] = tentative_gScore + heuristic(neighbor, goal);

                if (!openSet.some(node => node[0] === neighbor[0] && node[1] === neighbor[1])) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    return []; // Retorna um array vazio se não houver caminho
}

// Reconstruir o caminho encontrado pelo A*
function reconstructPath(cameFrom, current) {
    let totalPath = [current];
    
    while (current in cameFrom) {
        current = cameFrom[current];
        totalPath.push(current);
    }
    
    return totalPath.reverse(); // Retorna o caminho na ordem correta
}

// Gera o caminho e coloca os obstáculos e locais de recuperação no tabuleiro
const path = generatePath();
placeObstacles(path);
placeRecoveryPoints();

// Executa o algoritmo A* para encontrar o caminho do início ao fim
const startNode = [0, 0]; // Início (célula superior esquerda)
const endNode = [size - 1, size - 1]; // Fim (célula inferior direita)
const foundPath = aStar(startNode, endNode);

// Marca o caminho encontrado no tabuleiro e calcula a pontuação do robô
let robotPosition = startNode.slice(); // Posição inicial do robô

foundPath.forEach(([x, y]) => {
   if (!(x === startNode[0] && y === startNode[1]) && !(x === endNode[0] && y === endNode[1])) { 
       board[x][y] = 'path'; // Marca como parte do caminho encontrado

       // Atualiza a pontuação com base nos locais de recuperação
       if (board[x][y] === 'recover-5') score += 5;
       if (board[x][y] === 'recover-10') score += 10;

       score--; // Perde um ponto por cada espaço percorrido
   }
});

// Atualiza a renderização do tabuleiro para mostrar o caminho encontrado e a pontuação atualizada
renderBoard();

// Função para renderizar o tabuleiro no HTML e atualizar a pontuação exibida
function renderBoard() {
    const boardElement = document.getElementById('board');
    
   // Limpa o conteúdo do tabuleiro antes de renderizar
   boardElement.innerHTML = '';

   board.forEach(row => {
       row.forEach(cell => {
           const cellElement = document.createElement('div');
           cellElement.className = `cell cell-${cell}`;
           boardElement.appendChild(cellElement);
       });
   });

   document.getElementById('score').innerText = score; // Atualiza a pontuação exibida no HTML
}
