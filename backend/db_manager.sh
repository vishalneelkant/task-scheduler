#!/bin/bash

# Database Backup and Restore Script
# This script helps you backup and restore your Task Scheduler database

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DB_PATH="$SCRIPT_DIR/instance/tasks.db"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

show_usage() {
    echo "Database Backup and Restore Utility"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  backup          Create a backup of the current database"
    echo "  list            List all available backups"
    echo "  restore [file]  Restore database from a backup file"
    echo "  verify          Verify current database status"
    echo "  help            Show this help message"
    echo ""
}

backup_database() {
    if [ ! -f "$DB_PATH" ]; then
        echo -e "${RED}❌ Database file not found at: $DB_PATH${NC}"
        exit 1
    fi
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/tasks_backup_$TIMESTAMP.db"
    
    echo -e "${YELLOW}Creating backup...${NC}"
    cp "$DB_PATH" "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        echo -e "${GREEN}✅ Backup created successfully!${NC}"
        echo "   Location: $BACKUP_FILE"
        echo "   Size: $FILE_SIZE"
    else
        echo -e "${RED}❌ Backup failed!${NC}"
        exit 1
    fi
}

list_backups() {
    echo -e "${YELLOW}Available backups:${NC}"
    echo ""
    
    if ! ls "$BACKUP_DIR"/*.db >/dev/null 2>&1; then
        echo "   No backups found."
        echo "   Run '$0 backup' to create your first backup."
        return
    fi
    
    for file in "$BACKUP_DIR"/*.db; do
        if [ -f "$file" ]; then
            FILENAME=$(basename "$file")
            SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            SIZE_KB=$((SIZE / 1024))
            DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d. -f1)
            echo "   📦 $FILENAME (${SIZE_KB} KB) - $DATE"
        fi
    done
}

restore_database() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Please specify a backup file to restore${NC}"
        echo "Usage: $0 restore [backup_filename]"
        echo ""
        list_backups
        exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
        echo ""
        list_backups
        exit 1
    fi
    
    # Create a backup of current database before restoring
    if [ -f "$DB_PATH" ]; then
        SAFETY_BACKUP="$BACKUP_DIR/before_restore_$(date +%Y%m%d_%H%M%S).db"
        echo -e "${YELLOW}Creating safety backup of current database...${NC}"
        cp "$DB_PATH" "$SAFETY_BACKUP"
        echo "   Saved to: $SAFETY_BACKUP"
    fi
    
    echo -e "${YELLOW}Restoring database from backup...${NC}"
    cp "$BACKUP_FILE" "$DB_PATH"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database restored successfully!${NC}"
        echo "   From: $BACKUP_FILE"
        echo "   To: $DB_PATH"
        echo ""
        echo "You can now start the server to use the restored data."
    else
        echo -e "${RED}❌ Restore failed!${NC}"
        exit 1
    fi
}

verify_database() {
    python3 "$SCRIPT_DIR/verify_database.py"
}

# Main script logic
case "$1" in
    backup)
        backup_database
        ;;
    list)
        list_backups
        ;;
    restore)
        restore_database "$2"
        ;;
    verify)
        verify_database
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        if [ -z "$1" ]; then
            show_usage
        else
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo ""
            show_usage
            exit 1
        fi
        ;;
esac

