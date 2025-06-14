
import React from "react";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SourceConfig from "./SourceConfig";
import EncryptionConfig from "./EncryptionConfig";
import { useSessionStorage } from "@/lib/session-storage";

// Use this to clear sessionStorage before each test
beforeEach(() => {
  sessionStorage.clear();
});

// Useful helper to add encryption method via EncryptionConfig UI
async function addEncryptionMethodUI(name: string, type: "gpg" | "aes-256" = "gpg") {
  render(<EncryptionConfig />);

  const addButton = screen.getByText("Add Encryption Method");
  userEvent.click(addButton);

  userEvent.type(screen.getByLabelText(/Name/i), name);
  userEvent.selectOptions(screen.getByLabelText(/Type/i), type);

  if (type === "gpg") {
    userEvent.type(screen.getByLabelText(/Private Key/i), "FAKE_PRIVATE_KEY");
    userEvent.type(screen.getByLabelText(/Password/i), "passgpg");
  } else {
    userEvent.type(screen.getByLabelText(/AES-256 Password/i), "passaes");
  }

  userEvent.click(screen.getByText("Add"));
}

describe("SourceConfig Encryption Method Dropdown", () => {
  it("shows latest encryption methods even after one is added when dialog is open", async () => {
    // Add a GPG method
    await addEncryptionMethodUI("GPG Method", "gpg");

    // Render SourceConfig and open "Add Data Source" dialog
    render(<SourceConfig />);
    const addSourceBtn = screen.getByText("Add Data Source");
    userEvent.click(addSourceBtn);

    const encryptionSelect = screen.getByLabelText(/Encryption Method/i);
    // Should have the GPG method
    expect(
      within(encryptionSelect).getByText("GPG Method")
    ).toBeInTheDocument();

    // Render EncryptionConfig in the background and add AES-256 method
    // (simulate user opening the encryption methods in another pane/tab)
    render(<EncryptionConfig />);
    const addMethodBtn = screen.getByText("Add Encryption Method");
    userEvent.click(addMethodBtn);
    userEvent.type(screen.getByLabelText(/Name/i), "AES Method");
    userEvent.selectOptions(screen.getByLabelText(/Type/i), "aes-256");
    userEvent.type(screen.getByLabelText(/AES-256 Password/i), "passaes");
    userEvent.click(screen.getByText("Add"));

    // In SourceConfig, open/close the dropdown to force rerender (simulate user)
    userEvent.click(encryptionSelect);

    await waitFor(() =>
      expect(
        within(encryptionSelect).getByText("AES Method")
      ).toBeInTheDocument()
    );
  });

  it("shows empty message if no encryption methods exist", () => {
    render(<SourceConfig />);
    const addSourceBtn = screen.getByText("Add Data Source");
    userEvent.click(addSourceBtn);

    const encryptionSelect = screen.getByLabelText(/Encryption Method/i);
    expect(within(encryptionSelect).queryByText(/Choose/i)).toBeInTheDocument();
    expect(encryptionSelect.childNodes.length).toBe(1); // Only 'Choose...' option
  });
});
