export function gridToAxial(col, row) {
    const q = col - Math.floor(row / 2);
    return { q, r: row };
}

export function axialToGrid(q, r) {
    const col = q + Math.floor(r / 2); 
    return { col, row: r };
}

export function getValidNeighbors(q, r, cols, rows) {
    const directions = [
        [+1, 0],    // Droite
        [-1, 0],    // Gauche
        [0, +1],    // Bas-Gauche
        [0, -1],    // Haut-Droit
        [+1, -1],   // Haut-Gauche
        [-1, +1]    // Bas-Droit
    ];

    const neighbors = directions
        .map(([dq, dr]) => [q + dq, r + dr])
        .filter(([nq, nr]) => {
            const { col, row } = axialToGrid(nq, nr);
            return col >= 0 && col < cols && row >= 0 && row < rows;
        });

    return neighbors;
}