/**
 * Shared types for Congress legislation data (votes, bills, members).
 * Used by Congress.gov API wrapper, Senate.gov XML parser, and database schema.
 */

export type Chamber = "house" | "senate";

export type VotePosition = "yea" | "nay" | "not_voting" | "present";

export type BillType = "hr" | "s" | "hjres" | "sjres" | "hconres" | "sconres" | "hres" | "sres";

export type BillStatus =
  | "introduced"
  | "passed_house"
  | "passed_senate"
  | "resolving_differences"
  | "to_president"
  | "signed"
  | "vetoed"
  | "veto_overridden"
  | "became_law";

export interface Vote {
  id?: string;
  rollCall: number;
  chamber: Chamber;
  congress: number;
  session: number;
  date: Date;
  question: string;
  result: string;
  billNumber: string | null;
  billTitle: string | null;
  billSubjects: string[] | null;
  sourceUrl: string;
  yeas: number;
  nays: number;
  notVoting: number;
  present: number;
}

export interface MemberVote {
  voteId: string;
  bioguideId: string;
  position: VotePosition;
  party?: string;
  state?: string;
  memberName?: string;
}

export interface Bill {
  id?: string;
  billNumber: string;
  billType: BillType;
  congress: number;
  title: string;
  summary: string | null;
  status: BillStatus;
  subjects: string[];
  introducedDate: Date;
  latestActionDate: Date;
  latestActionText: string;
  sponsorBioguideId: string | null;
  congressGovUrl: string;
}

export interface BillSummary {
  billNumber: string;
  congress: number;
  versionCode: string;
  actionDate: Date;
  actionDesc: string;
  text: string;
  updateDate: Date;
}

export interface ParsedBillNumber {
  type: BillType;
  number: number;
  congress?: number;
}

export interface CongressApiResponse<T> {
  data: T;
  pagination?: {
    count: number;
    next?: string;
    prev?: string;
  };
}

export interface HouseVoteResponse {
  vote: {
    congress: number;
    session: number;
    chamber: string;
    rollNumber: number;
    date: string;
    time: string;
    question: string;
    result: string;
    description?: string;
    bill?: {
      congress: number;
      type: string;
      number: number;
      title?: string;
    };
    totals: {
      yea: number;
      nay: number;
      notVoting: number;
      present: number;
    };
    members: {
      bioguideId: string;
      party: string;
      state: string;
      name: string;
      vote: string;
    }[];
  };
}

export interface SenateVoteXml {
  rollCallVote: {
    congress: string;
    session: string;
    voteNumber: string;
    voteDate: string;
    question: string;
    result: string;
    voteTally: {
      yeas: string;
      nays: string;
    };
    members: {
      member: SenateVoteMemberXml[];
    };
    document?: {
      documentName?: string;
      documentTitle?: string;
    };
  };
}

export interface SenateVoteMemberXml {
  memberFull: string;
  lastName: string;
  firstName?: string;
  party: string;
  state: string;
  voteCast: string;
  lisMemberId: string;
}

export interface SenateVoteMenuXml {
  voteMenu: {
    congress: string;
    session: string;
    votes: {
      vote: SenateVoteMenuItemXml[];
    };
  };
}

export interface SenateVoteMenuItemXml {
  voteNumber: string;
  voteDate: string;
  issue?: string;
  question: string;
  result: string;
}

export interface BillListResponse {
  bills: BillListItem[];
  pagination?: {
    count: number;
    next?: string;
  };
}

export interface BillListItem {
  congress: number;
  type: string;
  number: number;
  title: string;
  introducedDate: string;
  latestAction?: {
    actionDate: string;
    text: string;
  };
  policyArea?: {
    name: string;
  };
  sponsors?: {
    bioguideId: string;
    fullName: string;
    party: string;
    state: string;
  }[];
  url: string;
}

export interface BillDetailResponse {
  bill: {
    congress: number;
    type: string;
    number: number;
    title: string;
    introducedDate: string;
    latestAction?: {
      actionDate: string;
      text: string;
    };
    policyArea?: {
      name: string;
    };
    subjects?: {
      legislativeSubjects?: {
        name: string;
      }[];
    };
    sponsors?: {
      bioguideId: string;
      fullName: string;
      party: string;
      state: string;
    }[];
    summaries?: {
      summary: {
        versionCode: string;
        actionDate: string;
        actionDesc: string;
        text: string;
        updateDate: string;
      }[];
    };
  };
}
