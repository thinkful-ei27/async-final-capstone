/* eslint-disable no-nested-ternary */
import React from "react";
import ReactTooltip from "react-tooltip";
import { connect } from "react-redux";
import moment from "moment";
import { Link } from "react-router-dom";
import requiresLogin from "../requires-login";
import "../styles/profile.css";
import {
  getUserHistory,
  getUserTopHistory,
  // getUserAboutMe,
  getUserMotivationData,
  fetchUser,
  getUserSubmotivations,
  loadWishList
} from "../../actions/users";
import Loading from "../loading";
import ConnectedGame from "../gamePage/Game";
import ConnectedRecommendations from "../recommendations/Recommendations";
import ConnectedAvatarCard from "./AvatarCard";
import WishList from "../recommendations/WishList";

// profile pic imports
import Demon from "../../assets/demon.png";
import Knight from "../../assets/knight.png";
import BigZombie from "../../assets/bigZombie.png";
import FemaleElf from "../../assets/femaleElf.png";
import FemaleWizard from "../../assets/femaleWizard.png";
import MaleElf from "../../assets/maleElf.png";
import MaleWizard from "../../assets/maleWizard.png";
import Ogre from "../../assets/ogre.png";
import Shaman from "../../assets/shaman.png";
import Radar from "./RadarChart";

export class ProfilePage extends React.Component {
  componentDidMount() {
    const { userId, dispatch } = this.props;
    return Promise.all([
      dispatch(getUserTopHistory(userId)),
      // dispatch(getUserAboutMe()),
      dispatch(getUserMotivationData()),
      dispatch(fetchUser(userId)),
      dispatch(getUserSubmotivations()),
      dispatch(getUserHistory(userId)),
      dispatch(loadWishList(userId))
    ]);
  }

  evaluateProfilePic() {
    const { profilePic } = this.props;
    switch (profilePic) {
      case "Demon":
        return Demon;
      case "Knight":
        return Knight;
      case "BigZombie":
        return BigZombie;
      case "FemaleElf":
        return FemaleElf;
      case "FemaleWizard":
        return FemaleWizard;
      case "MaleElf":
        return MaleElf;
      case "MaleWizard":
        return MaleWizard;
      case "Ogre":
        return Ogre;
      case "Shaman":
        return Shaman;
      default:
        return Knight;
    }
  }

  render() {
    const {
      username,
      initialPic,
      userHistory,
      loading,
      topHistory,
      screenWidth,
      firstName,
      subMotivations,
      motivations,
      wishList
    } = this.props;

    const isMobile = screenWidth <= 768;
    const topSix = topHistory.map(history => {
      const { name, cloudImage, igdb, count, id } = history;
      return (
        <div key={id} className="mt-4 text-center">
          <ReactTooltip id={id} multiline className="hover">
            {count > 1 ? (
              <span>{`selected ${count} times`}</span>
            ) : (
              <span>{`selected ${count} time`}</span>
            )}
          </ReactTooltip>
          <ConnectedGame
            className="top-6"
            dataFor={id}
            dataTip
            slug={igdb.slug}
            name={name}
            dataOff="mouseleave"
            cloudImage={cloudImage}
            key={id}
            screenWidth={screenWidth}
            profileWidth="w-1"
            profileFontSize="text-xs"
          />
        </div>
      );
    });

    const recentHistory = userHistory.map(histInstance => {
      const { choice, id, createdAt } = histInstance;

      const timeFromVote = moment(createdAt).fromNow();

      return (
        <div key={id} className="flex justify-start content-start flex-wrap">
          <ReactTooltip id={id} className="hover">
            <span>{`voted for ${timeFromVote}`}</span>
          </ReactTooltip>
          <ConnectedGame
            screenWidth={screenWidth}
            dataFor={id}
            dataTip
            dataOff="mouseleave"
            slug={choice.igdb.slug}
            name={choice.name}
            cloudImage={choice.cloudImage}
            profileFontSize="text-xs"
            profileWidth="w-1"
          />
        </div>
      );
    });

    let iconSize = "is-small";

    if (!isMobile) {
      iconSize = "is-medium";
    }
    return loading ? (
      <div className="loading-screen">
        <Loading />
      </div>
    ) : (
      <div className="game-container mx-auto mt-16">
        <div className="">
          <div
            className="nes-container with-title is-centered is-dark profile-details"
            id="profile-details"
          >
            <p className="title">{username}</p>
            <section className="profile-header">
              <div>
                <ConnectedAvatarCard initialPic={initialPic} />
                <Link to="/leaderboard" className="leader-board-link">
                  Leader board
                </Link>
              </div>
              <div className="text-xxs radar">
                <Radar name={firstName} data={motivations} />
              </div>
            </section>
          </div>
        </div>
        <ConnectedRecommendations
          profileWidth="w-1"
          isMobile={isMobile}
          subMotivations={subMotivations}
        />
        <WishList
          username={username}
          profileWidth="w-1"
          isMobile={isMobile}
          wishList={wishList}
        />
        <div className="flex flex-row top-recent-container">
          <section className="nes-container m-4 top-six">
            <h4>
              <i className={`nes-icon ${iconSize} heart`} />
              Your Top 6 choices!
            </h4>
            {topSix}
          </section>
          <section className="nes-container m-4 recent-choices">
            <h4>Your Most Recent Choices!</h4>
            {recentHistory}
          </section>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { currentUser } = state.auth;
  const { user } = state;
  return {
    // aboutMe: user.aboutMe,
    level: currentUser.level,
    topHistory: user.topHistory,
    xpToNextLevel: currentUser.xpToNextLevel,
    initialPic: user.userInfo.profilePic,
    userId: currentUser.id,
    username: state.auth.currentUser.username,
    fullName: `${currentUser.firstName} ${currentUser.lastName}`,
    firstName: user.userInfo.firstName,
    userHistory: user.history,
    subMotivations: user.subMotivations,
    loading: user.loading,
    screenWidth: state.window.width,
    profilePic: state.auth.currentUser.profilePic,
    motivations: user.motivations,
    wishList: user.wishList
  };
};

export default requiresLogin()(connect(mapStateToProps)(ProfilePage));
