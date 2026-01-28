export interface Representative {
  first_name: string;
  last_name: string;
  party: string;
  state: string;
  district: string | null;
  chamber: "senate" | "house";
  title?: string;
  contact_form?: string;
  phone?: string;
  office_address?: string;
}

export interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export function createEmptyAddress(): Address {
  return {
    name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  };
}

export function getRepresentativeTitle(rep: Representative): string {
  if (rep.title) {
    return rep.title;
  }
  return rep.chamber === "senate" ? "Senator" : "Representative";
}

export function formatLetterDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
