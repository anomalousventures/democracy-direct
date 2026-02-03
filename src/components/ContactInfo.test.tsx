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
      expect(screen.getByRole("link", { name: "202-555-1234" })).toHaveAttribute(
        "href",
        "tel:202-555-1234"
      );
    });

    it("renders contact form link", () => {
      render(<ContactInfo contactFormUrl="https://example.gov/contact" />);

      expect(screen.getByText("Online Contact Form")).toBeInTheDocument();
      expect(screen.getByText("Send a message")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Send a message/ })).toHaveAttribute(
        "href",
        "https://example.gov/contact"
      );
    });

    it("renders address", () => {
      render(<ContactInfo address="123 Capitol Hill\nWashington, DC 20515" />);

      expect(screen.getByText("DC Office Address")).toBeInTheDocument();
      expect(screen.getByText(/123 Capitol Hill/)).toBeInTheDocument();
    });

    it("renders social media links", () => {
      render(<ContactInfo twitterHandle="reptest" facebookId="reptest" />);

      expect(screen.getByText("Social Media")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /@reptest/ })).toHaveAttribute(
        "href",
        "https://twitter.com/reptest"
      );
      expect(screen.getByRole("link", { name: /Facebook/ })).toHaveAttribute(
        "href",
        "https://facebook.com/reptest"
      );
    });

    it("renders all contact info together", () => {
      render(
        <ContactInfo
          phone="202-555-1234"
          contactFormUrl="https://example.gov/contact"
          address="123 Capitol Hill"
          twitterHandle="reptest"
          facebookId="reptest"
        />
      );

      expect(screen.getByText("Contact Information")).toBeInTheDocument();
      expect(screen.getByText("202-555-1234")).toBeInTheDocument();
      expect(screen.getByText("Send a message")).toBeInTheDocument();
      expect(screen.getByText(/123 Capitol Hill/)).toBeInTheDocument();
      expect(screen.getByText(/@reptest/)).toBeInTheDocument();
    });

    it("only renders provided fields", () => {
      render(<ContactInfo phone="202-555-1234" />);

      expect(screen.getByText("DC Office Phone")).toBeInTheDocument();
      expect(screen.queryByText("Online Contact Form")).not.toBeInTheDocument();
      expect(screen.queryByText("DC Office Address")).not.toBeInTheDocument();
      expect(screen.queryByText("Social Media")).not.toBeInTheDocument();
    });

    it("renders twitter only when facebook not provided", () => {
      render(<ContactInfo twitterHandle="reptest" />);

      expect(screen.getByRole("link", { name: /@reptest/ })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /Facebook/ })).not.toBeInTheDocument();
    });

    it("renders facebook only when twitter not provided", () => {
      render(<ContactInfo facebookId="reptest" />);

      expect(screen.getByRole("link", { name: /Facebook/ })).toBeInTheDocument();
      expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    });
  });
});
