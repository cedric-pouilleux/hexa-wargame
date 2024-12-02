export function gridToAxial(col, row) {
    const q = col - Math.floor(row / 2);
    return { q, r: row };
}

export function axialToGrid(q, r) {
    const col = q + Math.floor(r / 2); 
    return { col, row: r };
}

export function getTileCoordinates(instanceId, cols) {
  const row = Math.floor(instanceId / cols);
  const col = instanceId % cols;
  return gridToAxial(col, row);
}

export function getInstanceIdFromCoordinates(q, r, cols, rows) {
  const { col, row } = axialToGrid(q, r); 
  if (col < 0 || row < 0 || col >= cols || row >= rows) {
    return undefined;
  }
  const instanceId = row * cols + col;
  return instanceId;
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