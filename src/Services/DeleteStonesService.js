// Возвращает true, если у камень свободен
// False - в противном случае
export function checkForLiberty(matrix, x, y, visitedArr) {
  let size = matrix.length;
  let color = matrix[x][y];

  // Помечаем, что поприсутствовали в текущей точке
  visitedArr.push({
    x,
    y,
  });

  for (let i = x - 1; i <= x + 1; i++) {
    for (let j = y - 1; j <= y + 1; j++) {
      // Не итерируемся по диагоналям
      if (Math.abs(x - i) - Math.abs(y - j) === 0) continue;

      // Выход за границы
      if (i >= size || j >= size || i < 0 || j < 0) continue;

      // Проверяем, были ли мы уже на этом месте
      if (
        visitedArr.some((point) => {
          return point.x === i && point.y === j;
        })
      )
        continue;

      if (matrix[i][j] === color) {
        if (checkForLiberty(matrix, i, j, visitedArr)) {
          return true;
        }
      } else if (matrix[i][j] === 0) {
        return true;
      }
    }
  }

  return false;
};


export function deleteStonesWhithoutBreath(x, y, stonesCurrent) {
    // Опираюсь на то, что приходит точно квадратная матрица
    let size = stonesCurrent.length;
    let color = stonesCurrent[x][y]; // -1 - черный, 0 - пусто, 1 - белый

    // Сначала идет проверка, что смежные камни противоположного цвета не захвачены
    for (let i = x - 1; i <= x + 1; i++) {
      for (let j = y - 1; j <= y + 1; j++) {
        let visitedArr = [];

        // Не итерируемся по диагоналям
        if (Math.abs(x - i) - Math.abs(y - j) === 0) continue;

        // Выход за границы
        if (i >= size || j >= size || i < 0 || j < 0) continue;

        if (
          stonesCurrent[i][j] === -color &&
          !checkForLiberty(stonesCurrent, i, j, visitedArr)
        ) {
          visitedArr.forEach((point) => {
            stonesCurrent[point.x][point.y] = 0;
          });
        }
      }
    }

    // Затем идет проверка случая, когда ход приводит к удалению нового же камня и его группы
    // По-хорошему, запрещенный ход
    let visitedArr = [];

    if (!checkForLiberty(stonesCurrent, x, y, visitedArr)) {
      visitedArr.forEach((point) => {
        stonesCurrent[point.x][point.y] = 0;
      });
    }
  }