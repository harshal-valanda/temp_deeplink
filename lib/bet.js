// Fetches bet data from batch-retrieve and maps it into OG preview fields.

export async function fetchBet(config, betId, betType) {
  if (!betId) return null;

  const url = `${config.API_BASE}/batch-retrieve`;
  const body = {
    bets: [{ bet_id: betId, bet_type: betType || '1' }],
  };

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (_err) {
    return null;
  }

  if (!res.ok) return null;

  let json;
  try {
    json = await res.json();
  } catch (_err) {
    return null;
  }

  const bets = extractBets(json);
  return bets.length ? bets[0] : null;
}

function extractBets(json) {
  if (Array.isArray(json)) return json;
  const inner = json?.data?.data?.bets ?? json?.data?.bets ?? json?.bets;
  return Array.isArray(inner) ? inner : [];
}

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const isCash = (moneyType) => (moneyType || '').toLowerCase().includes('cash');

function formatStake(amount, moneyType) {
  const n = num(amount);
  if (n === null) return null;
  if (isCash(moneyType)) return `$${n.toFixed(2)}`;
  return `${n.toLocaleString('en-US')} coins`;
}

function americanOdds(displayOdds) {
  return displayOdds?.american ?? null;
}

function competitorsLabel(competitors) {
  if (!Array.isArray(competitors) || competitors.length === 0) return null;
  const home = competitors.find((c) => c.qualifier === 'home');
  const away = competitors.find((c) => c.qualifier === 'away');
  if (home && away) return `${home.name} vs ${away.name}`;
  return competitors.map((c) => c.name).filter(Boolean).join(' vs ');
}

function pickLabel(selection) {
  const outcome = selection?.market?.outcome?.[0];
  return outcome?.easy_read_line || outcome?.name || null;
}

function statusLabel(bet) {
  const finalized = bet.finalized;
  const won = bet.won;
  if (finalized === '1' || finalized === 1) {
    if (won === '1' || won === 1) return 'Won';
    if (won === '0' || won === 0) return 'Lost';
  }
  return 'Pending';
}

function legFromBet(leg) {
  return {
    matchup: competitorsLabel(leg.competitors),
    pick: pickLabel(leg.selection),
    odds: americanOdds(leg.selection?.market?.outcome?.[0]?.display_odds),
    sport: leg.sport_name || null,
    league: leg.league_name || null,
  };
}

export function buildPreview(bet, config) {
  const username =
    bet?.user?.username || bet?.first_user?.username || 'A bettor';
  const siteName = config.SITE_NAME || 'Rebet';

  const isParlay = Array.isArray(bet?.bets) && bet.bets.length > 0;

  if (isParlay) {
    const legs = bet.bets.map(legFromBet);
    const legCount = legs.length;
    const combinedOdds = bet?.display_odds?.combined_odds?.american ?? null;
    const stake = formatStake(bet.wager_amount, bet.money_type);
    const status = statusLabel(bet);

    const title = `${username} · ${legCount}-leg parlay`;
    const legText = legs.map((l) => l.pick).filter(Boolean).join(' · ');
    const descParts = [];
    if (legText) descParts.push(legText);
    const meta = [];
    if (stake) meta.push(stake);
    if (combinedOdds) meta.push(combinedOdds);
    if (status) meta.push(status);
    if (meta.length) descParts.push(meta.join(' · '));

    return {
      isParlay: true,
      username,
      siteName,
      legCount,
      legs,
      stake,
      odds: combinedOdds,
      status,
      title,
      description: descParts.join(' — '),
    };
  }

  const matchup = competitorsLabel(bet?.competitors);
  const pick = pickLabel(bet?.selection);
  const marketName = bet?.selection?.market?.market_name || null;
  const odds = americanOdds(bet?.selection?.market?.outcome?.[0]?.display_odds);
  const stake = formatStake(bet.wager_amount, bet.money_type);
  const status = statusLabel(bet);

  const title = matchup ? `${username} · ${matchup}` : `${username}'s bet`;

  const descParts = [];
  if (pick) descParts.push(pick);
  const meta = [];
  if (stake) meta.push(stake);
  if (odds) meta.push(odds);
  if (status) meta.push(status);
  if (meta.length) descParts.push(meta.join(' · '));

  return {
    isParlay: false,
    username,
    siteName,
    matchup,
    pick,
    marketName,
    odds,
    stake,
    status,
    sport: bet?.sport_name || null,
    league: bet?.league_name || null,
    title,
    description: descParts.join(' — '),
  };
}
