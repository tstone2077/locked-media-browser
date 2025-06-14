
import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SourceConfig from "./SourceConfig";
import EncryptionConfig from "./EncryptionConfig";

// Clear session storage before each test
beforeEach(() => {
  sessionStorage.clear();
});

// Helper to add encryption method via EncryptionConfig UI
async function addEncryptionMethodUI(name: string, type: "gpg" | "aes-256" = "gpg") {
  render(<EncryptionConfig />);
  const addButton = screen.getByText("Add Encryption Method");
  await userEvent.click(addButton);

  await userEvent.type(screen.getByLabelText(/Name/i), name);
  await userEvent.selectOptions(screen.getByLabelText(/Type/i), type);

  if (type === "gpg") {
    await userEvent.type(screen.getByLabelText(/Private Key/i), "FAKE_PRIVATE_KEY");
    await userEvent.type(screen.getByLabelText(/Password/i), "passgpg");
  } else {
    await userEvent.type(screen.getByLabelText(/AES-256 Password/i), "passaes");
  }

  await userEvent.click(screen.getByText("Add"));
}

describe("SourceConfig Encryption Method Dropdown", () => {
  it("shows latest encryption methods even after one is added when dialog is open", async () => {
    // Add a GPG method
    await addEncryptionMethodUI("GPG Method", "gpg");

    // Render SourceConfig and open "Add Data Source" dialog
    render(<SourceConfig />);
    const addSourceBtn = screen.getByText("Add Data Source");
    await userEvent.click(addSourceBtn);

    const encryptionSelect = screen.getByLabelText(/Encryption Method/i);
    // Should have the GPG method
    expect(
      within(encryptionSelect).getByText("GPG Method")
    ).toBeInTheDocument();

    // Render EncryptionConfig in the background and add AES-256 method
    render(<EncryptionConfig />);
    const addMethodBtn = screen.getByText("Add Encryption Method");
    await userEvent.click(addMethodBtn);
    await userEvent.type(screen.getByLabelText(/Name/i), "AES Method");
    await userEvent.selectOptions(screen.getByLabelText(/Type/i), "aes-256");
    await userEvent.type(screen.getByLabelText(/AES-256 Password/i), "passaes");
    await userEvent.click(screen.getByText("Add"));

    // In SourceConfig, open/close the dropdown to force rerender (simulate user)
    await userEvent.click(encryptionSelect);

    await waitFor(() =>
      expect(
        within(encryptionSelect).getByText("AES Method")
      ).toBeInTheDocument()
    );
  });

  it("shows empty message if no encryption methods exist", async () => {
    render(<SourceConfig />);
    const addSourceBtn = screen.getByText("Add Data Source");
    await userEvent.click(addSourceBtn);

    const encryptionSelect = screen.getByLabelText(/Encryption Method/i);
    expect(within(encryptionSelect).queryByText(/Choose/i)).toBeInTheDocument();
    expect(encryptionSelect.childNodes.length).toBe(1); // Only 'Choose...' option
  });
});

