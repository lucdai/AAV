#!/usr/bin/env python3
"""
Automatic Changelog Generator for AAV
Fetches commits from GitHub and generates a changelog.json file
This script can be run manually or scheduled via GitHub Actions
"""

import json
import subprocess
from datetime import datetime
from typing import List, Dict, Any
import os
import sys

GITHUB_REPO = 'lucdai/AAV'
GITHUB_API_URL = f'https://api.github.com/repos/{GITHUB_REPO}'

def fetch_commits_via_git() -> List[Dict[str, Any]]:
    """Fetch commits using git command (works locally)"""
    try:
        # Get all commits with formatted output
        result = subprocess.run(
            ['git', 'log', '--pretty=format:%H%n%an%n%ae%n%ad%n%s%n%b%n---END---', 
             '--date=iso', '--all'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        if result.returncode != 0:
            return []
        
        commits = []
        lines = result.stdout.strip().split('\n')
        
        i = 0
        while i < len(lines):
            if i + 4 < len(lines):
                sha = lines[i]
                author = lines[i + 1]
                email = lines[i + 2]
                date_str = lines[i + 3]
                message = lines[i + 4]
                
                # Skip to next commit marker
                i += 5
                body = []
                while i < len(lines) and lines[i] != '---END---':
                    body.append(lines[i])
                    i += 1
                
                # Parse date
                try:
                    commit_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                except:
                    commit_date = datetime.now()
                
                commits.append({
                    'sha': sha[:7],
                    'message': message,
                    'author': author,
                    'email': email,
                    'date': commit_date.isoformat(),
                    'body': '\n'.join(body).strip(),
                    'url': f'https://github.com/{GITHUB_REPO}/commit/{sha}'
                })
            
            i += 1
        
        return commits
    except Exception as e:
        print(f"Error fetching commits via git: {e}", file=sys.stderr)
        return []

def fetch_commits_via_api() -> List[Dict[str, Any]]:
    """Fetch commits using GitHub API (works without local git)"""
    try:
        import urllib.request
        import urllib.error
        
        commits = []
        page = 1
        
        while page <= 5:  # Limit to 5 pages (250 commits)
            url = f'{GITHUB_API_URL}/commits?per_page=50&page={page}'
            
            try:
                with urllib.request.urlopen(url) as response:
                    data = json.loads(response.read().decode())
                    
                    if not data:
                        break
                    
                    for commit in data:
                        commits.append({
                            'sha': commit['sha'][:7],
                            'message': commit['commit']['message'].split('\n')[0],
                            'author': commit['commit']['author']['name'],
                            'email': commit['commit']['author']['email'],
                            'date': commit['commit']['author']['date'],
                            'body': '\n'.join(commit['commit']['message'].split('\n')[1:]).strip(),
                            'url': commit['html_url']
                        })
                    
                    page += 1
            except urllib.error.HTTPError as e:
                if e.code == 403:
                    print("GitHub API rate limit reached", file=sys.stderr)
                break
        
        return commits
    except Exception as e:
        print(f"Error fetching commits via API: {e}", file=sys.stderr)
        return []

def group_commits_by_date(commits: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Group commits by date"""
    grouped = {}
    
    for commit in commits:
        try:
            # Parse ISO format date
            date_obj = datetime.fromisoformat(commit['date'].replace('Z', '+00:00'))
            date_key = date_obj.strftime('%Y-%m-%d')
        except:
            date_key = 'Unknown'
        
        if date_key not in grouped:
            grouped[date_key] = []
        
        grouped[date_key].append(commit)
    
    return grouped

def categorize_commits(commits: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Categorize commits by type based on commit message"""
    categories = {
        'Features': [],
        'Bug Fixes': [],
        'Improvements': [],
        'Documentation': [],
        'Other': []
    }
    
    for commit in commits:
        message = commit['message'].lower()
        
        if any(word in message for word in ['feat:', 'feature', 'add', 'new']):
            categories['Features'].append(commit)
        elif any(word in message for word in ['fix:', 'bug', 'fixed', 'resolve']):
            categories['Bug Fixes'].append(commit)
        elif any(word in message for word in ['improve', 'refactor', 'optimize', 'perf']):
            categories['Improvements'].append(commit)
        elif any(word in message for word in ['doc:', 'docs', 'readme', 'documentation']):
            categories['Documentation'].append(commit)
        else:
            categories['Other'].append(commit)
    
    # Remove empty categories
    return {k: v for k, v in categories.items() if v}

def generate_changelog_json(commits: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate changelog in JSON format"""
    grouped = group_commits_by_date(commits)
    
    changelog = {
        'generated_at': datetime.now().isoformat(),
        'total_commits': len(commits),
        'repository': GITHUB_REPO,
        'entries': []
    }
    
    # Sort dates in reverse order (newest first)
    for date in sorted(grouped.keys(), reverse=True):
        date_commits = grouped[date]
        categorized = categorize_commits(date_commits)
        
        entry = {
            'date': date,
            'commit_count': len(date_commits),
            'categories': {}
        }
        
        for category, category_commits in categorized.items():
            entry['categories'][category] = [
                {
                    'sha': commit['sha'],
                    'message': commit['message'],
                    'author': commit['author'],
                    'url': commit['url']
                }
                for commit in category_commits
            ]
        
        changelog['entries'].append(entry)
    
    return changelog

def save_changelog(changelog: Dict[str, Any], filename: str = 'changelog.json'):
    """Save changelog to JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(changelog, f, ensure_ascii=False, indent=2)
        print(f"Changelog saved to {filename}")
        return True
    except Exception as e:
        print(f"Error saving changelog: {e}", file=sys.stderr)
        return False

def main():
    """Main function"""
    print("Fetching commits from GitHub...")
    
    # Try to fetch commits via git first, fall back to API
    commits = fetch_commits_via_git()
    
    if not commits:
        print("Falling back to GitHub API...")
        commits = fetch_commits_via_api()
    
    if not commits:
        print("Error: Could not fetch commits from GitHub", file=sys.stderr)
        sys.exit(1)
    
    print(f"Found {len(commits)} commits")
    
    # Generate changelog
    changelog = generate_changelog_json(commits)
    
    # Save changelog
    if save_changelog(changelog):
        print("Changelog generated successfully!")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == '__main__':
    main()
