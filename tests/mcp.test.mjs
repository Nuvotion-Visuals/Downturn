import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const MCP_PATH = path.resolve(import.meta.dirname, '..', 'mcp.mjs');

// Send JSON-RPC messages to the MCP server, collect all responses
function mcpRequest(messages, { timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [MCP_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', chunk => { stdout += chunk; });
    proc.stderr.on('data', chunk => { stderr += chunk; });

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`MCP server timed out after ${timeout}ms. stderr: ${stderr}`));
    }, timeout);

    proc.on('close', () => {
      clearTimeout(timer);
      const responses = stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
      resolve(responses);
    });

    proc.on('error', reject);

    // Send init handshake + messages, then close stdin
    const init = JSON.stringify({
      jsonrpc: '2.0', id: 0, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } },
    });
    const initialized = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });

    const lines = [init, initialized, ...messages.map(m => JSON.stringify(m))].join('\n') + '\n';
    proc.stdin.write(lines);
    proc.stdin.end();
  });
}

// --- Server starts and responds ---

test('mcp: initialize returns server info', async () => {
  const responses = await mcpRequest([]);
  const initResp = responses.find(r => r.id === 0);
  assert.ok(initResp, 'should get init response');
  assert.strictEqual(initResp.result.serverInfo.name, 'downturn');
});

test('mcp: tools/list returns both tools', async () => {
  const responses = await mcpRequest([
    { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
  ]);
  const listResp = responses.find(r => r.id === 1);
  assert.ok(listResp?.result?.tools, 'should return tools');
  const names = listResp.result.tools.map(t => t.name);
  assert.ok(names.includes('url_to_markdown'), 'should have url_to_markdown');
  assert.ok(names.includes('html_to_markdown'), 'should have html_to_markdown');
});

test('mcp: tools/list includes output_dir parameter', async () => {
  const responses = await mcpRequest([
    { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
  ]);
  const listResp = responses.find(r => r.id === 1);
  for (const tool of listResp.result.tools) {
    assert.ok(tool.inputSchema.properties.output_dir, `${tool.name} should have output_dir`);
  }
});

// --- html_to_markdown (no network needed) ---

test('mcp: html_to_markdown returns markdown as text', async () => {
  const responses = await mcpRequest([
    {
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'html_to_markdown', arguments: { html: '<html><body><h1>Hello</h1><p>World</p></body></html>' } },
    },
  ]);
  const resp = responses.find(r => r.id === 1);
  assert.ok(!resp.result.isError, 'should not be an error');
  const text = resp.result.content[0].text;
  assert.ok(text.includes('Hello'), 'should contain title');
  assert.ok(text.includes('World'), 'should contain body text');
});

test('mcp: html_to_markdown with output_path writes file', async () => {
  const tmpFile = path.join(os.tmpdir(), `mcp-test-${Date.now()}.md`);
  try {
    const responses = await mcpRequest([
      {
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: {
          name: 'html_to_markdown',
          arguments: { html: '<html><body><h1>Test</h1><p>Content</p></body></html>', output_path: tmpFile },
        },
      },
    ]);
    const resp = responses.find(r => r.id === 1);
    assert.ok(!resp.result.isError, 'should not be an error');
    assert.ok(resp.result.content[0].text.includes('Wrote'), 'should confirm write');
    assert.ok(fs.existsSync(tmpFile), 'file should exist');
    const content = fs.readFileSync(tmpFile, 'utf8');
    assert.ok(content.includes('Test'), 'file should contain title');
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

test('mcp: html_to_markdown with output_dir auto-names from h1', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-'));
  try {
    const responses = await mcpRequest([
      {
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: {
          name: 'html_to_markdown',
          arguments: { html: '<html><body><h1>My Great Article</h1><p>Body</p></body></html>', output_dir: tmpDir },
        },
      },
    ]);
    const resp = responses.find(r => r.id === 1);
    assert.ok(!resp.result.isError, 'should not be an error');
    const expected = path.join(tmpDir, 'my-great-article.md');
    assert.ok(resp.result.content[0].text.includes(expected), `should write to ${expected}`);
    assert.ok(fs.existsSync(expected), 'auto-named file should exist');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('mcp: html_to_markdown with output_dir falls back to og:title', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-'));
  try {
    const html = '<html><head><meta property="og:title" content="OG Title Here"></head><body><p>No h1</p></body></html>';
    const responses = await mcpRequest([
      {
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: 'html_to_markdown', arguments: { html, output_dir: tmpDir } },
      },
    ]);
    const resp = responses.find(r => r.id === 1);
    assert.ok(!resp.result.isError, 'should not be an error');
    const expected = path.join(tmpDir, 'og-title-here.md');
    assert.ok(fs.existsSync(expected), 'should fall back to og:title for filename');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('mcp: html_to_markdown with output_dir falls back to <title>', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-'));
  try {
    const html = '<html><head><title>Title Tag Fallback</title></head><body><p>No h1 or og</p></body></html>';
    const responses = await mcpRequest([
      {
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: 'html_to_markdown', arguments: { html, output_dir: tmpDir } },
      },
    ]);
    const resp = responses.find(r => r.id === 1);
    assert.ok(!resp.result.isError, 'should not be an error');
    const expected = path.join(tmpDir, 'title-tag-fallback.md');
    assert.ok(fs.existsSync(expected), 'should fall back to <title> for filename');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('mcp: html_to_markdown with output_dir falls back to url slug', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-'));
  try {
    const html = '<html><body><p>No title anywhere</p></body></html>';
    const responses = await mcpRequest([
      {
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: {
          name: 'html_to_markdown',
          arguments: { html, url: 'https://example.com/blog/my-post', output_dir: tmpDir },
        },
      },
    ]);
    const resp = responses.find(r => r.id === 1);
    assert.ok(!resp.result.isError, 'should not be an error');
    const expected = path.join(tmpDir, 'my-post.md');
    assert.ok(fs.existsSync(expected), 'should fall back to URL slug for filename');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('mcp: html_to_markdown with output_dir falls back to "page" when no title or url', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-'));
  try {
    const html = '<html><body><p>Nothing</p></body></html>';
    const responses = await mcpRequest([
      {
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: 'html_to_markdown', arguments: { html, output_dir: tmpDir } },
      },
    ]);
    const resp = responses.find(r => r.id === 1);
    assert.ok(!resp.result.isError, 'should not be an error');
    const expected = path.join(tmpDir, 'page.md');
    assert.ok(fs.existsSync(expected), 'should fall back to "page.md"');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('mcp: output_path takes precedence over output_dir', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-'));
  const explicitPath = path.join(tmpDir, 'explicit-name.md');
  try {
    const responses = await mcpRequest([
      {
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: {
          name: 'html_to_markdown',
          arguments: {
            html: '<html><body><h1>Auto Name</h1><p>Body</p></body></html>',
            output_path: explicitPath,
            output_dir: tmpDir,
          },
        },
      },
    ]);
    const resp = responses.find(r => r.id === 1);
    assert.ok(!resp.result.isError, 'should not be an error');
    assert.ok(fs.existsSync(explicitPath), 'output_path should win');
    const autoPath = path.join(tmpDir, 'auto-name.md');
    assert.ok(!fs.existsSync(autoPath), 'output_dir auto-name should NOT be created');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// --- Error handling ---

test('mcp: missing required parameter returns error', async () => {
  const responses = await mcpRequest([
    {
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'html_to_markdown', arguments: {} },
    },
  ]);
  const resp = responses.find(r => r.id === 1);
  assert.ok(resp.error, 'should return an error');
  assert.ok(resp.error.message.includes('html'), 'error should mention missing param');
});

test('mcp: unknown tool returns error', async () => {
  const responses = await mcpRequest([
    {
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'nonexistent_tool', arguments: {} },
    },
  ]);
  const resp = responses.find(r => r.id === 1);
  assert.ok(resp.error, 'should return an error');
});
