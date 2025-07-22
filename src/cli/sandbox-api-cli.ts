#!/usr/bin/env ts-node
import axios from 'axios';

const API_URL = process.env.SANDBOX_API_URL || 'http://localhost:3001';
const TOKEN = process.env.SANDBOX_API_TOKEN || '';

function printHelp() {
  console.log(`Sandbox API CLI

Usage:
  sandbox-api-cli <command> [options]

Commands:
  sandbox list                 List sandboxes
  sandbox create <name>        Create a new sandbox
  sandbox delete <id>          Delete a sandbox
  ci-token list                List CI tokens
  ci-token create <desc>       Create a CI token
  ci-token revoke <token>      Revoke a CI token
  help                         Show this help message

Environment variables:
  SANDBOX_API_URL   Base URL of the API (default: http://localhost:3001)
  SANDBOX_API_TOKEN Bearer token for authentication
`);
}


async function main() {
  const [,, cmd, ...args] = process.argv;
  if (!cmd || cmd === 'help') return printHelp();
  const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
  try {
    if (cmd === 'sandbox') {
      const sub = args[0];
      if (sub === 'list') {
        const res = await axios.get(`${API_URL}/sandbox`, { headers });
        console.log(res.data);
      } else if (sub === 'create') {
        const name = args[1];
        if (!name) return console.error('Sandbox name required');
        const res = await axios.post(`${API_URL}/sandbox`, { name }, { headers });
        console.log(res.data);
      } else if (sub === 'delete') {
        const id = args[1];
        if (!id) return console.error('Sandbox ID required');
        const res = await axios.delete(`${API_URL}/sandbox/${id}`, { headers });
        console.log(res.data);
      } else {
        printHelp();
      }
    } else if (cmd === 'ci-token') {
      const sub = args[0];
      if (sub === 'list') {
        const res = await axios.get(`${API_URL}/ci-tokens`, { headers });
        console.log(res.data);
      } else if (sub === 'create') {
        const desc = args[1] || '';
        const res = await axios.post(`${API_URL}/ci-tokens`, { description: desc }, { headers });
        console.log(res.data);
      } else if (sub === 'revoke') {
        const token = args[1];
        if (!token) return console.error('Token required');
        const res = await axios.delete(`${API_URL}/ci-tokens`, { headers, data: { token } } as any);
        console.log(res.data);
      } else {
        printHelp();
      }
    } else {
      printHelp();
    }
  } catch (err: any) {
    if (err.response) {
      console.error('Error:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

main(); 