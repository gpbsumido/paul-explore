import { describe, it, expect } from "vitest";
import ts from "typescript";
import { PATTERNS } from "./patterns";
import { TOOLKIT_SECTIONS, HARNESS_PRELUDE } from "./toolkit";
import type { CodeExample } from "./types";

/**
 * The code on these pages is the code that gets tested.
 *
 * Every snippet is shown as a string, so the obvious failure is a template
 * that reads fine and does not run: an off-by-one in a binary search, a heap
 * that sifts the wrong way. Each snippet carries its own cases, and this
 * transpiles the exact string the page renders, runs it, and checks every
 * case. Then it type-checks all of them together in strict mode, because a
 * TypeScript page full of code that does not type-check teaches the wrong
 * habit.
 *
 * LeetCode predefines ListNode and TreeNode; HARNESS_PRELUDE plays that part,
 * and it is itself built from the toolkit page's snippets, so the helpers are
 * the same ones a reader sees.
 */

type LabelledExample = { label: string; example: CodeExample };

const examples: LabelledExample[] = [
  ...PATTERNS.flatMap((p) => [
    { label: `${p.id} / template`, example: p.template },
    ...p.variants.map((v) => ({ label: `${p.id} / ${v.title}`, example: v })),
  ]),
  ...TOOLKIT_SECTIONS.flatMap((s) =>
    s.examples.map((e) => ({ label: `toolkit / ${s.id} / ${e.title}`, example: e })),
  ),
];

function run(example: CodeExample): unknown[] {
  const source = `${HARNESS_PRELUDE}
function __snippet() {
${example.code}
return [${example.cases.map((c) => c.call).join(",\n")}];
}`;
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  });
  return new Function(`${outputText}\nreturn __snippet();`)() as unknown[];
}

describe("every snippet on the playbook pages", () => {
  it("found the snippets it claims to check", () => {
    expect(examples.length).toBeGreaterThan(60);
  });

  it.each(examples)("$label runs and passes its cases", ({ example }) => {
    expect(example.cases.length).toBeGreaterThanOrEqual(1);
    const results = run(example);
    example.cases.forEach((c, i) => {
      expect(results[i], c.call).toEqual(c.expected);
    });
  });

  it("type-checks in strict mode", () => {
    const files = new Map<string, string>([["/virtual/prelude.ts", HARNESS_PRELUDE]]);
    examples.forEach(({ example }, i) => {
      files.set(
        `/virtual/snippet-${i}.ts`,
        `export {};\n${example.code}\nconst __cases = [${example.cases.map((c) => c.call).join(",\n")}];\nvoid __cases;\n`,
      );
    });
    const options: ts.CompilerOptions = {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ES2022,
      lib: ["lib.es2023.d.ts"],
      types: [],
    };
    const host = ts.createCompilerHost(options);
    const realGetSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, languageVersion, ...rest) => {
      const virtual = files.get(name);
      return virtual === undefined
        ? realGetSourceFile(name, languageVersion, ...rest)
        : ts.createSourceFile(name, virtual, languageVersion, true);
    };
    const realFileExists = host.fileExists.bind(host);
    host.fileExists = (name) => files.has(name) || realFileExists(name);

    const program = ts.createProgram([...files.keys()], options, host);
    const problems = ts.getPreEmitDiagnostics(program).map((d) => {
      const index = d.file?.fileName.match(/snippet-(\d+)/)?.[1];
      const where = index === undefined ? d.file?.fileName ?? "global" : examples[Number(index)].label;
      return `${where}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`;
    });
    expect(problems).toEqual([]);
  }, 60_000);
});
