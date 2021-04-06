import React, { Component } from "react";
import * as parsePlayers from "../Services/parsePlayers.js";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import Board from "./Board.jsx";

export class LeaderBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      leaders: [],
    };
  }

  componentDidMount() {
    parsePlayers
      .ParsePlayersData()
      .then((res) => {
        this.setState({ leaders: res, isLoaded: true });
      })
      .catch((err) => console.log("error main", err));
  }

  render() {
    return (
      <div className="container">
        <h1>TOP-100</h1>
        <table class="table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">User</th>
              <th scope="col">Game 1</th>
              <th scope="col">Game 2</th>
            </tr>
          </thead>
          <tbody>
            {this.state.leaders.map((d, i) => (
              <tr key={i+1}>
                <th scope="row">{i+1}</th>
                <td>
                  <Link to={`/board/${i}`}>{d.name}</Link>
                </td>
                <td>{d.game1}</td>
                <td>{d.game2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
