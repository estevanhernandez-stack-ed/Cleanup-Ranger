import type { UserStats } from '../components/squads/UserProfileModal';

export const SQUAD_MEMBERS: UserStats[] = [
  { name: 'You (Captain)', points: 2_450, avatar: '🧑‍🌾', role: 'Captain', parksCleaned: 47, trashBagsCollected: 120, locationsVisited: 14, rank: 'Regional Commander', recentBadges: ['Weekender', 'Trash Panda', '100 Bags'], territoryRank: 3 },
  { name: 'River Chen', points: 1_820, avatar: '🧑‍🔬', role: 'Scout', parksCleaned: 32, trashBagsCollected: 85, locationsVisited: 18, rank: 'Elite Scout', recentBadges: ['Early Bird', 'Trailblazer'], territoryRank: 12 },
  { name: 'Maya Torres', points: 1_340, avatar: '👩‍🏫', role: 'Medic', parksCleaned: 15, trashBagsCollected: 40, locationsVisited: 8, rank: 'First Responder', recentBadges: ['Team Player'], territoryRank: 45 },
  { name: 'Jordan Lee', points: 980, avatar: '🧑‍🚒', role: 'Ranger', parksCleaned: 10, trashBagsCollected: 25, locationsVisited: 5, rank: 'Rookie', recentBadges: ['First Strike'], territoryRank: 89 },
];
