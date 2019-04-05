import React from "react";
import { Link } from "react-router-dom";
import LongText from "./LongText";

export default function Rec(props) {
  const { cloudImage, igdb, name, summary } = props.game;
  const { excludeRec } = props;
  const { slug } = igdb;
  const url = `/games/${slug}`;
  return (
    <section className="nes-container is-dark flex game-recommendation">
      {/* <i
        className="nes-icon close is-small rec-delete"
        onClick={e => excludeRec(e)}
      /> */}
      <div
        role="button"
        tabIndex={0}
        onKeyPress={e => excludeRec(e, igdb.id)}
        onClick={e => excludeRec(e, igdb.id)}
        className="rec-delete"
      >
        X
      </div>
      <div className="mx-4">
        <img className="img-responsive rec-img" src={cloudImage} alt={slug} />
      </div>
      <div className="profile flex flex-col">
        <Link to={url}>
          <h3>{name}</h3>
        </Link>
        <LongText content={summary} limit={250} />
        <div className="mt-4">
          <i className="nes-icon like p-4" />
          <i className="nes-icon youtube p-4" />
        </div>
      </div>
    </section>
  );
}
