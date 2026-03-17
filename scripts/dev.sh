#!/bin/bash

# 🚀 Portfolio 3D - Dev Helper Script

set -e

echo "🌌 Portfolio 3D - Development Helper"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
start_dev() {
    echo -e "${BLUE}Starting dev server on port 3024...${NC}"
    npm run dev
}

build() {
    echo -e "${BLUE}Building for production...${NC}"
    npm run build
    echo -e "${GREEN}✅ Build complete! Output in dist/${NC}"
}

preview() {
    echo -e "${BLUE}Previewing production build...${NC}"
    npm run preview
}

lint() {
    echo -e "${BLUE}Running ESLint...${NC}"
    npm run lint
}

clean() {
    echo -e "${YELLOW}Cleaning cache and build files...${NC}"
    rm -rf dist node_modules/.vite
    echo -e "${GREEN}✅ Clean complete!${NC}"
}

check_deps() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    npm outdated || true
}

typecheck() {
    echo -e "${BLUE}Running TypeScript type check...${NC}"
    npx tsc --noEmit
    echo -e "${GREEN}✅ No type errors!${NC}"
}

test_build() {
    echo -e "${BLUE}Testing build process...${NC}"
    npm run build
    echo -e "${BLUE}Testing preview...${NC}"
    npm run preview &
    PREVIEW_PID=$!
    sleep 3
    echo -e "${GREEN}✅ Build test complete!${NC}"
    kill $PREVIEW_PID 2>/dev/null || true
}

help() {
    cat << EOF
Usage: ./scripts/dev.sh [command]

Commands:
  start       Start dev server (default)
  build       Build for production
  preview     Preview production build
  lint        Run ESLint
  clean       Clean cache and build files
  check-deps  Check for outdated dependencies
  typecheck   Run TypeScript type checking
  test-build  Test full build process
  help        Show this help

Examples:
  ./scripts/dev.sh          # Start dev server
  ./scripts/dev.sh build    # Build for production
  ./scripts/dev.sh clean    # Clean cache
EOF
}

# Main
case "${1:-start}" in
    start)
        start_dev
        ;;
    build)
        build
        ;;
    preview)
        preview
        ;;
    lint)
        lint
        ;;
    clean)
        clean
        ;;
    check-deps)
        check_deps
        ;;
    typecheck)
        typecheck
        ;;
    test-build)
        test_build
        ;;
    help)
        help
        ;;
    *)
        echo -e "${YELLOW}Unknown command: $1${NC}"
        help
        exit 1
        ;;
esac
