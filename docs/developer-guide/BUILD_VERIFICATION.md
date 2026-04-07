# Build Verification Guide

Quick reference for verifying your builds are successful.

## ✅ How to Know Build Succeeded

### Method 1: Check Exit Code

```bash
npm run build && echo "✅ SUCCESS" || echo "❌ FAILED"
```

- If you see `✅ SUCCESS`, build worked
- If you see `❌ FAILED`, build failed

### Method 2: Check Build Artifacts

```bash
ls -lh build/
```

You should see:

```
-rw-r--r-- 1 user group 83K date main.js       ← Your plugin code
-rw-r--r-- 1 user group 379 date manifest.json ← Plugin metadata
-rw-r--r-- 1 user group 258 date styles.css    ← Plugin styles
```

**If `main.js` is missing or 0 bytes → Build failed**

### Method 3: Look for Error Messages

**Successful build output:**

```
> make-it-rain@1.7.2 build
> tsc -noEmit -skipLibCheck && node scripts/esbuild.config.mjs production
```

(That's it - clean and simple!)

**Failed build examples:**

❌ TypeScript Error:

```
src/main.ts:100:5 - error TS2322: Type 'string' is not assignable to type 'number'.
```

❌ Build Error:

```
✘ [ERROR] Could not resolve "obsidian"
```

❌ Command Not Found:

```
bash: tsc: command not found
```

## 🧪 Full Verification Checklist

Run these commands in order:

```bash
# 1. Clean build
rm -rf build/
npm run build

# 2. Check exit code
echo $?
# Should be: 0

# 3. Check files exist
ls build/main.js build/manifest.json build/styles.css
# All three should exist

# 4. Check main.js size
ls -lh build/main.js
# Should be ~80-85KB (anything > 0 is good)

# 5. Run tests
npm test
# Should show: Tests: ### passed

# 6. Check for warnings
npm run build 2>&1 | grep -i "warning\|error"
# Should be empty or only minor warnings
```

## 🐛 Common Build Issues

### "Cannot find module 'obsidian'"

**Fix:**

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### "tsc: command not found"

**Fix:**

```bash
npm install
```

### Build succeeds but main.js is 0 bytes

**Fix:**

```bash
# Check esbuild ran
npm run build 2>&1 | grep esbuild

# If not found, run manually
node scripts/esbuild.config.mjs production
```

### TypeScript errors

**Fix:**

```bash
# See detailed errors
npx tsc

# Check specific file
npx tsc --noEmit src/main.ts
```

## 📊 Build Scripts Overview

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run build` | Production build | Before release |
| `npm run dev` | Development watch mode | During development |
| `npm run build-and-copy` | Build + copy to vault | Testing in Obsidian |

## 🎯 Quick Commands

```bash
# Full verification
npm run build && npm test && echo "✅ All good!"

# Build and check size
npm run build && ls -lh build/main.js

# Clean build
rm -rf build/ && npm run build

# Build with timing
time npm run build
```

## ✨ Success Indicators

Your build is successful when you see:

✅ **Exit code 0**
✅ **No error messages in output**
✅ **build/main.js exists and is ~80KB+**
✅ **build/manifest.json exists**
✅ **build/styles.css exists**
✅ **All tests pass (`npm test`)**

## 🚨 Failure Indicators

Your build failed if you see:

❌ **Exit code != 0**
❌ **Red error messages in terminal**
❌ **build/main.js is missing or 0 bytes**
❌ **TypeScript compilation errors**
❌ **"command not found" errors**

---

**Quick Test:** Run `npm run build && npm test` - if both complete without errors, you're good! ✅
