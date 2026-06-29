// Fallback bet used when batch-retrieve is unavailable (e.g. returns 401),
// so link previews still render instead of falling back to the generic image.
export const DEFAULT_BET = {
  selection: {
    market: {
      outcome: [
        {
          name: 'Boston Red Sox',
          id: '4',
          easy_read_line: 'Boston Red Sox',
          chosen: '1',
          odds: '1.75',
          display_odds: { decimal: '1.75', american: '-133', fractional: '3/4' },
        },
      ],
      market_name: 'Winner (incl. extra innings)',
      id: '251',
    },
  },
  bet_id: '95221d55-4075-4f81-bf10-5bb8e5260ab8',
  won: '0',
  finalized: '1',
  wager_amount: '1000',
  bet_type: '1',
  money_type: 'rebet_coin',
  league_name: 'MLB',
  sport_name: 'Baseball',
  user: { username: 'ProviderTest' },
  first_user: { username: 'ProviderTest' },
  competitors: [
    { qualifier: 'home', name: 'Boston Red Sox', abbreviation: 'BOS' },
    { qualifier: 'away', name: 'New York Yankees', abbreviation: 'NYY' },
  ],
};
