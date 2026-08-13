import { leadRepository } from '../repositories/leadRepository.js';
import { followUpRepository } from '../repositories/followUpRepository.js';
import { settingsRepository } from '../repositories/settingsRepository.js';
import { outreachRepository } from '../repositories/outreachRepository.js';

export const dbService = {
  isSupabase: () => leadRepository.isSupabase(),
  leads: leadRepository,
  followUps: followUpRepository,
  settings: settingsRepository,
  outreach: outreachRepository
};
