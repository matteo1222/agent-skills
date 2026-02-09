#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".trellocli");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const API_BASE = "https://api.trello.com/1";

// ─── Config Management ───────────────────────────────────────────────────────

function loadConfig() {
	if (!existsSync(CONFIG_FILE)) return {};
	return JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
}

function saveConfig(config) {
	if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
	writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getCredentials() {
	const config = loadConfig();
	if (!config.apiKey || !config.token) {
		console.error("Not configured. Run: trello config --key <key> --token <token>");
		process.exit(1);
	}
	return { key: config.apiKey, token: config.token };
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function api(endpoint, method = "GET", body = null) {
	const { key, token } = getCredentials();
	const sep = endpoint.includes("?") ? "&" : "?";
	const url = `${API_BASE}${endpoint}${sep}key=${key}&token=${token}`;

	const options = {
		method,
		headers: { "Content-Type": "application/json" },
	};
	if (body) options.body = JSON.stringify(body);

	const res = await fetch(url, options);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`API ${res.status}: ${text}`);
	}
	return res.json();
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function cmdConfig(args) {
	const keyIdx = args.indexOf("--key");
	const tokenIdx = args.indexOf("--token");

	if (keyIdx === -1 && tokenIdx === -1) {
		const config = loadConfig();
		if (config.apiKey) {
			console.log(`API Key: ${config.apiKey.slice(0, 8)}...`);
			console.log(`Token: ${config.token ? config.token.slice(0, 8) + "..." : "(not set)"}`);
		} else {
			console.log("Not configured.");
			console.log("\nSetup:");
			console.log("  1. Get API key: https://trello.com/power-ups/admin");
			console.log("  2. Generate token with the link shown on that page");
			console.log("  3. Run: trello config --key <key> --token <token>");
		}
		return;
	}

	const config = loadConfig();
	if (keyIdx !== -1 && args[keyIdx + 1]) config.apiKey = args[keyIdx + 1];
	if (tokenIdx !== -1 && args[tokenIdx + 1]) config.token = args[tokenIdx + 1];
	saveConfig(config);
	console.log("Config saved to ~/.trellocli/config.json");
}

async function cmdBoards() {
	const boards = await api("/members/me/boards?fields=name,url,closed");
	const open = boards.filter((b) => !b.closed);
	if (open.length === 0) {
		console.log("No boards found.");
		return;
	}
	console.log("Boards:\n");
	for (const b of open) {
		console.log(`  ${b.id}  ${b.name}`);
	}
}

async function cmdLists(boardId) {
	if (!boardId) {
		console.error("Usage: trello lists <boardId>");
		process.exit(1);
	}
	const lists = await api(`/boards/${boardId}/lists?fields=name,closed`);
	const open = lists.filter((l) => !l.closed);
	console.log("Lists:\n");
	for (const l of open) {
		console.log(`  ${l.id}  ${l.name}`);
	}
}

async function cmdCards(listId, args) {
	if (!listId) {
		console.error("Usage: trello cards <listId>");
		process.exit(1);
	}
	const cards = await api(`/lists/${listId}/cards?fields=name,desc,labels,due,idMembers`);
	if (cards.length === 0) {
		console.log("No cards in this list.");
		return;
	}
	console.log("Cards:\n");
	for (const c of cards) {
		const labels = c.labels.map((l) => l.name || l.color).join(", ");
		const due = c.due ? ` [due: ${c.due.slice(0, 10)}]` : "";
		console.log(`  ${c.id}  ${c.name}${due}`);
		if (labels) console.log(`           labels: ${labels}`);
	}
}

async function cmdCard(cardId) {
	if (!cardId) {
		console.error("Usage: trello card <cardId>");
		process.exit(1);
	}
	const c = await api(`/cards/${cardId}?fields=name,desc,labels,due,idList,url,badges`);
	console.log(`Name: ${c.name}`);
	console.log(`ID: ${c.id}`);
	console.log(`List: ${c.idList}`);
	console.log(`URL: ${c.url}`);
	if (c.due) console.log(`Due: ${c.due}`);
	if (c.labels.length) {
		console.log(`Labels: ${c.labels.map((l) => l.name || l.color).join(", ")}`);
	}
	if (c.badges?.attachments > 0) {
		console.log(`Attachments: ${c.badges.attachments} (use: trello attachments ${c.id})`);
	}
	if (c.desc) console.log(`\nDescription:\n${c.desc}`);
}

async function cmdAttachments(cardId) {
	if (!cardId) {
		console.error("Usage: trello attachments <cardId>");
		process.exit(1);
	}
	const attachments = await api(`/cards/${cardId}/attachments`);
	if (attachments.length === 0) {
		console.log("No attachments on this card.");
		return;
	}
	console.log("Attachments:\n");
	for (const a of attachments) {
		const isImage = a.mimeType?.startsWith("image/") ? " [image]" : "";
		console.log(`  ${a.id}  ${a.name}${isImage}`);
		console.log(`         ${a.url}`);
	}
}

async function cmdDownload(attachmentId, args) {
	if (!attachmentId) {
		console.error("Usage: trello download <attachmentId> [--out <path>]");
		process.exit(1);
	}

	const cardIdx = args.indexOf("--card");
	if (cardIdx === -1 || !args[cardIdx + 1]) {
		console.error("--card <cardId> is required to download attachments");
		process.exit(1);
	}
	const cardId = args[cardIdx + 1];

	const attachments = await api(`/cards/${cardId}/attachments`);
	const attachment = attachments.find((a) => a.id === attachmentId);
	if (!attachment) {
		console.error("Attachment not found on this card.");
		process.exit(1);
	}

	const outIdx = args.indexOf("--out");
	const outPath = outIdx !== -1 && args[outIdx + 1] ? args[outIdx + 1] : attachment.name;

	const { key, token } = getCredentials();

	// Try multiple download methods
	const methods = [
		// Method 1: API download endpoint with query params
		`${API_BASE}/cards/${cardId}/attachments/${attachmentId}/download/${encodeURIComponent(attachment.name)}?key=${key}&token=${token}`,
		// Method 2: Direct URL with query params
		`${attachment.url}?key=${key}&token=${token}`,
		// Method 3: Direct URL (for public attachments)
		attachment.url,
	];

	let lastError;
	for (const url of methods) {
		try {
			const res = await fetch(url, {
				redirect: "follow",
				headers: {
					Authorization: `OAuth oauth_consumer_key="${key}", oauth_token="${token}"`,
				},
			});
			if (res.ok) {
				const buffer = Buffer.from(await res.arrayBuffer());
				if (buffer.length > 100) {
					// Likely a real file, not an error message
					writeFileSync(outPath, buffer);
					console.log(`Downloaded: ${outPath} (${buffer.length} bytes)`);
					return;
				}
			}
			lastError = `HTTP ${res.status}`;
		} catch (e) {
			lastError = e.message;
		}
	}

	// If all methods failed, show the URL for manual download
	console.error(`Auto-download failed: ${lastError}`);
	console.log(`\nManual download URL (open in browser while logged into Trello):`);
	console.log(attachment.url);
}

async function cmdAdd(listId, args) {
	if (!listId) {
		console.error("Usage: trello add <listId> --name <name> [--desc <desc>] [--due <date>]");
		process.exit(1);
	}

	const nameIdx = args.indexOf("--name");
	const descIdx = args.indexOf("--desc");
	const dueIdx = args.indexOf("--due");

	if (nameIdx === -1 || !args[nameIdx + 1]) {
		console.error("--name is required");
		process.exit(1);
	}

	const body = {
		idList: listId,
		name: args[nameIdx + 1],
	};
	if (descIdx !== -1 && args[descIdx + 1]) body.desc = args[descIdx + 1];
	if (dueIdx !== -1 && args[dueIdx + 1]) body.due = args[dueIdx + 1];

	const card = await api("/cards", "POST", body);
	console.log(`Created card: ${card.id}`);
	console.log(`Name: ${card.name}`);
	console.log(`URL: ${card.url}`);
}

async function cmdMove(cardId, args) {
	if (!cardId) {
		console.error("Usage: trello move <cardId> --list <listId> [--pos top|bottom]");
		process.exit(1);
	}

	const listIdx = args.indexOf("--list");
	const posIdx = args.indexOf("--pos");

	if (listIdx === -1 || !args[listIdx + 1]) {
		console.error("--list is required");
		process.exit(1);
	}

	const body = { idList: args[listIdx + 1] };
	if (posIdx !== -1 && args[posIdx + 1]) body.pos = args[posIdx + 1];

	const card = await api(`/cards/${cardId}`, "PUT", body);
	console.log(`Moved "${card.name}" to list ${card.idList}`);
}

async function cmdSearch(query, args) {
	if (!query) {
		console.error("Usage: trello search <query> [--board <boardId>]");
		process.exit(1);
	}

	const boardIdx = args.indexOf("--board");
	let endpoint = `/search?query=${encodeURIComponent(query)}&modelTypes=cards&cards_limit=25`;
	if (boardIdx !== -1 && args[boardIdx + 1]) {
		endpoint += `&idBoards=${args[boardIdx + 1]}`;
	}

	const result = await api(endpoint);
	const cards = result.cards || [];
	if (cards.length === 0) {
		console.log("No cards found.");
		return;
	}

	console.log(`Found ${cards.length} card(s):\n`);
	for (const c of cards) {
		console.log(`  ${c.id}  ${c.name}`);
		if (c.desc) console.log(`           ${c.desc.slice(0, 80)}${c.desc.length > 80 ? "..." : ""}`);
	}
}

async function cmdUpdate(cardId, args) {
	if (!cardId) {
		console.error("Usage: trello update <cardId> [--name <name>] [--desc <desc>] [--due <date>] [--closed true|false]");
		process.exit(1);
	}

	const body = {};
	const nameIdx = args.indexOf("--name");
	const descIdx = args.indexOf("--desc");
	const dueIdx = args.indexOf("--due");
	const closedIdx = args.indexOf("--closed");

	if (nameIdx !== -1 && args[nameIdx + 1]) body.name = args[nameIdx + 1];
	if (descIdx !== -1 && args[descIdx + 1]) body.desc = args[descIdx + 1];
	if (dueIdx !== -1 && args[dueIdx + 1]) body.due = args[dueIdx + 1];
	if (closedIdx !== -1 && args[closedIdx + 1]) body.closed = args[closedIdx + 1] === "true";

	if (Object.keys(body).length === 0) {
		console.error("No updates specified.");
		process.exit(1);
	}

	const card = await api(`/cards/${cardId}`, "PUT", body);
	console.log(`Updated: ${card.name}`);
}

async function cmdArchive(cardId) {
	if (!cardId) {
		console.error("Usage: trello archive <cardId>");
		process.exit(1);
	}
	const card = await api(`/cards/${cardId}`, "PUT", { closed: true });
	console.log(`Archived: ${card.name}`);
}

async function cmdLabels(boardId) {
	if (!boardId) {
		console.error("Usage: trello labels <boardId>");
		process.exit(1);
	}
	const labels = await api(`/boards/${boardId}/labels`);
	console.log("Labels:\n");
	for (const l of labels) {
		console.log(`  ${l.id}  ${l.color.padEnd(8)} ${l.name || "(no name)"}`);
	}
}

// ─── Help ────────────────────────────────────────────────────────────────────

function showHelp() {
	console.log(`Trello CLI - Manage boards, lists, and cards

Usage: trello <command> [args] [options]

Commands:
  config                         Show or set API credentials
    --key <key>                  Set API key
    --token <token>              Set API token

  boards                         List all boards

  lists <boardId>                List lists in a board

  cards <listId>                 List cards in a list

  card <cardId>                  Show card details

  add <listId>                   Create a new card
    --name <name>                Card name (required)
    --desc <description>         Card description
    --due <date>                 Due date (ISO format)

  move <cardId>                  Move card to another list
    --list <listId>              Target list (required)
    --pos top|bottom             Position in list

  update <cardId>                Update card properties
    --name <name>                New name
    --desc <description>         New description
    --due <date>                 New due date

  archive <cardId>               Archive a card

  search <query>                 Search for cards
    --board <boardId>            Limit to specific board

  labels <boardId>               List labels on a board

  attachments <cardId>           List attachments on a card

  download <attachmentId>        Download an attachment
    --card <cardId>              Card the attachment belongs to (required)
    --out <path>                 Output file path (default: attachment name)

Examples:
  trello boards
  trello lists 5f1234567890abcdef123456
  trello cards 5f1234567890abcdef123456
  trello add 5f1234567890abcdef123456 --name "New task" --desc "Details here"
  trello move 5f1234567890abcdef123456 --list 5f9876543210fedcba654321
  trello search "bug fix"
`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const cmd = args[0];
const rest = args.slice(1);

if (!cmd || cmd === "-h" || cmd === "--help" || cmd === "help") {
	showHelp();
	process.exit(0);
}

try {
	switch (cmd) {
		case "config":
			await cmdConfig(rest);
			break;
		case "boards":
			await cmdBoards();
			break;
		case "lists":
			await cmdLists(rest[0]);
			break;
		case "cards":
			await cmdCards(rest[0], rest.slice(1));
			break;
		case "card":
			await cmdCard(rest[0]);
			break;
		case "add":
			await cmdAdd(rest[0], rest.slice(1));
			break;
		case "move":
			await cmdMove(rest[0], rest.slice(1));
			break;
		case "update":
			await cmdUpdate(rest[0], rest.slice(1));
			break;
		case "archive":
			await cmdArchive(rest[0]);
			break;
		case "search":
			await cmdSearch(rest[0], rest.slice(1));
			break;
		case "labels":
			await cmdLabels(rest[0]);
			break;
		case "attachments":
			await cmdAttachments(rest[0]);
			break;
		case "download":
			await cmdDownload(rest[0], rest.slice(1));
			break;
		default:
			console.error(`Unknown command: ${cmd}`);
			console.error("Run 'trello --help' for usage.");
			process.exit(1);
	}
} catch (e) {
	console.error(`Error: ${e.message}`);
	process.exit(1);
}
