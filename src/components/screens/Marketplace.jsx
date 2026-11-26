import { useEffect, useEffectEvent, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { priceFor, formatPrice } from "../../logic/pricing";
import "./Marketplace.css";

const AUTO_RETURN_MS = 30000; // reset for the next visitor after 30s without activity

function formatSubject(number) {
  return `Subject #${String(number).padStart(4, "0")}`;
}

function formatSeconds(ms) {
  return ms === null ? "n/a" : `${(ms / 1000).toFixed(1)}s`;
}

// Every image in a listing: the face thumbnail first, then the in-game captures.
function listingImages(participant) {
  const images = [];
  if (participant.portrait)
    images.push({ src: participant.portrait, caption: "Facial image" });
  participant.snapshots.forEach((snapshot) => {
    images.push({
      src: snapshot.src,
      caption: `Round ${snapshot.round} · ${snapshot.movement}`,
    });
  });
  return images;
}

// Plays back the current visitor's scripted auction, one bid at a time.
// Order Now ends it early: sold to whoever is leading (never to the visitor).
function useAuctionPlayback(auction) {
  const { bids } = auction;
  const [revealed, setRevealed] = useState(0); // how many bids have appeared so far
  const [ordered, setOrdered] = useState(false);
  const finished = revealed >= bids.length;

  useEffect(() => {
    if (ordered || finished) return;
    // Wait the gap between the previous bid and the next one in the script.
    const previousAt = revealed === 0 ? 0 : bids[revealed - 1].at;
    const timeoutId = setTimeout(
      () => setRevealed((value) => value + 1),
      bids[revealed].at - previousAt
    );
    return () => clearTimeout(timeoutId);
  }, [bids, revealed, ordered, finished]);

  // If they order before any bids appear, the first bidder "wins" instantly.
  const shown = bids.slice(0, ordered ? Math.max(revealed, 1) : revealed);
  const sold = finished || ordered;

  return {
    shown,
    sold,
    ordered,
    winner: sold ? shown.at(-1) : null,
    order: () => setOrdered(true),
  };
}

// A finished auction, for previous participants' listings.
function completedSale(auction) {
  return {
    shown: auction.bids,
    sold: true,
    ordered: false,
    winner: auction.bids.at(-1),
  };
}

// The image area: one image at a time with previous/next arrows.
function ListingCarousel({ images, sold }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return <div className="listing__frame listing__frame--empty">No image</div>;
  }

  const current = images[index];
  // Wraps around at both ends: after the last image comes the first.
  const go = (step) =>
    setIndex((value) => (value + step + images.length) % images.length);

  return (
    <figure className="listing__media">
      <div className="listing__frame">
        <img
          src={current.src}
          alt={current.caption}
          className="listing__image"
        />
        {sold && <span className="listing__sold">Sold</span>}
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="listing__arrow listing__arrow--prev"
              onClick={() => go(-1)}
              aria-label="Previous image"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              className="listing__arrow listing__arrow--next"
              onClick={() => go(1)}
              aria-label="Next image"
            >
              <ChevronRight />
            </button>
          </>
        )}
      </div>
      <figcaption className="listing__caption">
        {current.caption} · {index + 1}/{images.length}
      </figcaption>
    </figure>
  );
}

// One full listing, laid out like Screen 7 in the Figma.
function Listing({ participant, isOwn, sale, onOrder }) {
  const { profile, snapshots } = participant;
  const topBid = sale.shown.at(-1);

  let bidLine = "Bidding opens shortly";
  if (sale.sold)
    bidLine = `Sold to ${sale.winner.bidder} for ${formatPrice(
      sale.winner.amount
    )}`;
  else if (topBid) bidLine = `Current bid: ${formatPrice(topBid.amount)}`;

  return (
    <article className="listing">
      {/* key: switching listings remounts the carousel, so it starts at the first image. */}
      <ListingCarousel
        key={participant.id}
        images={listingImages(participant)}
        sold={sale.sold}
      />

      <div className="listing__details">
        <h2 className="listing__title">Human Data Package</h2>
        <p className="listing__meta">
          {formatSubject(participant.number)} ·{" "}
          {sale.sold ? "Sold" : "Recently Listed"}
        </p>
        <p className="listing__price">{formatPrice(priceFor(profile))}</p>
        <p className="listing__bid" aria-live="polite">
          {bidLine}
        </p>

        <h3 className="listing__includes-title">Package Includes:</h3>
        <ul className="listing__includes">
          <li>
            <strong>Facial Image</strong>
            <span>1 portrait, {snapshots.length} candid captures</span>
          </li>
          <li>
            <strong>Body movement data</strong>
            <span>
              {profile.totalAttempts} movements recorded ·{" "}
              {Math.round(profile.compliance * 100)}% compliance
            </span>
          </li>
          <li>
            <strong>Response Patterns</strong>
            <span>
              Avg. response {formatSeconds(profile.avgResponseMs)} ·{" "}
              {profile.missed} missed · longest sequence{" "}
              {profile.longestSequence || "none"}
            </span>
          </li>
        </ul>

        <ul className="listing__tags">
          {profile.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>

        {isOwn &&
          (sale.sold ? (
            <p className="listing__sold-note">
              {sale.ordered
                ? `Your order could not be completed. This package was sold to ${sale.winner.bidder}.`
                : "This package is no longer available."}
            </p>
          ) : (
            <button
              type="button"
              className="button listing__order"
              onClick={onOrder}
            >
              Order Now
            </button>
          ))}
      </div>
    </article>
  );
}

// The bid feed, newest bid on top.
function BidFeed({ sale }) {
  const newestFirst = [...sale.shown].reverse();

  return (
    <section className="bids">
      <h3 className="bids__title">
        {!sale.sold && <span className="bids__live-dot" aria-hidden="true" />}
        {sale.sold ? "Bid history" : "Live bids"}
      </h3>

      {newestFirst.length === 0 ? (
        <p className="bids__empty">Waiting for bids…</p>
      ) : (
        <ol className="bids__list">
          {newestFirst.map((bid) => {
            const isWinner = sale.sold && bid === sale.winner;
            return (
              <li
                key={bid.id}
                className={`panel bids__item ${
                  isWinner ? "bids__item--winner" : ""
                }`}
              >
                <span className="bids__bidder">
                  {bid.bidder}
                  {isWinner && (
                    <span className="bids__winner-tag">Winning bid</span>
                  )}
                </span>
                <span className="bids__amount">{formatPrice(bid.amount)}</span>
                <span className="bids__use">Intended use: {bid.use}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

// Screen 7: the data marketplace.
function Marketplace({ participant, others, onFinish }) {
  const [viewingId, setViewingId] = useState(participant.id);
  // The visitor's own auction lives here, so it keeps running while they browse other listings.
  const ownSale = useAuctionPlayback(participant.auction);
  const finish = useEffectEvent(() => onFinish());

  const viewing = others.find((other) => other.id === viewingId) ?? participant;
  const isOwn = viewing.id === participant.id;
  const sale = isOwn ? ownSale : completedSale(viewing.auction);

  // Restarts on every new bid, sale or listing opened: the countdown to reset
  // only really runs once the auction is over and the visitor stops interacting.
  useEffect(() => {
    const timeoutId = setTimeout(finish, AUTO_RETURN_MS);
    return () => clearTimeout(timeoutId);
  }, [viewingId, ownSale.shown.length, ownSale.sold]);

  return (
    <section className="market">
      <header className="market__header">
        <p className="market__brand">Data Market</p>
        <button type="button" className="market__link" onClick={onFinish}>
          Exit
        </button>
      </header>

      {!isOwn && (
        <button
          type="button"
          className="market__link market__back"
          onClick={() => setViewingId(participant.id)}
        >
          ← Back to your listing
        </button>
      )}

      <Listing
        participant={viewing}
        isOwn={isOwn}
        sale={sale}
        onOrder={ownSale.order}
      />

      <BidFeed sale={sale} />

      {others.length > 0 && (
        <section className="market__others">
          <h3 className="market__others-title">Other listings</h3>
          <ul className="market__grid">
            {others.map((other) => (
              <li key={other.id}>
                <button
                  type="button"
                  className={`market__thumb ${
                    other.id === viewingId ? "market__thumb--active" : ""
                  }`}
                  onClick={() => setViewingId(other.id)}
                  aria-label={`View ${formatSubject(other.number)}`}
                >
                  <img src={other.portrait} alt="" />
                  <span className="market__thumb-sold">Sold</span>
                  <span className="market__thumb-price">
                    {formatPrice(other.auction.bids.at(-1).amount)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export default Marketplace;
