# Indonesian Expats Directory 🇮🇩→🇲🇾

A community-driven directory for Indonesian expats in Malaysia. Built with Jekyll and Netlify Forms.

## Features
- Modern, responsive design
- Community submissions via Netlify Forms
- Admin approval workflow
- Search functionality
- Category filtering
- WhatsApp integration

## Setup Instructions

### 1. Fork and Deploy
1. Fork this repository to your GitHub account
2. Go to [Netlify](https://app.netlify.com) → "New site from Git"
3. Select your repository
4. Build command: `bundle exec jekyll build`
5. Publish directory: `_site`
6. Deploy!

### 2. Configure Netlify Forms
1. In Netlify dashboard → Forms
2. Enable form detection
3. Set up notifications (optional)

### 3. Customize
1. Update `_config.yml` with your site details
2. Modify categories in `_data/categories.yml`
3. Add initial contacts in `_contacts/` folder
4. Change colors in `assets/css/style.css`

### 4. Admin Panel
Default password: `indoexpats2024`
Change in `admin/index.html` line 276

## How to Add Contacts Manually
Create a markdown file in `_contacts/` folder:

```markdown
---
title: "Service Name"
category: "category-slug"
contact_person: "Name"
phone: "+60123456789"
whatsapp: "+60123456789"
location: "City"
verified: true
---

Description goes here...