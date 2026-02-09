import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactInfo } from "./ContactInfo";

describe("ContactInfo", () => {
  describe("empty state", () => {
    it("renders empty message when no contact info provided", () => {
      render(<ContactInfo />);

      expect(screen.getByText("No contact information available.")).toBeInTheDocument();
    });
  });

  describe("with contact info", () => {
    it("renders phone number", () => {
      render(<ContactInfo phone="202-555-1234" />);

      expect(screen.getByText("DC Office Phone")).toBeInTheDocument();
      expect(screen.getByText("202-555-1234")).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", "tel:2025551234");
    });

    it("renders contact form link", () => {
      render(<ContactInfo contactFormUrl="https://example.gov/contact" />);

      expect(screen.getByText("Online Contact Form")).toBeInTheDocument();
      expect(screen.getByText("Send a message")).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.gov/contact");
    });

    it("renders address with Google Maps link", () => {
      render(<ContactInfo address="123 Capitol Hill" />);

      expect(screen.getByText("DC Office Address")).toBeInTheDocument();
      expect(screen.getByText(/123 Capitol Hill/)).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "https://www.google.com/maps/search/?api=1&query=123%20Capitol%20Hill"
      );
    });

    it("renders website with hostname", () => {
      render(<ContactInfo website="https://www.example.gov/page" />);

      expect(screen.getByText("Official Website")).toBeInTheDocument();
      expect(screen.getByText("example.gov")).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", "https://www.example.gov/page");
    });

    it("renders twitter link", () => {
      render(<ContactInfo twitterHandle="reptest" />);

      expect(screen.getByText("X (Twitter)")).toBeInTheDocument();
      expect(screen.getByText("@reptest")).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", "https://twitter.com/reptest");
    });

    it("renders facebook link", () => {
      render(<ContactInfo facebookId="reptest" />);

      expect(screen.getByText("Facebook")).toBeInTheDocument();
      expect(screen.getByText("View Profile")).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", "https://facebook.com/reptest");
    });

    it("renders all contact info together in grid", () => {
      render(
        <ContactInfo
          phone="202-555-1234"
          contactFormUrl="https://example.gov/contact"
          address="123 Capitol Hill"
          website="https://example.gov"
          twitterHandle="reptest"
          facebookId="reptest"
        />
      );

      expect(screen.getByText("DC Office Phone")).toBeInTheDocument();
      expect(screen.getByText("Official Website")).toBeInTheDocument();
      expect(screen.getByText("Online Contact Form")).toBeInTheDocument();
      expect(screen.getByText("DC Office Address")).toBeInTheDocument();
      expect(screen.getByText("X (Twitter)")).toBeInTheDocument();
      expect(screen.getByText("Facebook")).toBeInTheDocument();
    });

    it("only renders provided fields", () => {
      render(<ContactInfo phone="202-555-1234" />);

      expect(screen.getByText("DC Office Phone")).toBeInTheDocument();
      expect(screen.queryByText("Online Contact Form")).not.toBeInTheDocument();
      expect(screen.queryByText("DC Office Address")).not.toBeInTheDocument();
      expect(screen.queryByText("X (Twitter)")).not.toBeInTheDocument();
    });
  });
});
