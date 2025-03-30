# YouTube Link Bot for Slack - Project Specification

## Overview
A Slack bot that monitors specified channels for YouTube links, checks if they exist in the designated YouTube playlists, and if not, adds them to the appropriate playlist. The bot also notifies a designated Slack channel when new YouTube content is added.

## Core Requirements

### 1. Slack Integration
- Bot must be able to monitor specified Slack channels
- Bot must be able to detect YouTube links in messages
- Bot must be able to post notifications to a designated notification channel
- Bot must handle Slack authentication and permissions

### 2. YouTube Integration
- Bot must be able to check if a video exists in the designated YouTube playlists
- Bot must be able to add new videos to the appropriate YouTube playlist
- Bot must handle YouTube API authentication and permissions
- Bot must support multiple playlists:
  - "Aucklandia" playlist for general videos
  - "Aucklandia Music" playlist for music (future implementation)

### 3. Link Detection
- Bot must identify YouTube links in various formats:
  - Standard YouTube URLs (youtube.com/watch?v=...)
  - Short YouTube URLs (youtu.be/...)
  - YouTube Music URLs (music.youtube.com/...)
- Bot should handle both direct links and links within message text

### 4. Notification System
- When a new video is added to a YouTube playlist:
  - Post a notification to the designated Slack channel
  - Include relevant information (video title, link, which playlist it was added to, who posted it originally)

## Technical Architecture

### 1. Technology Stack
- Backend: Node.js with Express
- Database: MongoDB (for storing processed links and video metadata)
- Deployment: Render
- APIs:
  - Slack Bolt Framework
  - YouTube Data API v3

### 2. Core Components
- Slack Event Listener
- YouTube API Client
- Link Parser
- Notification Service
- Database Service

### 3. Data Storage
- Store processed YouTube links to prevent duplicate processing
- Store video metadata for reference
- Store configuration settings
- Store playlist information and mappings

## Security and Privacy Considerations

### Public Repository Guidelines
- All sensitive information must be stored in environment variables:
  - Slack Bot Token
  - Slack Signing Secret
  - YouTube API Key
  - YouTube Channel ID
  - MongoDB Connection String
  - Any other API keys or secrets

### Environment Variables
- Create a `.env.example` file in the repository with placeholder values
- Add `.env` to `.gitignore`
- Document all required environment variables in the README
- Never commit actual `.env` files or any files containing real credentials

### Code Security
- No hardcoded credentials or secrets in any code files
- No API keys or tokens in comments or documentation
- Use environment variable validation on application startup
- Implement proper error handling that doesn't expose sensitive information

### Documentation Security
- Keep sensitive URLs and endpoints generic in documentation
- Use placeholder values in examples
- Document security best practices for setting up the application

## Deployment
- Containerized application
- Environment configuration on Render
- Monitoring and logging setup
- Backup and recovery procedures

## Future Enhancements
- Support for multiple YouTube channels
- Custom notification message formatting
- Analytics tracking
- User feedback system
- Automatic music detection and playlist assignment
- Support for additional playlist types

## Development Phases

### Phase 1: Setup and Basic Integration
- Project initialization
- Slack bot setup
- YouTube API integration
- Basic link detection

### Phase 2: Core Functionality
- Link processing logic
- YouTube playlist checking
- Video adding functionality
- Notification system

### Phase 3: Testing and Refinement
- Unit testing
- Integration testing
- Error handling
- Performance optimization

### Phase 4: Deployment
- Render deployment
- Monitoring setup
- Documentation
- User guide

## Success Criteria
- Bot successfully detects YouTube links in monitored channels
- Bot correctly identifies if videos exist in the YouTube playlists
- Bot successfully adds new videos to the appropriate playlist
- Bot sends appropriate notifications to the designated Slack channel
- System handles errors gracefully
- System performs efficiently with minimal latency

## Dependencies
- Slack workspace with appropriate permissions
- YouTube channel with API access and playlists
- Render account for deployment
- Required API keys and tokens

## Notes
- All sensitive information (API keys, tokens) will be stored as environment variables
- The bot will be deployed as a containerized application on Render
- Regular backups of the database will be implemented
- Monitoring and logging will be set up for production deployment
- The repository will be public, so all sensitive information must be properly secured
- A comprehensive `.gitignore` file will be included to prevent accidental commits of sensitive data 