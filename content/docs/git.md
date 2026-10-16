---
title: "Git and GitHub setup"
description: "Set up version control for a project, once, then save your work every day."
group: "BUILD & REVIEW"
order: 62
status: draft
---

Git saves every version of your project, so you can show what changed and go back when something breaks. GitHub keeps a copy online, so a reviewer can open it.

## 1. Install and introduce yourself {#install}

Install Git from the official site for your system. Then tell Git your name and an email address. Use the email you use for your GitHub account:

```bash
git config --global user.name "Your name"
git config --global user.email "you@example.com"
```

## 2. Start a repository {#start}

In your project folder, start the repository and save the first version:

```bash
git init
git add .
git commit -m "Start the project"
```

## 3. Make a daily habit {#daily}

After each work session, check what changed, then save it with a short message that says what you did:

```bash
git status
git add .
git commit -m "Add the temperature log"
```

## 4. Keep build files out of Git {#gitignore}

Some files should never be saved: installed packages, build output and secrets such as passwords or keys. Put their names in a `.gitignore` file in the project folder. Never put a key or password in a repository, even for a moment.

## 5. Put it on GitHub {#github}

Create an empty repository on GitHub, then connect your folder to it and send your saved versions up:

```bash
git remote add origin https://github.com/your-name/your-project.git
git push -u origin main
```

Your repository is then public or private, as you choose. A reviewer needs to be able to open the code, so make sure it is public when you submit.
