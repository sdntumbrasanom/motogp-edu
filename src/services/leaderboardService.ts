import { LeaderboardEntry, GameMode } from '../types/game';

const LEADERBOARD_KEY = 'apex_motogp_leaderboard_v2';

const INITIAL_GLOBAL_RECORDS: LeaderboardEntry[] = [
  {
    id: 'lead-1',
    playerName: 'Pecco "The Beast" Bagnaia',
    token: 'GLOBAL',
    mode: 'solo',
    score: 4950,
    maxSpeedKmH: 362,
    accuracy: 100,
    timeSec: 184,
    carModel: 'Ducati Desmosedici GP',
    carColor: '#dc2626',
    date: '22 Okt 2026',
  },
  {
    id: 'lead-2',
    playerName: 'Marc "Ant" Marquez',
    token: 'BALAP-KILAT',
    mode: 'solo',
    score: 4620,
    maxSpeedKmH: 365,
    accuracy: 96,
    timeSec: 162,
    carModel: 'Apex GP World Champion',
    carColor: '#06b6d4',
    date: '20 Okt 2026',
  },
  {
    id: 'lead-3',
    playerName: 'Fabio "El Diablo" Quartararo',
    token: 'MAT-SMART',
    mode: 'solo',
    score: 4150,
    maxSpeedKmH: 348,
    accuracy: 100,
    timeSec: 155,
    carModel: 'Yamaha YZR-M1 Factory',
    carColor: '#1d4ed8',
    date: '19 Okt 2026',
  },
  {
    id: 'lead-4',
    playerName: 'Brad Binder (Sprint King)',
    token: 'BALAP-KILAT',
    mode: 'battle',
    score: 3880,
    maxSpeedKmH: 358,
    accuracy: 92,
    timeSec: 140,
    carModel: 'KTM RC16 Red Bull',
    carColor: '#f97316',
    date: '18 Okt 2026',
  },
  {
    id: 'lead-5',
    playerName: 'Arya & Dimas (Mandalika Duo)',
    token: 'IPA-GENIUS',
    mode: 'battle',
    score: 3450,
    maxSpeedKmH: 354,
    accuracy: 90,
    timeSec: 130,
    carModel: 'Aprilia RS-GP Factory',
    carColor: '#18181b',
    date: '15 Okt 2026',
  },
];

class LeaderboardService {
  public getEntries(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(LEADERBOARD_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to read leaderboard from localStorage', e);
    }
    // Default seed
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(INITIAL_GLOBAL_RECORDS));
    return INITIAL_GLOBAL_RECORDS;
  }

  public addEntry(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry {
    const list = this.getEntries();
    const now = new Date();
    const dateFormatted = `${now.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][now.getMonth()]} ${now.getFullYear()}`;

    const newRecord: LeaderboardEntry = {
      ...entry,
      id: `score-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: dateFormatted,
    };

    list.push(newRecord);
    // Sort descending by score, then by speed
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.maxSpeedKmH - a.maxSpeedKmH;
    });

    // Keep top 100 entries
    const trimmed = list.slice(0, 100);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
    return newRecord;
  }

  public getFilteredEntries(tokenFilter?: string, modeFilter?: GameMode | 'all'): LeaderboardEntry[] {
    const list = this.getEntries();
    return list.filter((item) => {
      if (tokenFilter && tokenFilter !== 'ALL' && item.token.toUpperCase() !== tokenFilter.toUpperCase()) {
        return false;
      }
      if (modeFilter && modeFilter !== 'all' && item.mode !== modeFilter) {
        return false;
      }
      return true;
    });
  }
}

export const leaderboardService = new LeaderboardService();
