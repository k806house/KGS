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

//x - цифры на доске от 0 до 19, y - буквы, закодированные от 0 до 19
function getCellCrossingX(x) {
  return offset + x * linesGapSize;
}

function getCellCrossingY(y) {
  return res - offset - y * linesGapSize;
}

export class Board extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentMove: 1,
      numOfMoves: 10,
    };
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

    var example = sgfTest;

    var collection = sgf.parse(example);
    console.log(collection);
    var gamer = smartgamer(sgf.parse(example));

    // Go to a specific move
    gamer.goTo(4);

    // Navigate between moves
    gamer.next();
    gamer.previous();
    console.log(gamer.node());
  }

  toNextMove() {
    this.setState({ currentMove: this.state.currentMove + 1 });
  }

  toPreviousMove() {
    this.setState({ currentMove: this.state.currentMove - 1 });
  }

  render() {
    return (
      <div class="board">
        <h1>
          {" "}
          Ход {this.state.currentMove}/{this.state.numOfMoves}
        </h1>
        <svg width="620px" height="620px" id="snap"></svg>
        <br></br>
        <div class="btn-group" role="group">
          <button
            type="button"
            class="btn btn-primary"
            disabled={this.state.currentMove === 1}
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
