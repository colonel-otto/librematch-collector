# Libre:Match Collector - Setup and Configuration Changelog

## Date: June 2, 2025

### Prerequisites Setup

1. **Steam Auth Proxy Installation**
   - Cloned and installed librematch-steam_auth from https://github.com/colonel-otto/librematch-steam_auth.git
   - Installed dependencies using `uv sync`
   - Configured `/home/mini/projects/librematch-steam_auth/.env` with Steam credentials
   - Set up API keys in `/home/mini/projects/librematch-steam_auth/poc_steam_proxy/api_keys.json`:
     ```json
     {
       "dev1": "DEV1_API_KEY",
       "dev2": "DEV2_API_KEY"
     }
     ```
   - Steam auth proxy runs on port 5000: `http://127.0.0.1:5000/relic`

### Database Management

2. **pgAdmin Installation**
   - Installed pgAdmin4 via Docker: `docker run -d --name pgadmin --network host -e PGADMIN_DEFAULT_EMAIL=admin@admin.com -e PGADMIN_DEFAULT_PASSWORD=admin -e PGADMIN_LISTEN_PORT=5050 dpage/pgadmin4`
   - Opened firewall port: `sudo ufw allow 5050/tcp`
   - Access URL: http://192.168.1.10:5050
   - Login credentials:
     - Email: admin@admin.com
     - Password: admin
   - PostgreSQL connection details:
     - Host: 127.0.0.1
     - Port: 5432
     - Database: librematch
     - Username: postgres
     - Password: postgres

### Collector Configuration Fixes

3. **API Integration Corrections**
   - Fixed API key header in `/home/mini/projects/librematch-collector/collector/src/helper/util.ts`:
     - Changed from `apikey: apiKey` to `api_key: apiKey` (2 occurrences)
   - Updated `.env` file:
     - Changed `PROXY_URL` from port 3337 to 5000: `PROXY_URL="http://127.0.0.1:5000/relic"`
     - Changed `PROXY_API_KEY` from "DEV_API_KEY" to "DEV1_API_KEY"

4. **appBinaryChecksum Updates**
   - Initial issue: appBinaryChecksum was not being passed in API calls
   - Added to database: `INSERT INTO setting (component, key, value) VALUES ('global', 'appBinaryChecksum', '83607')`
   - Fixed null overwrite issue in `/home/mini/projects/librematch-collector/collector/src/task/ongoing.task.ts`:
     ```typescript
     async updateSettings() {
         const settings = (await this.prisma.setting.findMany({ where: { component: 'global' } }));
         const appBinaryChecksum = parseIntNullable(settings.find(s => s.key === 'appBinaryChecksum')?.value);
         if (appBinaryChecksum !== null) {
             patchApiConfig({
                 appBinaryChecksum: appBinaryChecksum,
             });
         }
     }
     ```
   - Updated appBinaryChecksum to latest value (145651): `UPDATE setting SET value = '145651' WHERE component = 'global' AND key = 'appBinaryChecksum'`
   - Note: appBinaryChecksum changes with each Age of Empires update

### Service Management

5. **Docker Services**
   - Started Redis container: `sudo docker compose up -d redis`
   - PostgreSQL and Redis must be running for collectors to work

6. **Running Collectors**
   - Must use `NODE_OPTIONS=--openssl-legacy-provider` due to Node.js v22 compatibility with older webpack
   - Port assignments to avoid conflicts:
     - Match collector: Default port 3339
     - Ongoing collector: Port 3340 (`PORT=3340 NODE_OPTIONS=--openssl-legacy-provider yarn ongoing`)
     - Lobby collector: Port 3341 (`PORT=3341 NODE_OPTIONS=--openssl-legacy-provider yarn lobby`)
   
   Example commands:
   ```bash
   # Match collector (processes completed matches)
   NODE_OPTIONS=--openssl-legacy-provider yarn match
   
   # Ongoing collector (monitors active matches)
   PORT=3340 NODE_OPTIONS=--openssl-legacy-provider yarn ongoing
   
   # Lobby collector (monitors game lobbies)
   PORT=3341 NODE_OPTIONS=--openssl-legacy-provider yarn lobby
   ```

### How the System Works

7. **Data Flow**
   - The `ongoing` task fetches observable matches from Relic API via steam-auth proxy
   - When matches are found, they're added to the `match_pending` table
   - The `match` task processes entries from `match_pending` table
   - Completed match data is stored in the `match` and `player` tables
   - The collectors will show "0 matches" when no games are currently active (normal behavior)

### Important Notes
- The steam-auth proxy must be running before starting collectors
- Each collector type serves a specific purpose and should run on different ports
- appBinaryChecksum must be updated when Age of Empires receives updates
- All API requests go through the steam-auth proxy which handles Steam authentication



### Summary

The librematch-collector gets its data from multiple Age of Empires 2 APIs:

  Primary sources:
  - Relic Link/World's Edge APIs for matches, profiles, and leaderboards
  - AoE2 Companion API for match data
  - Steam API for player profiles and statistics

  Collection methods:
  - Task-based polling system (matches, leaderboards, lobbies, profiles)
  - Real-time monitoring of ongoing matches
  - Event-driven updates via Redis PubSub

  Data types collected:
  - Match histories and live games
  - Player profiles and rankings
  - Leaderboard standings
  - Active game lobbies
  - Steam player counts

  The /community/ endpoint you highlighted appears to be part of the
  community API integration for fetching community-specific match data.

> Give me a more indepth analaysis, what endpoitns are being watched, how 
  often is the polling, is all data being stored in the postgres database?
  ⎿ ⧉ Selected 1 lines from librematch-collector/graph/src/helper/civs.ts in 
    Visual Studio Code

● I'll provide a comprehensive deep-dive analysis of the
  librematch-collector's data collection mechanisms.

● Task(Deep analysis of endpoints and polling)…
  ⎿  Done (25 tool uses · 67.5k tokens · 3m 15.0s)

● In-Depth Analysis of librematch-collector

  API Endpoints Being Watched

  Relic/World's Edge APIs:
  - /game/Leaderboard/getRecentMatchHistory - Player match histories
  - /game/account/getProfileName - Player profile names
  - /community/external/proxysteamuserrequest - Steam profile data
  - /game/Leaderboard/getLeaderBoard - Leaderboard rankings
  - /game/advertisement/findAdvertisements - Active lobbies
  - /game/advertisement/findObservableAdvertisements - Observable matches

  Community API (aoe-api.worldsedgelink.com):
  - /community/leaderboard/getLeaderBoard2 - Enhanced leaderboard data
  - /community/leaderboard/getRecentMatchHistory - Match histories

  External APIs:
  - function.aoe2companion.com/api/matches - AoE2 Companion match data
  - steamplayercount.com/api/813780 - Steam player statistics

  Polling Frequencies

  - Matches: 1 second continuous polling
  - Lobbies: 10 seconds (or immediate if >100 items)
  - Ongoing matches: 30 seconds (or immediate if >100 items)
  - Leaderboards: 60 seconds
  - Profiles: 60 seconds for missing names, 10s between chunks
  - Verified players: Every hour (cron)

  PostgreSQL Database Storage

  Everything is stored in PostgreSQL:
  - match - Complete match records with all game settings
  - match_raw - Raw JSON for reprocessing with version tracking
  - player - Player participation records (many-to-many)
  - profile - Player profiles with Steam integration
  - leaderboard_row - Current rankings per leaderboard
  - rating - Historical rating changes per match
  - match_pending - Queue for matches to fetch

  Additional storage layers:
  - Redis Cache: Lobbies, ongoing matches, leaderboard counts (12000s TTL)
  - Redis Streams: Real-time lobby/match updates (MAXLEN 10)
  - External KV Store: Redundant storage for critical data

  Data Processing Flow

  1. Fetch → Raw API response
  2. Parse → Transform to normalized structure
  3. Enrich → Add ratings, names, images, colors
  4. Diff → Generate add/update/remove events
  5. Store → Upsert to PostgreSQL
  6. Stream → Publish to Redis for real-time updates
  7. Cache → Store frequently accessed data

  The system maintains complet

   Prisma in librematch-collector

  Prisma is an ORM (Object-Relational Mapping) tool that provides
  type-safe database access. In this project:

  1. Database Schema (/domain/schema.prisma):
    - match - Game matches with settings, timestamps
    - player - Links players to matches (many-to-many)
    - profile - Player profiles with Steam integration
    - leaderboard_row - Current rankings
    - rating - Historical ratings
    - match_pending - Processing queue
  2. Usage Pattern:
  // Type-safe queries
  await prisma.match.create({ data: {...} })
  await prisma.profile.findMany({ where: {...} })
  3. Commands:
  yarn prisma:gen        # Generate client after schema changes
  yarn prisma:migrate    # Run migrations
  yarn prisma:db:pull    # Pull schema from database
