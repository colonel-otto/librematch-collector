#!/usr/bin/env python3
"""
Simple Python GraphQL client for librematch
Shows how to query data and format for Discord
"""

import requests
import json
from datetime import datetime

class LibrematchClient:
    def __init__(self, url="http://localhost:3335/graphql"):
        self.url = url
        
    def query(self, query, variables=None):
        """Execute GraphQL query"""
        response = requests.post(
            self.url,
            json={'query': query, 'variables': variables or {}}
        )
        return response.json()['data']
    
    def get_match(self, match_id):
        """Get match with all details"""
        query = """
        query($matchId: Float!) {
          match(match_id: $matchId) {
            match_id
            name
            started
            finished
            map_type
            leaderboard_id
            players {
              profile_id
              name
              rating
              civ
              won
              team
              color
            }
          }
        }
        """
        return self.query(query, {'matchId': match_id})['match']
    
    def get_lobbies(self):
        """Get current lobbies"""
        query = """
        query {
          lobbies {
            match_id
            name
            num_slots
            num_players
            average_rating
            map_name
            created
          }
        }
        """
        return self.query(query)['lobbies']
    
    def format_match_for_discord(self, match):
        """Convert match data to Discord embed format"""
        
        # Group by teams
        teams = {}
        for player in match['players']:
            team = player['team'] or 'FFA'
            if team not in teams:
                teams[team] = []
            teams[team].append(player)
        
        # Build embed
        embed = {
            'title': f"Match {match['match_id']}",
            'description': match['name'],
            'color': 0x0099ff,  # Blue
            'fields': [],
            'timestamp': match['started']
        }
        
        # Add team fields
        for team, players in teams.items():
            player_strings = []
            for p in players:
                win_indicator = "✅" if p['won'] else "❌" if p['won'] is False else "⏳"
                player_strings.append(
                    f"{win_indicator} {p['name']} ({p['rating'] or 'Unranked'})"
                )
            
            embed['fields'].append({
                'name': f'Team {team}' if team != 'FFA' else 'Free For All',
                'value': '\n'.join(player_strings),
                'inline': True
            })
        
        # Add match info
        if match['finished']:
            start = datetime.fromisoformat(match['started'].replace('Z', ''))
            end = datetime.fromisoformat(match['finished'].replace('Z', ''))
            duration = str(end - start).split('.')[0]
            embed['fields'].append({
                'name': 'Duration',
                'value': duration,
                'inline': True
            })
        
        return embed

# Example usage
if __name__ == "__main__":
    client = LibrematchClient()
    
    # Get a match
    match = client.get_match(180272347)
    embed = client.format_match_for_discord(match)
    print("Discord Embed:")
    print(json.dumps(embed, indent=2))
    
    # Get lobbies
    print("\n\nCurrent Lobbies:")
    lobbies = client.get_lobbies()
    for lobby in lobbies[:5]:
        print(f"- {lobby['name']} ({lobby['num_players']}/{lobby['num_slots']} players)")