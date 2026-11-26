// Fictional bidders and what they say they'll use the data for.
// PLACEHOLDER: the group can rename these (search each name first to avoid matching a real company).
const BIDDERS = [
  {
    name: "Varnex Workforce Analytics",
    use: "Workforce productivity monitoring",
  },
  { name: "Quillmark Insurance Group", use: "Insurance risk scoring" },
  { name: "Pellucid Ad Exchange", use: "Targeted advertising" },
  { name: "Hexafield Security", use: "Facial recognition training" },
  { name: "Ostrid Robotics", use: "Gesture-recognition model training" },
  { name: "Corvane Talent Systems", use: "Automated candidate screening" },
  { name: "Nordvale Retail Intelligence", use: "In-store behaviour tracking" },
];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// A random bidder, never the same one twice in a row.
function pickBidder(previous) {
  const options = BIDDERS.filter((bidder) => bidder !== previous);
  return options[Math.floor(Math.random() * options.length)];
}

// Scripts a whole auction in advance: a list of bids, each with the time (in ms
// from the start) it should appear. The marketplace plays this back live.
export function createAuction(listPrice) {
  const count = 6 + Math.floor(Math.random() * 4); // 6 to 9 bids
  const bids = [];
  let amount = listPrice * randomBetween(0.55, 0.7); // bidding opens below list price
  let at = 1200; // first bid arrives 1.2s after the marketplace opens
  let previous = null;

  for (let index = 0; index < count; index++) {
    const bidder = pickBidder(previous);
    amount *= randomBetween(1.04, 1.15); // each bid is 4–15% higher
    bids.push({
      id: index,
      bidder: bidder.name,
      use: bidder.use,
      amount: Math.round(amount * 100) / 100, // round to cents
      at: Math.round(at),
    });
    previous = bidder;
    at += randomBetween(1500, 3200);
  }

  return { bids };
}
