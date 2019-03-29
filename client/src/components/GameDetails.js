import React from "react";

export default function GameDetails(props) {
  const { game, feedback, error } = props;
  const { name, coverUrl, slug, platforms, genres, summary } = game;
  let percentage = !feedback ? "No ratings yet" : feedback.percentage;
  percentage *= 100;
  const genreDisplay = genres.map(gen => <span>{gen.name}, </span>);
  const platformDisplay = platforms.map(plat => <span>{plat.name}, </span>);
  return (
    <section className="flex flex-row">
      <div className="w-1/3 m-4">
        <img
          className="game-info-img p-4 rounded shadow"
          src={coverUrl}
          alt={slug}
        />
        <h3 className="mt-4">
          Rating: {error ? "No ratings yet" : parseInt(percentage)}
        </h3>
        <progress
          className="nes-progress is-success"
          value={percentage}
          max="100"
        />
      </div>
      <div className="flex flex-col p-4 w-2/3">
        <h2>{name}</h2>

        <h3 className="mt-4">
          <i className="nes-icon star" />
          Genres
        </h3>
        <p className="">{genreDisplay}</p>
        <h3 className="mt-4">
          <i className="nes-icon star" />
          Platforms
        </h3>
        <p className="">{platformDisplay}</p>
        <p className="mt-4">{summary}</p>
      </div>
    </section>
  );
}