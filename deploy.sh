#!/bin/bash

echo "========================================"
echo "  MAXVY Auto Deploy to Render"
echo "========================================"
echo ""

# Check if there are changes
if ! git diff --quiet; then
    echo "Changes detected! Preparing to deploy..."
    echo ""
    
    # Show changes
    echo "Modified files:"
    git status --short
    echo ""
    
    # Get commit message
    read -p "Enter commit message (or press Enter for default): " commit_msg
    if [ -z "$commit_msg" ]; then
        commit_msg="Update: Auto-deploy to Render"
    fi
    
    echo ""
    echo "Commit message: $commit_msg"
    echo ""
    
    # Add all changes
    echo "Adding all changes..."
    git add .
    
    # Commit
    echo "Committing changes..."
    git commit -m "$commit_msg"
    
    # Push to GitHub (which triggers Render auto-deploy)
    echo ""
    echo "Pushing to GitHub..."
    echo "This will trigger auto-deploy on Render!"
    echo ""
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "========================================"
        echo "  ✅ SUCCESS! Deployment Triggered"
        echo "========================================"
        echo ""
        echo "Your changes have been pushed to GitHub."
        echo "Render will automatically deploy in ~5-10 minutes."
        echo ""
        echo "Check deployment status at:"
        echo "https://dashboard.render.com"
        echo ""
    else
        echo ""
        echo "========================================"
        echo "  ❌ ERROR: Push Failed"
        echo "========================================"
        echo ""
        echo "Please check your internet connection"
        echo "and GitHub credentials."
        echo ""
    fi
else
    echo "No changes detected. Nothing to deploy."
fi
