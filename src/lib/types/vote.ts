import type { VotePosition } from "@/lib/types/legislation";

export interface VoteMember {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  position: VotePosition;
}
