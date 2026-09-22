const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.join(__dirname, "../libs/ui/src/components");

test("each UI component owns its source, styles, stories and public entry", () => {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  assert.ok(entries.length > 0);
  for (const entry of entries) {
    assert.ok(entry.isDirectory(), `${entry.name} must live in its own folder`);
    const name = entry.name;
    for (const file of [
      `${name}.tsx`,
      `${name}.module.css`,
      `${name}.stories.tsx`,
      "index.ts",
    ]) {
      assert.ok(
        fs.existsSync(path.join(root, name, file)),
        `${name} is missing ${file}`,
      );
    }
    const source = fs.readFileSync(
      path.join(root, name, `${name}.tsx`),
      "utf8",
    );
    const ast = ts.createSourceFile(
      name,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const functions = ast.statements.filter(
      (node) =>
        ts.isFunctionDeclaration(node) &&
        node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword),
    );
    assert.equal(
      functions.length,
      1,
      `${name} must not group multiple components`,
    );
    const cssImports = [
      ...source.matchAll(/from\s+["']([^"']+\.css)["']/g),
    ].map((match) => match[1]);
    assert.deepEqual(
      cssImports,
      [`./${name}.module.css`],
      `${name} imports another component's styles`,
    );
    assert.doesNotMatch(
      source,
      /(?:useGame|useI18n|@bull-and-cow\/i18n|createWebSocket|from\s+["']next\/)/,
      `${name} must remain independent of the application`,
    );
    const css = fs.readFileSync(
      path.join(root, name, `${name}.module.css`),
      "utf8",
    );
    assert.doesNotMatch(
      css,
      /:global|@import|#[\da-f]{3,8}\b/i,
      `${name} must use scoped styles and shared color tokens`,
    );
    const classes = new Set(
      [...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((match) => match[1]),
    );
    for (const match of source.matchAll(/styles\.([a-zA-Z][\w]*)/g)) {
      assert.ok(
        classes.has(match[1]),
        `${name} references missing local class ${match[1]}`,
      );
    }
  }
});
