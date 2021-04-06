import React, { Component } from "react";
import Snap from "snapsvg-cjs";
import "./Board.css";
import { sgfTest } from "./sgf";

const mina = window.mina;
const res = 620;
const offset = 25;
const numOfCells = 18;
const linesGapSize = (res - offset * 2) / numOfCells;

var sgf = require("smartgame");
var smartgamer = require("smartgamer");

export class Board extends Component {
  constructor(props) {
    super(props);
    var example = sgfTest;
    this.collection = sgf.parse(example);
    this.gamer = smartgamer(sgf.parse(example));

    this.stones = [];
    this.stonesCurrent = [];
    this.state = {
      currentMove: 0,
      numOfMoves: this.gamer.totalMoves(),
    };
    
    this.movesHistory = [];
    this.gameId = this.props.match.params.gameId;
  }

  componentDidMount() {
    var s = Snap("#snap");
    var rectBoard = s.rect(0, 0, res, res);
    var rectBorder = s.rect(offset, offset, res - offset * 2, res - offset * 2);

    rectBoard.attr({
      fill: "#eed1b7",
    });
    rectBorder.attr({
      fill: "none",
      stroke: "black",
      "stroke-width": 3,
    });

    var linesInit = s.g();

    for (let i = 0; i < numOfCells - 1; i++) {
      var vertLine = s.line(
        offset,
        offset + (i + 1) * linesGapSize,
        res - offset,
        offset + (i + 1) * linesGapSize
      );
      linesInit.add(vertLine);
    }

    for (let i = 0; i < numOfCells - 1; i++) {
      var vertLine = s.line(
        offset + (i + 1) * linesGapSize,
        res - offset,
        offset + (i + 1) * linesGapSize,
        offset
      );
      linesInit.add(vertLine);
    }

    linesInit.attr({
      stroke: "black",
    });

    //TODO: узнать, как расставляются точки и переписать, используя известные константы
    //только для доски 19*19
    var dots = s.g();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        var dot = s.circle(
          getCellCrossingX(3 + i * 6),
          getCellCrossingY(3 + j * 6),
          4
        );
        dots.add(dot);
      }
    }

    //Рисуем круги, чтобы потом только менять цвет
    var stonesGroup = s.g();
    for (let i = 0; i <= numOfCells; i++) {
      this.stones[i] = [];
      this.stonesCurrent[i] = [];
      for (let j = 0; j <= numOfCells; j++) {
        this.stones[i][j] = s.circle(
          getCellCrossingX(i),
          getCellCrossingY(j),
          15
        );
        stonesGroup.add(this.stones[i][j]);
        this.stonesCurrent[i][j] = 0;
      }
    }
    stonesGroup.attr({
      fill: "none",
    });
  }

  refreshBoard() {
    for (let i = 0; i <= numOfCells; i++) {
      for (let j = 0; j <= numOfCells; j++) {
        if (this.stonesCurrent[i][j] === -1) {
          this.stones[i][j].attr({
            fill: "black",
          });
        } else if (this.stonesCurrent[i][j] === 1) {
          this.stones[i][j].attr({
            fill: "white",
          });
        } else {
          this.stones[i][j].attr({
            fill: "none",
          });
        }
      }
    }
  }

  deleteStonesWhithoutBreath(x, y) {
    // Опираюсь на то, что приходит точно квадратная матрица
    let size = this.stonesCurrent.length;
    let color = this.stonesCurrent[x][y]; // -1 - черный, 0 - пусто, 1 - белый

    // Сначала идет проверка, что смежные камни противоположного цвета не захвачены
    for (let i = x - 1; i <= x + 1; i++) {
      for (let j = y - 1; j <= y + 1; j++) {
        let visitedArr = [];

        // Не итерируемся по диагоналям
        if (Math.abs(x - i) - Math.abs(y - j) === 0) continue;

        // Выход за границы
        if (i >= size || j >= size || i < 0 || j < 0) continue;

        if (
          this.stonesCurrent[i][j] === -color &&
          !checkForLiberty(this.stonesCurrent, i, j, visitedArr)
        ) {
          visitedArr.forEach((point) => {
            this.stonesCurrent[point.x][point.y] = 0;
          });
        }
      }
    }

    // Затем идет проверка случая, когда ход приводит к удалению нового же камня и его группы
    // По-хорошему, запрещенный ход
    let visitedArr = [];

    if (!checkForLiberty(this.stonesCurrent, x, y, visitedArr)) {
      visitedArr.forEach((point) => {
        this.stonesCurrent[point.x][point.y] = 0;
      });
    }
  }

  toNextMove() {
    this.setState({ currentMove: this.state.currentMove + 1 });
    this.gamer.next();
    this.movesHistory.push(copyArray(this.stonesCurrent));

    let coords = { x: 0, y: 0 };
    if (this.gamer.node().B) {
      coords = moveParse(this.gamer.node()["B"]);
      this.stonesCurrent[coords.x][coords.y] = -1;
      this.stones[coords.x][coords.y].attr({
        fill: "black",
      });
    }
    if (this.gamer.node().W) {
      coords = moveParse(this.gamer.node()["W"]);
      this.stonesCurrent[coords.x][coords.y] = 1;
      this.stones[coords.x][coords.y].attr({
        fill: "white",
      });
    }
    this.deleteStonesWhithoutBreath(coords.x, coords.y);
    this.refreshBoard();
  }

  toPreviousMove() {
    this.setState({ currentMove: this.state.currentMove - 1 });
    this.gamer.previous();
    this.stonesCurrent = this.movesHistory.pop();
    this.refreshBoard();
  }

  render() {
    return (
      <div class="board">
        <h1>
          Ход {this.state.currentMove}/{this.state.numOfMoves}
        </h1>
        {/* <h3>Requested topic ID: {this.gameId}</h3> */}
        <svg width="620px" height="620px" id="snap"></svg>
        <br></br>
        <div class="btn-group" role="group">
          <button
            type="button"
            class="btn btn-primary"
            disabled={this.state.currentMove === 0}
            onClick={this.toPreviousMove.bind(this)}
          >
            Назад
          </button>
          <button
            type="button"
            class="btn btn-primary"
            disabled={this.state.currentMove === this.state.numOfMoves}
            onClick={this.toNextMove.bind(this)}
          >
            Вперед
          </button>
        </div>
      </div>
    );
  }
}

export default Board;

// Возвращает true, если у камень свободен
// False - в противном случае
function checkForLiberty(matrix, x, y, visitedArr) {
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
}

//x - цифры на доске от 0 до 19, y - буквы, закодированные от 0 до 19
function getCellCrossingX(x) {
  return offset + x * linesGapSize;
}

function getCellCrossingY(y) {
  return res - offset - y * linesGapSize;
}

function moveParse(text) {
  var chars = text.split("");
  return {
    x: chars[0].codePointAt(0) - "a".codePointAt(0),
    y: numOfCells - chars[1].codePointAt(0) + "a".codePointAt(0),
  };
}

function copyArray(currentArray) {
  var newArray = [];
  for (var i = 0; i < currentArray.length; i++)
    newArray[i] = currentArray[i].slice();
  return newArray;
}
