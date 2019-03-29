import React, { Component } from "react";
import "./styles/loading.css";

export default class Loading extends Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: 0
    };
  }

  componentDidMount() {
    this.intervalId = setInterval(() => this.fillBar(), 10);
  }

  componenetWillUnmount() {
    clearInterval(this.intervalId);
  }

  fillBar() {
    const { progress } = this.state;
    if (progress >= 100) {
      this.setState({ progress: 0 });
    } else {
      this.setState({
        progress: progress + 5
      });
    }
  }

  render() {
    const { progress } = this.state;
    const { size } = this.props;
    return (
      <div className="load-sm">
        <progress
          className="nes-progress"
          id={size}
          value={progress}
          max="100"
        />
      </div>
    );
  }
}
