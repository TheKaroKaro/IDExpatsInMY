
# Expat Contacts Directory

A simple, modern directory for expats to find and share trusted service contacts.

## Features
- Modern, responsive design
- Disqus comments on each contact
- Telegram bot integration for submissions
- Easy maintenance with Jekyll
- Free hosting on GitHub Pages

## Setup Instructions

### 1. Disqus Comments
1. Create a Disqus account at https://disqus.com
2. Create a new site in Disqus
3. Get your shortname from Disqus settings
4. Update `_config.yml`:
   ```yaml
   disqus:
     shortname: "your-shortname-here"
     enabled: true