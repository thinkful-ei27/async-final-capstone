import React from "react";
import { connect } from "react-redux";
import dialogPolyfill from "dialog-polyfill";
import Avatar from "./Avatar";
import requiresLogin from "../requires-login";
import { updateUserProfilePic } from "../../actions/users";
import "../styles/gameInfo.css";

class AvatarCard extends React.Component {
  showModal = () => {
    const dialog = document.getElementById("dialog-default");
    dialogPolyfill.registerDialog(dialog);
    dialog.showModal();
  };

  hideModal = () => {
    const dialog = document.getElementById("dialog-default");
    dialog.close();
  };

  updateProfilePic(e) {
    e.preventDefault();
    const pic = e.currentTarget.value;
    const { userId, dispatch } = this.props;
    dispatch(updateUserProfilePic(userId, pic));
    this.hideModal();
  }

  render() {
    const { level, xpToNextLevel, initialPic, profilePic } = this.props;
    const classIconNames = [
      "nes-mario",
      "nes-ash",
      "nes-pokeball",
      "nes-bulbasaur",
      "nes-charmander",
      "nes-squirtle",
      "nes-kirby",
      "lich-king",
      "gen-sonic",
      "excitebike",
      "cloud-strife",
      "master-chief"
    ];
    const classMap = classIconNames.map(icon => (
      <li className="w-1/3 p-2 avatar-sprite" id={icon} key={`h_${icon}`}>
        <button
          className="avatar-sprite__button"
          onClick={e => this.updateProfilePic(e)}
          type="button"
          value={icon}
        >
          <i className={`${icon}`} />
        </button>
      </li>
    ));
    return (
      <section>
        <section className="full-dialog">
          <dialog className="nes-dialog" id="dialog-default">
            <form method="dialog">
              <p className="title">Profile Pic</p>
              {/* <p>Alert: this is a dialog.</p> */}
              <ul className="list-reset flex flex-row flex-wrap justify-around avatar-list">
                {classMap}
              </ul>
              <menu className="dialog-menu">
                <button
                  type="button"
                  className="nes-btn"
                  onClick={() => this.hideModal()}
                >
                  Cancel
                </button>
              </menu>
            </form>
          </dialog>
        </section>
        <div className="profile-xp-card">
          <p>
            <button
              type="button"
              className="nes-btn"
              onClick={() => this.showModal()}
            >
              +
              <Avatar profilePic={profilePic || initialPic} />
            </button>
          </p>
          <div className="">
            <p className="text-2xl">
              <span className="nes-text is-success text-2xl mx-4">LV</span>
              {level}
            </p>
            <p className="text-2xl">
              <span className="nes-text is-success text-2xl mx-4">XP</span>
              {xpToNextLevel}
            </p>
          </div>
        </div>
      </section>
    );
  }
}

const mapStateToProps = state => {
  const { currentUser } = state.auth;
  const { userInfo } = state.user;
  return {
    userId: currentUser.id,
    level: userInfo.level,
    xpToNextLevel: userInfo.xpToNextLevel,
    profilePic: userInfo.profilePic
  };
};

export default requiresLogin()(connect(mapStateToProps)(AvatarCard));
