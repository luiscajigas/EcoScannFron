import { components } from '../api/contract';

/**
 * API types. All of them come from the backend's OpenAPI contract and are not
 * written by hand, so the compiler warns when the API changes.
 */
type Schemas = components['schemas'];

export type ApiError = Schemas['ApiError'];
export type AuthResponse = Schemas['AuthResponse'];
export type BinColor = Schemas['BinColor'];
export type CategoryKey = Schemas['CategoryKey'];
export type ErrorCode = Schemas['ErrorCode'];
export type LoginRequest = Schemas['LoginRequest'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type Scan = Schemas['Scan'];
export type ScanRequest = Schemas['ScanRequest'];
export type ScanResult = Schemas['ScanResult'];
export type LiveClientMessage = Schemas['LiveClientMessage'];
export type LiveServerMessage = Schemas['LiveServerMessage'];
export type RankingEntry = Schemas['RankingEntry'];
export type User = Schemas['User'];
export type WeeklyRanking = Schemas['WeeklyRanking'];
export type UserStats = Schemas['UserStats'];
