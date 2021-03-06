import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import Menu from "./Menu";
import BurgerMenu from "./burger-menu";
import "../styles/header.css";
import "../styles/gameInfo.css";

export class HeaderBar extends React.Component {
  state = {
    menuItems: [
      { name: "Vote", link: "/", key: "vote" },
      { name: "Games", link: "/games", key: "games" },
      { name: "Profile", link: "/profile", key: "profile" },
      {
        name: "Recommendations",
        link: "/profile/recommendations",
        key: "recommendations"
      },
      { name: "Sign Up", link: "/register", key: "signup" },
      { name: "Login", link: "/login", key: "login" },
      { name: "Sign Out", link: "/login", key: "signout" }
    ]
  };

  handleLinks() {
    const { menuItems } = this.state;
    const { loggedIn } = this.props;
    if (loggedIn) {
      const hidden = ["Sign Up", "Login"];
      return menuItems.filter(item => !hidden.includes(item.name));
    }
    const hidden = ["Sign Out", "Profile", "Recommendations"];
    return menuItems.filter(item => !hidden.includes(item.name));
  }

  render() {
    const { screenWidth } = this.props;
    const title = screenWidth > 768 ? "War of the Games" : "WotG";
    // Only render the log out button if we are logged in
    const menu =
      screenWidth > 768 ? (
        <Menu menuItems={this.handleLinks()} />
      ) : (
        <BurgerMenu menuItems={this.handleLinks()} />
      );

    return (
      <header className="shadow">
        <div className="flex flex-row justify-between">
          <Link to="/">
            <h2 className="p-4">
              <i className="nes-logo" />
              {title}
            </h2>
          </Link>
          <section className="p-4">{menu}</section>
        </div>
      </header>
    );
  }
}

const mapStateToProps = state => ({
  loggedIn: state.auth.currentUser !== null,
  screenWidth: state.window.width
});

export default connect(mapStateToProps)(HeaderBar);
