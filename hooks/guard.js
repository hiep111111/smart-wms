#!/usr/bin/env node
/**
 * PreToolUse guard — blocks any tool that attempts to directly modify
 * .env or prisma/schema.prisma. Exit code 2 = block + show reason.
 */

const PROTECTED = [/\.(env)(\.|$)/, /schema\.prisma/];

function isProtected(str) {
  return PROTECTED.some((re) => re.test(str));
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0); // can't parse — let it through
  }

  const { tool_name, tool_input } = payload;

  // Edit / Write tools: check file_path
  if (tool_name === "Edit" || tool_name === "Write") {
    const path = tool_input?.file_path ?? "";
    if (isProtected(path)) {
      console.error(
        `[guard] BLOCKED: Direct edits to "${path}" are not allowed.\n` +
          "Use /plan to propose schema changes, or update .env manually."
      );
      process.exit(2);
    }
  }

  // Bash tool: check command string
  if (tool_name === "Bash") {
    const cmd = tool_input?.command ?? "";
    if (isProtected(cmd)) {
      console.error(
        `[guard] BLOCKED: Bash command references a protected file.\n` +
          "Command: " +
          cmd.slice(0, 120)
      );
      process.exit(2);
    }
  }

  process.exit(0);
});
