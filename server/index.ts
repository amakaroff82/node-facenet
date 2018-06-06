#!/usr/bin/env ts-node

import { FNServer } from './express-server';

async function main() {
  new FNServer();
}

main().catch(console.error)
