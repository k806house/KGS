import "./App.css";
import { LeaderBoard } from "./Components/LeaderBoard";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import Board from "./Components/Board";

function App() {
  return (
    <Router>
      <div>
        <div className="App">
        <Switch>
          <Route path="/board/:gameId" component={Board}/>
          <Route path="/">
            <LeaderBoard />
          </Route>
        </Switch>
        </div>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
      </div>
    </Router>
  );
}

export default App;
