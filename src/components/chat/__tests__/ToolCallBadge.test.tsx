import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import { ToolInvocation } from "ai";

afterEach(() => cleanup());

function makeToolCall(
  toolName: string,
  args: Record<string, string>,
  state: "call" | "result" = "result"
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "1", toolName, args, state, result: "ok" };
  }
  return { toolCallId: "1", toolName, args, state };
}

test("str_replace_editor create shows Creating <filename>", () => {
  render(<ToolCallBadge tool={makeToolCall("str_replace_editor", { command: "create", path: "Card.tsx" })} />);
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("str_replace_editor str_replace shows Editing <filename>", () => {
  render(<ToolCallBadge tool={makeToolCall("str_replace_editor", { command: "str_replace", path: "Card.tsx" })} />);
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("str_replace_editor insert shows Editing <filename>", () => {
  render(<ToolCallBadge tool={makeToolCall("str_replace_editor", { command: "insert", path: "Card.tsx" })} />);
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("str_replace_editor view shows Reading <filename>", () => {
  render(<ToolCallBadge tool={makeToolCall("str_replace_editor", { command: "view", path: "Card.tsx" })} />);
  expect(screen.getByText("Reading Card.tsx")).toBeDefined();
});

test("str_replace_editor undo_edit shows Undoing edit in <filename>", () => {
  render(<ToolCallBadge tool={makeToolCall("str_replace_editor", { command: "undo_edit", path: "Card.tsx" })} />);
  expect(screen.getByText("Undoing edit in Card.tsx")).toBeDefined();
});

test("file_manager rename shows Renaming <filename>", () => {
  render(<ToolCallBadge tool={makeToolCall("file_manager", { command: "rename", path: "Button.tsx" })} />);
  expect(screen.getByText("Renaming Button.tsx")).toBeDefined();
});

test("file_manager delete shows Deleting <filename>", () => {
  render(<ToolCallBadge tool={makeToolCall("file_manager", { command: "delete", path: "Button.tsx" })} />);
  expect(screen.getByText("Deleting Button.tsx")).toBeDefined();
});

test("extracts filename from nested path", () => {
  render(<ToolCallBadge tool={makeToolCall("str_replace_editor", { command: "create", path: "src/components/Card.tsx" })} />);
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("unknown tool name falls back to raw tool name", () => {
  render(<ToolCallBadge tool={makeToolCall("some_other_tool", {})} />);
  expect(screen.getByText("some_other_tool")).toBeDefined();
});

test("in-progress state shows spinner", () => {
  const { container } = render(
    <ToolCallBadge tool={makeToolCall("str_replace_editor", { command: "create", path: "Card.tsx" }, "call")} />
  );
  expect(container.querySelector(".animate-spin")).toBeTruthy();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("completed state shows green dot", () => {
  const { container } = render(
    <ToolCallBadge tool={makeToolCall("str_replace_editor", { command: "create", path: "Card.tsx" }, "result")} />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  expect(container.querySelector(".animate-spin")).toBeNull();
});
