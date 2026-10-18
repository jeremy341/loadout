---
title: "Git and GitHub setup"
description: "Save your work with Git and put it somewhere other people can open it."
group: "BUILD & REVIEW"
order: 62
status: draft
---

Ever changed something that worked, broken it and forgotten what you touched? Git helps with that. It saves checkpoints of your project, called commits, so you can compare a broken version with one that worked. Once you put those commits on GitHub, other people can open the source too. That gives your reviewer both the current project and a history of how you got there.

## 1. Tell Git who you are {#install}

Install Git for your system, then set the name and email it will attach to your commits. Use the email associated with your GitHub account:

```bash
git config --global user.name "Your name"
git config --global user.email "you@example.com"
```

This tells Git whose name to put on your commits. You haven't signed into GitHub yet; that happens when you upload the work later in this guide.

## 2. Leave out generated files and secrets {#gitignore}

Before saving the first checkpoint, create a `.gitignore` in the project folder. It tells Git to leave out things like installed packages, build output and local configuration containing secrets. The exact names depend on your tools, so check what your project generates.

This is worth doing before the first commit. Deleting a password from the latest file doesn't remove it from older commits. Keep API keys and passwords out of the repository from the start.

## 3. Save the first version {#start}

Open a terminal in the project folder and initialize Git:

```bash
git init
git status
```

Read the files listed by `git status`. If anything shouldn't be public, fix the ignore file before adding it. Once the list looks right, save the first version:

```bash
git add .
git commit -m "Start the project"
```

That's your first checkpoint saved. If something goes wrong later, you'll have this version to look back at. The next step is to keep making those checkpoints as the project grows.

## 4. Keep saving as you build {#daily}

Make another commit when you finish a useful piece of work, such as getting a sensor read or adding a test. Check the files before each commit, then give it a message that describes the change:

```bash
git status
git add .
git commit -m "Add the temperature log"
```

Why bother with a useful message? A few months from now, “Add the temperature log” will help you find that change. “Stuff” probably won't. When a commit helps explain something in your journal, link it there too, so the reader can go straight from the decision to the code.

## 5. Put it on GitHub {#github}

Create an empty repository on GitHub. Then connect your local folder and upload its commits, replacing the example URL with your repository's URL:

```bash
git branch -M main
git remote add origin https://github.com/your-name/your-project.git
git push -u origin main
```

After that, `git push` uploads new commits. Before shipping, make the repository public and open the link while signed out. If someone else can see the source, README and files they need, you're ready to use it in your [submission](/docs/submitting).
