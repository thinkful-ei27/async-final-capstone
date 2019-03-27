/* eslint-disable react/prefer-stateless-function */
import React from "react";
import { connect } from "react-redux";
import Card from "./card";
import { SignupPrompt } from './signupPrompt'
import "./styles/card.css";
import { fetchGames } from "../actions/gameActions";

export class LandingPage extends React.Component {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(fetchGames());
  }

  render() {
    const { games, count, loggedIn } = this.props;
    let content;
    if (count >= 5 && !loggedIn) {
      content = (
        <SignupPrompt />
      );
    }
    else if (games.length) {
      content = (
        <div className="battle-container">
          <Card
            src={games[0].coverUrl}
            alt={games[0].name}
            name={games[0].name}
          />
          <span className="vs">VS</span>
          <Card
            src={games[1].coverUrl}
            alt={games[1].name}
            name={games[1].name}
          />
        </div>
      );
    } else {
      content = <div>loading...</div>;
    }

    return content;
  }
}

const mapStateToProps = state => ({
  loggedIn: state.auth.currentUser !== null,
  games: state.games.battleGames,
  count: state.games.sessionVoteCount
});

export default connect(mapStateToProps)(LandingPage);
